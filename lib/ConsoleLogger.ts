// IMPORTS
// ================================================================================================
import * as http from 'http';
import * as colors from 'colors';
import * as onFinished from 'on-finished';
import { SeverityLevel, Color } from './common';
import { since } from './util';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_PREFIX_OPTIONS: PrefixOptions = {
    name        : true
};

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
    errors      : 'stack',
    events      : true,
    metrics     : true,
    services    : true,
    requests    : true
};

const DEFAULT_CONSOLE_OPTIONS: ConsoleOptions = {
    prefix      : DEFAULT_PREFIX_OPTIONS,
    formats     : DEFAULT_FORMAT_OPTIONS
};

// ENUMS AND INTERFACES
// ================================================================================================
export interface ConsoleOptions {
    prefix?     : PrefixOptions;
    formats?    : FormatOptions;
    color?      : Color | ColorOptions;
}

interface PrefixOptions {
    name?       : boolean;
    time?       : boolean;
    level?      : boolean;
}

interface ColorOptions {
    levels?     : { debug?: Color; info?: Color; warning?: Color; error?: Color; };
    services?   : { [service: string]: Color; };
}

interface FormatOptions {
    errors?		: 'message' | 'stack';
    events?     : boolean;
    metrics?    : boolean;
    services?   : boolean;
    requests?	: boolean | 'short' | 'dev';
}

// LOGGER CLASS
// ================================================================================================
export class ConsoleLogger {

    name    : string;

    private fOptions: FormatOptions;
    private prefixer: (level: SeverityLevel) => string;
    private colorizer: (message: string, level: SeverityLevel, service: string) => string;

	constructor(name: string, options: ConsoleOptions | boolean) {
		this.name = name;

        const cOptions = typeof options === 'boolean'
            ? DEFAULT_CONSOLE_OPTIONS
            : Object.assign({}, DEFAULT_CONSOLE_OPTIONS, options);

        this.prefixer   = buildPrefixer(cOptions.prefix, this.name);
        this.colorizer  = buildColorizer(cOptions.color);
        this.fOptions   = Object.assign({}, DEFAULT_FORMAT_OPTIONS, cOptions.formats);

        if (this.fOptions.requests && typeof this.fOptions.requests === 'boolean') {
            this.fOptions.requests = 'dev';
        }
	}

    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message: string) {
        this.logToConsole(message, SeverityLevel.debug);
    }

    info(message: string) {
        this.logToConsole(message, SeverityLevel.info);
    }

    warn(message: string) {
        this.logToConsole(message, SeverityLevel.warning);
    }

    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error: Error) {
        const message = this.fOptions.errors === 'stack' && error.stack
            ? error.stack
            : error.message || 'Unknown error'; 
        this.logToConsole(message, SeverityLevel.error);
    }

    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event: string, properties?: { [key: string]: any }) {
        if (this.fOptions.events) {
            const message = (properties ? `${event}: ${JSON.stringify(properties)}` : event);
            this.logToConsole(message, SeverityLevel.info);
        }
    }

    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric: string, value: number) {
        if (this.fOptions.metrics) { 
            this.logToConsole(`[${metric}=${value}]`, SeverityLevel.info);
        }
    }

    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(service: string, command: string, duration: number, success: boolean) {
        if (this.fOptions.services) {
            const message = success
                ? `[${service}]: executed [${command}] in ${duration} ms`
                : `[${service}]: failed to execute [${command}] in ${duration} ms`;
            this.logToConsole(message, SeverityLevel.info, service);
        }
    }

    // Request Logging
    // --------------------------------------------------------------------------------------------
    request(request: http.ServerRequest, response: http.ServerResponse) {
        if (this.fOptions.requests) {
            const start = process.hrtime();
            onFinished(response, () => {
                const format = this.fOptions.requests as string
                const line = buildRequestLine(request, response, since(start), format);
                this.logToConsole(line, SeverityLevel.info);
            });
        }
    }

    // Private Methods
    // --------------------------------------------------------------------------------------------
    private logToConsole(message: string, level: SeverityLevel, service?: string) {
        if (!message || !level) return;

        // build prefix
        if (this.prefixer) {
            message = `${this.prefixer(level)}: ${message}`;
        }

        // colorize the message
        if (this.colorizer) {
            message = this.colorizer(message, level, service);
        }

        // print the message
        switch(level) {
            case SeverityLevel.debug:
                console.log(message);
                break;
            case SeverityLevel.info:
                console.info(message);
                break;
            case SeverityLevel.warning:
                console.warn(message);
                break;
            case SeverityLevel.error:
                console.error(message);
                break; 
        }
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function buildPrefixer(optionsOrFlag: PrefixOptions | boolean, name: string) {
    if (typeof optionsOrFlag === 'boolean') {
        if (!optionsOrFlag) return;
        var options = DEFAULT_PREFIX_OPTIONS;
    }
    else {
        var options: PrefixOptions = Object.assign({}, DEFAULT_PREFIX_OPTIONS, optionsOrFlag);
        if (!options.time && !options.name && !options.level) return;
    }

    return function(level: SeverityLevel) {
        let prefix = (options.time ? `[${new Date().toISOString()}]` : '');
        
        if (options.name) {
            prefix += `[${name}]`;
        }

        if (options.level) {
            prefix += `[${level}]`;
        }

        return prefix;
    }
}

function buildColorizer(optionsOrColor: ColorOptions | Color) {
    if (!optionsOrColor) return;

    if (typeof optionsOrColor === 'string') {
        return function(message: string, level: SeverityLevel, service?: string): string {
            return applyColor(message, optionsOrColor);
        };
    }
    else {
        const options: ColorOptions = {
            levels  : optionsOrColor.levels || {},
            services: optionsOrColor.services || {}
        };

        return function(message: string, level: SeverityLevel, service?: string): string {
            const levelString = SeverityLevel[level];
            return applyColor(message, options.levels[levelString] || options.services[service]);
        };
    }
}

function applyColor(message: string, color: Color): string {
    if (!message) return;
    if (!color) return message;

    switch (color) {
        case Color.black:   return colors.black(message);
        case Color.red:     return colors.red(message);
        case Color.green:   return colors.green(message);
        case Color.yellow:  return colors.yellow(message);
        case Color.blue:    return colors.blue(message);
        case Color.magenta: return colors.magenta(message);
        case Color.cyan:    return colors.cyan(message);
        case Color.white:   return colors.white(message);
        case Color.grey:    return colors.grey(message);
        default:            throw new Error('Invalid Color');
    }
}

function buildRequestLine(request: any, response: any, duration: number, format: string): string {
    if (!request) return;
    
    const address   = request.ip || (request.connection && request.connection.remoteAddress);
    const method    = request.method;
    const url       = request.url;
    const version   = request.httpVersion;
    const status    = response.statusCode;
    const length    = response.getHeader('content-length');

    if (format === 'short') {
        return `${address} - ${method} ${url} HTTP/${version} ${status} ${length} - ${duration} ms`; 
    }
    else if (format === 'dev') {
        return `${method} ${url} ${status} ${duration} ms - ${length}`;
    }
}