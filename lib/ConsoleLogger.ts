// IMPORTS
// ================================================================================================
import * as http from 'http';
import * as colors from 'colors';
import * as onFinished from 'on-finished';
import { MessageLevel, Color } from './common';
import { since } from './util';

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_PREFIX_OPTIONS: PrefixOptions = {
    name        : true
};

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
    error       : 'stack',
    request     : 'short'
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
    stream?     : boolean;
}

interface ColorOptions {
    severity?   : { debug?: Color; info?: Color; warning?: Color; error?: Color; };
    services?   : { [service: string]: Color; };
}

interface FormatOptions {
    error?		: 'message' | 'stack';
    request?	: 'short' | 'dev';
}

enum ConsoleStream {
    debug = 1, info, warning, error
}

interface Prefixer {
    (stream: ConsoleStream, service?: string): string;
}

interface Colorizer {
    (message: string, stream: ConsoleStream, service: string): string;
}

// LOGGER CLASS
// ================================================================================================
export class ConsoleLogger {

    name    : string;

    private fOptions    : FormatOptions;
    private prefixer    : Prefixer;
    private colorizer   : Colorizer;

	constructor(name: string, options: ConsoleOptions | boolean) {
		this.name = name;

        const cOptions = typeof options === 'boolean'
            ? DEFAULT_CONSOLE_OPTIONS
            : Object.assign({}, DEFAULT_CONSOLE_OPTIONS, options);

        this.prefixer   = buildPrefixer(cOptions.prefix, this.name);
        this.colorizer  = buildColorizer(cOptions.color);
        this.fOptions   = Object.assign({}, DEFAULT_FORMAT_OPTIONS, cOptions.formats);
	}

    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message: string) {
        this.logToConsole(message, ConsoleStream.debug);
    }

    info(message: string) {
        this.logToConsole(message, ConsoleStream.info);
    }

    warn(message: string) {
        this.logToConsole(message, ConsoleStream.warning);
    }

    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error: Error) {
        const message = this.fOptions.error === 'stack' && error.stack
            ? error.stack
            : error.message || 'Unknown error'; 
        this.logToConsole(message, ConsoleStream.error);
    }

    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event: string, properties?: { [key: string]: any }) {
        const message = (properties ? `${event}: ${JSON.stringify(properties)}` : event);
        this.logToConsole(message, ConsoleStream.info);
    }

    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric: string, value: number) {
        this.logToConsole(`[${metric}=${value}]`, ConsoleStream.info);
    }

    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(service: string, command: string, duration: number, success: boolean) {
        const message = success
            ? `executed [${command}] in ${duration} ms`
            : `failed to execute [${command}] in ${duration} ms`;
        this.logToConsole(message, ConsoleStream.info, service);
    }

    // Request Logging
    // --------------------------------------------------------------------------------------------
    request(request: http.IncomingMessage, response: http.ServerResponse) {
        const start = process.hrtime();
        onFinished(response, () => {
            const line = buildRequestLine(request, response, since(start), this.fOptions.request);
            this.logToConsole(line, ConsoleStream.info);
        });
    }

    // Private Methods
    // --------------------------------------------------------------------------------------------
    private logToConsole(message: string, stream: ConsoleStream, service?: string) {
        if (!message || !stream) return;

        // build prefix
        if (this.prefixer) {
            message = `${this.prefixer(stream, service)}: ${message}`;
        }

        // colorize the message
        if (this.colorizer) {
            message = this.colorizer(message, stream, service);
        }

        // print the message
        switch(stream) {
            case ConsoleStream.debug:
                console.log(message);
                break;
            case ConsoleStream.info:
                console.info(message);
                break;
            case ConsoleStream.warning:
                console.warn(message);
                break;
            case ConsoleStream.error:
                console.error(message);
                break; 
        }
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function buildPrefixer(optionsOrFlag: PrefixOptions | boolean, name: string): Prefixer {
    if (typeof optionsOrFlag === 'boolean') {
        if (!optionsOrFlag) return;
        var options = DEFAULT_PREFIX_OPTIONS;
    }
    else {
        var options: PrefixOptions = Object.assign({}, DEFAULT_PREFIX_OPTIONS, optionsOrFlag);
        if (!options.time && !options.name && !options.stream) return;
    }

    return function(stream: ConsoleStream, service?: string) {
        let prefix = (options.time ? `[${new Date().toISOString()}]` : '');
        
        if (options.name) {
            prefix += `[${name}]`;
        }

        if (options.stream) {
            prefix += `[${ConsoleStream[stream]}]`;
        }

        if (service) {
            prefix += `[${service}]`;
        }

        return prefix;
    }
}

function buildColorizer(optionsOrColor: ColorOptions | Color): Colorizer {
    if (!optionsOrColor) return;

    if (typeof optionsOrColor === 'string') {
        return function(message: string, stream: ConsoleStream, service?: string): string {
            return applyColor(message, optionsOrColor as Color);
        };
    }
    else {
        const options: ColorOptions = {
            severity: optionsOrColor.severity || {},
            services: optionsOrColor.services || {}
        };

        return function(message: string, stream: ConsoleStream, service?: string): string {
            const severity = ConsoleStream[stream];
            return applyColor(message, options.severity[severity] || options.services[service]);
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
    const url       = request.path || request.url;
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