"use strict";
const ApplicationInsights = require('applicationinsights');
const common_1 = require('./lib/common');
exports.SeverityLevel = common_1.SeverityLevel;
exports.Color = common_1.Color;
const ConsoleLogger_1 = require('./lib/ConsoleLogger');
// RE-EXPORTS
// ================================================================================================
// LOGGER CLASS
// ================================================================================================
class Logger {
    constructor(options) {
        this.name = options.name;
        this.level = common_1.SeverityLevel.parse(options.level) || common_1.SeverityLevel.debug;
        if (options.console) {
            this.cClient = new ConsoleLogger_1.ConsoleLogger(this.name, options.console);
        }
        if (options.telemetry) {
            validateTelemetryProvider(options.telemetry);
            this.tClient = ApplicationInsights.getClient(options.telemetry.key);
        }
    }
    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message) {
        if (this.level > common_1.SeverityLevel.debug || !message || typeof message !== 'string')
            return;
        if (this.cClient) {
            this.cClient.debug(message);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 0 /* Verbose */);
        }
    }
    info(message) {
        if (this.level > common_1.SeverityLevel.info || !message || typeof message !== 'string')
            return;
        if (this.cClient) {
            this.cClient.info(message);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 1 /* Information */);
        }
    }
    warn(message) {
        if (this.level > common_1.SeverityLevel.warning || !message || typeof message !== 'string')
            return;
        if (this.cClient) {
            this.cClient.warn(message);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 2 /* Warning */);
        }
    }
    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error) {
        if (!error || !(error instanceof Error))
            return;
        if (this.cClient) {
            this.cClient.error(error);
        }
        if (this.tClient) {
            this.tClient.trackException(error);
        }
    }
    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event, properties) {
        if (typeof event !== 'string')
            return;
        if (this.cClient) {
            this.cClient.log(event, properties);
        }
        if (this.tClient) {
            this.tClient.trackEvent(event, properties);
        }
    }
    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric, value) {
        if (!metric || typeof value !== 'number')
            return;
        if (this.cClient) {
            this.cClient.track(metric, value);
        }
        if (this.tClient) {
            this.tClient.trackMetric(metric, value);
        }
    }
    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(service, command, duration, success) {
        if (typeof service !== 'string' || typeof command !== 'string' || typeof duration !== 'number')
            return;
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
    request(request, response) {
        if (!request || !response)
            return;
        if (this.cClient) {
            this.cClient.request(request, response);
        }
        if (this.tClient) {
            this.tClient.trackRequest(request, response);
        }
    }
}
exports.Logger = Logger;
// HELPER FUNCTIONS
// ================================================================================================
function validateTelemetryProvider(options) {
    const provider = options.provider;
    if (!provider)
        throw new Error(`Telemetry provider is undefined`);
    if (provider !== 'appinsights')
        throw new Error(`Telemetry provider {${provider}} is not supported`);
}
//# sourceMappingURL=index.js.map