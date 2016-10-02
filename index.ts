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
    console?    : ConsoleOptions | boolean;
    telemetry?  : TelemetryOptions;
}

export interface LoggingOptions {
    messages?	: MessageLevel | string | boolean;
    errors?		: boolean;
    events?		: boolean;
    metrics?	: boolean;
    services?	: boolean | string[];
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

    private serviceWhitelist: Set<string>;

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

        if (Array.isArray(this.options.services)) {
            this.serviceWhitelist = new Set(this.options.services);
        }
	}

    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message: string) {
        if (this.options.messages > MessageLevel.debug) return;
        if (!message || typeof message !== 'string') return;

        if (this.cClient) {
            this.cClient.debug(message);
        }
        
        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Verbose);
        }
    }

    info(message: string) {
        if (!this.options.messages || this.options.messages > MessageLevel.info) return;
        if (!message || typeof message !== 'string') return;

        if (this.cClient) {
            this.cClient.info(message);
        }

        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Information);
        }
    }

    warn(message: string) {
        if (!this.options.messages || this.options.messages > MessageLevel.warning) return;
        if (!message || typeof message !== 'string') return;

        if (this.cClient) {
            this.cClient.warn(message);
        }

        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Warning);
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
    trace(service: string, command: string, duration: number, success?: boolean) {
        if (!this.options.services || (this.serviceWhitelist && !this.serviceWhitelist.has(service))) return;
        if (typeof service !== 'string' || typeof command !== 'string' || typeof duration !== 'number') return;
        success = (typeof success === 'boolean' ? success : true);

        if (this.cClient) {
            this.cClient.trace(service, command, duration, success);
        }

        if (this.tClient) {
            this.tClient.trackDependency(service, command, duration, success);
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
export function debug(message: string) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.debug(message);
}

export function info(message: string) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.info(message);
}

export function warn(message: string) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.warn(message);
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

export function trace(service: string, command: string, duration: number, success?: boolean) {
    if (!instance) throw new TypeError('Global logger has not yet been configured');
    instance.trace(service, command, duration, success);
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