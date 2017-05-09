"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ApplicationInsights = require("applicationinsights");
const common_1 = require("./lib/common");
exports.MessageLevel = common_1.MessageLevel;
exports.Color = common_1.Color;
const ConsoleLogger_1 = require("./lib/ConsoleLogger");
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
        if (options.sources) {
            if (!Array.isArray(options.sources))
                throw new TypeError('sources option must be an array');
            this.whitelist = new Set(options.sources);
        }
    }
    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message, source) {
        if (this.options.messages > common_1.MessageLevel.debug)
            return;
        if (!message || typeof message !== 'string')
            return;
        if (source && this.whitelist && !this.whitelist.has(source))
            return;
        if (this.cClient) {
            this.cClient.debug(message, source);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 0 /* Verbose */, source
                ? { name: this.name, source: source }
                : { name: this.name });
        }
    }
    info(message, source) {
        if (!this.options.messages || this.options.messages > common_1.MessageLevel.info)
            return;
        if (!message || typeof message !== 'string')
            return;
        if (source && this.whitelist && !this.whitelist.has(source))
            return;
        if (this.cClient) {
            this.cClient.info(message, source);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 1 /* Information */, source
                ? { name: this.name, source: source }
                : { name: this.name });
        }
    }
    warn(message, source) {
        if (!this.options.messages || this.options.messages > common_1.MessageLevel.warning)
            return;
        if (!message || typeof message !== 'string')
            return;
        if (source && this.whitelist && !this.whitelist.has(source))
            return;
        if (this.cClient) {
            this.cClient.warn(message, source);
        }
        if (this.tClient) {
            this.tClient.trackTrace(message, 2 /* Warning */, source
                ? { name: this.name, source: source }
                : { name: this.name });
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
    trace(source, command, duration, success) {
        if (!this.options.services || (this.whitelist && !this.whitelist.has(source)))
            return;
        if (typeof source !== 'string' || typeof command !== 'string' || typeof duration !== 'number')
            return;
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
    // Flush Telemetry
    // --------------------------------------------------------------------------------------------
    flush(callback) {
        if (this.tClient) {
            this.tClient.sendPendingData(callback);
        }
        else {
            callback();
        }
    }
}
exports.Logger = Logger;
// SINGLETON MEMBERS
// ================================================================================================
function configure(options) {
    if (instance)
        throw new TypeError('Global logger has already been configured');
    instance = new Logger(options);
    return instance;
}
exports.configure = configure;
function getInstance() {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    return instance;
}
exports.getInstance = getInstance;
// PASS-THROUGH FUNCTIONS
// --------------------------------------------------------------------------------------------
function debug(message, source) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.debug(message, source);
}
exports.debug = debug;
function info(message, source) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.info(message, source);
}
exports.info = info;
function warn(message, source) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.warn(message, source);
}
exports.warn = warn;
function error(error) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.error(error);
}
exports.error = error;
function log(event, properties) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.log(event, properties);
}
exports.log = log;
function track(metric, value) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.track(metric, value);
}
exports.track = track;
function trace(source, command, duration, success) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
    instance.trace(source, command, duration, success);
}
exports.trace = trace;
function request(request, response) {
    if (!instance)
        throw new TypeError('Global logger has not yet been configured');
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