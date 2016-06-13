// IMPORTS
// ================================================================================================
import * as http from 'http';
import * as ApplicationInsights from 'applicationinsights';
import { SeverityLevel, Color } from './lib/common';
import { ConsoleLogger, ConsoleOptions } from './lib/ConsoleLogger';

// RE-EXPORTS
// ================================================================================================
export { SeverityLevel, Color };

// ENUMS AND INTERFACES
// ================================================================================================
export interface Options {
    name        : string;
    level?      : SeverityLevel | string;
    console?    : ConsoleOptions | boolean;
    telemetry?  : TelemetryOptions;
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
    private cClient : ConsoleLogger;

	constructor(options: Options) {
		this.name = options.name;
        this.level = SeverityLevel.parse(options.level) || SeverityLevel.debug;

        if (options.console) {
            this.cClient = new ConsoleLogger(this.name, options.console);
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

        if (this.cClient) {
            this.cClient.debug(message);
        }
        
        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Verbose);
        }
    }

    info(message: string) {
        if (this.level > SeverityLevel.info || !message || typeof message !== 'string') return;

        if (this.cClient) {
            this.cClient.info(message);
        }

        if (this.tClient) {
            this.tClient.trackTrace(message, ContractsModule.SeverityLevel.Information);
        }
    }

    warn(message: string) {
        if (this.level > SeverityLevel.warning || !message || typeof message !== 'string') return;

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
        if (!error || !(error instanceof Error)) return;

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
        if (typeof event !== 'string') return;

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
        if (!metric || typeof value !== 'number') return;

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
    request(request: http.ServerRequest, response: http.ServerResponse) {
        if (!request || !response) return;
        
        if (this.cClient) {
            this.cClient.request(request, response);
        }
        
        if (this.tClient) {
            this.tClient.trackRequest(request, response);
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