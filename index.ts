// IMPORTS
// ================================================================================================
import * as http from 'http';
import * as ApplicationInsights from 'applicationinsights';
import { MessageLevel, Color } from './lib/common';
import { ConsoleLogger, ConsoleOptions } from './lib/ConsoleLogger';

// RE-EXPORTS
// ================================================================================================
export { MessageLevel, Color };

// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LOGGING_OPTIONS: LoggingOptions = {
    messages	: MessageLevel.debug,
    errors		: true,
    events		: true,
    metrics	    : true,
    services	: true,
    requests	: true
};

var instance: Logger;

// ENUMS AND INTERFACES
// ================================================================================================
export interface Options {
    name        : string;
    log?		: LoggingOptions;
    sources?    : string[]; 
    console?    : ConsoleOptions | boolean;
    telemetry?  : TelemetryOptions;
}

export interface LoggingOptions {
    messages?	: MessageLevel | string | boolean;
    errors?		: boolean;
    events?		: boolean;
    metrics?	: boolean;
    services?	: boolean;
    requests?	: boolean;
}

interface TelemetryOptions {
    provider    : 'appinsights';
	key         : string;
}

// LOGGER CLASS
// ================================================================================================
export class Logger {

    name    : string;
    options : LoggingOptions;
    
    private cClient : ConsoleLogger;
    private tClient : ApplicationInsights.Client;

    private whitelist: Set<string>;

	constructor(options: Options) {
		this.name = options.name;
        this.options = Object.assign({}, DEFAULT_LOGGING_OPTIONS, options.log);
        this.options.messages = MessageLevel.parse(this.options.messages);

        if (options.console) {
            this.cClient = new ConsoleLogger(this.name, options.console);
        }
        
        if (options.telemetry) {
            validateTelemetryProvider(options.telemetry);
            this.tClient = ApplicationInsights.getClient(options.telemetry.key);
        }

        if (options.sources) {
            if (!Array.isArray(options.sources)) throw new TypeError('sources option must be an array');
            this.whitelist = new Set(options.sources);
        }
	}

    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message: string, source?: string) {
        if (this.options.messages > MessageLevel.debug) return;
        if (!message || typeof message !== 'string') return;
        if (source && this.whitelist && !this.whitelist.has(source)) return;

        if (this.cClient) {
            this.cClient.debug(message, source);
        }
        
        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Verbose, source
                ? { name: this.name, source: source }
                : { name: this.name }
            );
        }
    }

    info(message: string, source?: string) {
        if (!this.options.messages || this.options.messages > MessageLevel.info) return;
        if (!message || typeof message !== 'string') return;
        if (source && this.whitelist && !this.whitelist.has(source)) return;

        if (this.cClient) {
            this.cClient.info(message, source);
        }

        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Information, source
                ? { name: this.name, source: source }
                : { name: this.name }
            );
        }
    }

    warn(message: string, source?: string) {
        if (!this.options.messages || this.options.messages > MessageLevel.warning) return;
        if (!message || typeof message !== 'string') return;
        if (source && this.whitelist && !this.whitelist.has(source)) return;

        if (this.cClient) {
            this.cClient.warn(message, source);
        }

        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Warning, source
                ? { name: this.name, source: source }
                : { name: this.name }
            );
        }
    }

    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error: Error) {
        if (!this.options.errors || !error || !(error instanceof Error)) return;

        if (this.cClient) {
            this.cClient.error(error);
        }

        if (this.tClient) {
            this.tClient.trackException(error);
        }
    }

    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event: string, properties?: { [key: string]: any }) {
        if (!this.options.events || typeof event !== 'string') return;

        if (this.cClient) {
            this.cClient.log(event, properties);
        }

        if (this.tClient) {
            this.tClient.trackEvent(event, properties);
        }
    }

    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric: string, value: number) {
        if (!this.options.metrics || !metric || typeof value !== 'number') return;

        if (this.cClient) { 
            this.cClient.track(metric, value);
        }

        if (this.tClient) {
            this.tClient.trackMetric(metric, value);
        }
    }

    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(source: string, command: string, duration: number, success?: boolean) {
        if (!this.options.services || (this.whitelist && !this.whitelist.has(source))) return;
        if (typeof source !== 'string' || typeof command !== 'string' || typeof duration !== 'number') return;
        success = (typeof success === 'boolean' ? success : true);

        if (this.cClient) {
            this.cClient.trace(source, command, duration, success);
        }

        if (this.tClient) {
            this.tClient.trackDependency(source, command, duration, success);
        }
    }

    // Request Logging
    // --------------------------------------------------------------------------------------------
    request(request: http.IncomingMessage, response: http.ServerResponse) {
        if (!this.options.requests || !request || !response) return;
        
        if (this.cClient) {
            this.cClient.request(request, response);
        }
        
        if (this.tClient) {
            this.tClient.trackRequest(request, response);
        }
    }

    // Flush Telemetry
    // --------------------------------------------------------------------------------------------
    flush(callback: () => void) {
        if (this.tClient) {
            this.tClient.sendPendingData(callback);
        }
        else {
            callback();
        }
    }
}

// SINGLETON MEMBERS
// ================================================================================================
export function configure(options: Options): Logger {
    if (instance) throw new TypeError('Global logger has already been configured');
    instance = new Logger(options);
    return instance;
}

export function getInstance(): Logger {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    return instance;
}

// PASS-THROUGH FUNCTIONS
// --------------------------------------------------------------------------------------------
export function debug(message: string, source?: string) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.debug(message, source);
}

export function info(message: string, source?: string) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.info(message, source);
}

export function warn(message: string, source?: string) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.warn(message, source);
}

export function error(error: Error) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.error(error);
}

export function log(event: string, properties?: { [key: string]: any }) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.log(event, properties);
}

export function track(metric: string, value: number) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.track(metric, value);
}

export function trace(source: string, command: string, duration: number, success?: boolean) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.trace(source, command, duration, success);
}

export function request(request: http.IncomingMessage, response: http.ServerResponse) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.request(request, response);
}

// HELPER FUNCTIONS
// ================================================================================================
function validateTelemetryProvider(options: TelemetryOptions) {
    const provider = options.provider;
    if (!provider) throw new TypeError(`Telemetry provider is undefined`);
    if (provider !== 'appinsights') throw new TypeError(`Telemetry provider {${provider}} is not supported`);
}