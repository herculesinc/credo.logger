// IMPORTS
// ================================================================================================
import * as http from 'http';
import * as colors from 'colors';
import * as ApplicationInsights from 'applicationinsights';
import * as onFinished from 'on-finished';

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
export enum SeverityLevel { debug = 1, info, warning, error }
export namespace SeverityLevel {
    export function parse(value: SeverityLevel | string): SeverityLevel {
        if (!value) return;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return SeverityLevel[value];
    }
}

export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey';
export const Color = {
    black       : 'black' as Color,
    red         : 'red' as Color,
    green       : 'green' as Color,
    yellow      : 'yellow' as Color,
    blue        : 'blue' as Color,
    magenta     : 'magenta' as Color,
    cyan        : 'cyan' as Color,
    white       : 'white' as Color,
    grey        : 'grey' as Color
};

export interface Options {
    name        : string;
    level?      : SeverityLevel | string;
    console?    : ConsoleOptions | boolean;
    telemetry?  : TelemetryOptions;
}

interface ConsoleOptions {
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

interface TelemetryOptions {
    provider    : 'appinsights';
	key         : string;
}

// LOGGER CLASS
// ================================================================================================
export class Logger {

    name    : string;
    level   : SeverityLevel;

    private tClient : ApplicationInsights.Client;
    private fOptions: FormatOptions;
    private prefixer: (level: SeverityLevel) => string;
    private colorizer: (message: string, level: SeverityLevel, service: string) => string;

	constructor(options: Options) {
		this.name = options.name;
        this.level = SeverityLevel.parse(options.level) || SeverityLevel.debug;

        if (options.console) {
            const cOptions = typeof options.console === 'boolean'
                ? DEFAULT_CONSOLE_OPTIONS
                : Object.assign({}, DEFAULT_CONSOLE_OPTIONS, options.console);

            this.prefixer   = buildPrefixer(cOptions.prefix, this.name);
            this.colorizer  = buildColorizer(cOptions.color);
            this.fOptions   = Object.assign({}, DEFAULT_FORMAT_OPTIONS, cOptions.formats);

            if (this.fOptions.requests && typeof this.fOptions.requests === 'boolean') {
                this.fOptions.requests = 'dev';
            } 
        }
        
        if (options.telemetry) {
            validateTelemetryProvider(options.telemetry);
            this.tClient = ApplicationInsights.getClient(options.telemetry.key);
        }
	}

    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message: string) {
        if (this.level > SeverityLevel.debug || !message || typeof message !== 'string') return;

        // log to console
        if (this.fOptions) {
            this.logToConsole(message, SeverityLevel.debug);
        }
        
        // send to telemetry
        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Verbose);
        }
    }

    info(message: string) {
        if (this.level > SeverityLevel.info || !message || typeof message !== 'string') return;

        // log to console
        if (this.fOptions) {
            this.logToConsole(message, SeverityLevel.info);
        }

        // send to telemetry
        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Information);
        }
    }

    warn(message: string) {
        if (this.level > SeverityLevel.warning || !message || typeof message !== 'string') return;

        // log to console
        if (this.fOptions) {
            this.logToConsole(message, SeverityLevel.warning);
        }

        // send to telemetry
        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Warning);
        }
    }

    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error: Error) {
        if (!error || !(error instanceof Error)) return;

        // log to console
        if (this.fOptions) {
            const message = this.fOptions.errors === 'stack' && error.stack
                ? error.stack
                : error.message || 'Unknown error'; 
            this.logToConsole(message, SeverityLevel.error);
        }

        // send error to telemetry
        if (this.tClient) {
            this.tClient.trackException(error);
        }
    }

    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event: string, properties?: { [key: string]: any }) {
        if (typeof event !== 'string') return;

        // log to console
        if (this.fOptions && this.fOptions.events) {
            const message = (properties ? `${event}: ${JSON.stringify(properties)}` : event);
            this.logToConsole(message, SeverityLevel.info);
        }

        // send to telemetry
        if (this.tClient) {
            this.tClient.trackEvent(event, properties);
        }
    }

    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric: string, value: number) {
        if (!metric || typeof value !== 'number') return;

        // log to console
        if (this.fOptions && this.fOptions.metrics) { 
            this.logToConsole(`${metric}=${value}`, SeverityLevel.info);
        }

        // send to telemetry
        if (this.tClient) {
            this.tClient.trackMetric(metric, value);
        }
    }

    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(service: string, command: string, time: number, success?: boolean) {
        if (typeof service !== 'string' || typeof command !== 'string' || typeof time !== 'number') return;
        success = (typeof success === 'boolean' ? success : true);

        // log to console
        if (this.fOptions && this.fOptions.services) {
            const message = success
                ? `[${service}]: executed {${command}} in ${time} ms`
                : `[${service}]: failed to execute {${command}} in ${time} ms`;

            this.logToConsole(message, SeverityLevel.info, service);
        }

        // send to telemetry
        if (this.tClient) {
            this.tClient.trackDependency(service, command, time, success);
        }
    }

    // Request Logging
    // --------------------------------------------------------------------------------------------
    request(request: http.ServerRequest, response: http.ServerResponse) {

        // log to console
        if (this.fOptions && this.fOptions.requests) {
            const start = process.hrtime();
            onFinished(response, () => {
                const format = this.fOptions.requests as string
                const line = buildRequestLine(request, response, since(start), format);
                this.logToConsole(line, SeverityLevel.info);
            });
        }
        
        // send telemetry
        if (this.tClient) {
            this.tClient.trackRequest(request, response);
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
function validateTelemetryProvider(options: TelemetryOptions) {
    const provider = options.provider;
    if (!provider) throw new Error(`Telemetry provider is undefined`);
    if (provider !== 'appinsights') throw new Error(`Telemetry provider {${provider}} is not supported`);
}

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

function since(start: number[]) {
    const diff = process.hrtime(start);
    return (diff[0] * 1000 + Math.round(diff[1] / 1000) / 1000);
}