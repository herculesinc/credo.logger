"use strict";
const ApplicationInsights = require('applicationinsights');
const common_1 = require('./lib/common');
exports.MessageLevel = common_1.MessageLevel;
exports.Color = common_1.Color;
const ConsoleLogger_1 = require('./lib/ConsoleLogger');
// RE-EXPORTS
// ================================================================================================
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_LOGGING_OPTIONS = {
    messages: common_1.MessageLevel.debug,
    errors: true,
    events: true,
    metrics: true,
    services: true,
    requests: true
};
var instance;
// LOGGER CLASS
// ================================================================================================
class Logger {
    constructor(options) {
        this.name = options.name;
        this.options = Object.assign({}, DEFAULT_LOGGING_OPTIONS, options.log);
        this.options.messages = common_1.MessageLevel.parse(this.options.messages);
        if (options.console) {
            this.cClient = new ConsoleLogger_1.ConsoleLogger(this.name, options.console);
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
    debug(message) {
        if (this.options.messages > common_1.MessageLevel.debug)
            return;
        if (!message || typeof message !== 'string')
            return;
        if (this.cClient) {
            this.cClient.debug(message);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 0 /* Verbose */);
        }
    }
    info(message) {
        if (!this.options.messages || this.options.messages > common_1.MessageLevel.info)
            return;
        if (!message || typeof message !== 'string')
            return;
        if (this.cClient) {
            this.cClient.info(message);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 1 /* Information */);
        }
    }
    warn(message) {
        if (!this.options.messages || this.options.messages > common_1.MessageLevel.warning)
            return;
        if (!message || typeof message !== 'string')
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
        if (!this.options.errors || !error || !(error instanceof Error))
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
        if (!this.options.events || typeof event !== 'string')
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
        if (!this.options.metrics || !metric || typeof value !== 'number')
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
        if (!this.options.services || (this.serviceWhitelist && !this.serviceWhitelist.has(service)))
            return;
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
        if (!this.options.requests || !request || !response)
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
// SINGLETON MEMBERS
// ================================================================================================
function configure(options) {
    if (instance)
        throw new TypeError('Instance logger has already been configured');
    instance = new Logger(options);
    return instance;
}
exports.configure = configure;
function getInstance() {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    return instance;
}
exports.getInstance = getInstance;
// PASS-THROUGH FUNCTIONS
// --------------------------------------------------------------------------------------------
function debug(message) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.debug(message);
}
exports.debug = debug;
function info(message) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.info(message);
}
exports.info = info;
function warn(message) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.warn(message);
}
exports.warn = warn;
function error(error) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.error(error);
}
exports.error = error;
function log(event, properties) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.log(event, properties);
}
exports.log = log;
function track(metric, value) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.track(metric, value);
}
exports.track = track;
function trace(service, command, duration, success) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.trace(service, command, duration, success);
}
exports.trace = trace;
function request(request, response) {
    if (!instance)
        throw new TypeError('Instance logger has not yet been configured');
    instance.request(request, response);
}
exports.request = request;
// HELPER FUNCTIONS
// ================================================================================================
function validateTelemetryProvider(options) {
    const provider = options.provider;
    if (!provider)
        throw new TypeError(`Telemetry provider is undefined`);
    if (provider !== 'appinsights')
        throw new TypeError(`Telemetry provider {${provider}} is not supported`);
}
//# sourceMappingURL=index.js.map