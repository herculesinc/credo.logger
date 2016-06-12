"use strict";
const colors = require('colors');
const ApplicationInsights = require('applicationinsights');
const onFinished = require('on-finished');
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_PREFIX_OPTIONS = {
    name: true
};
const DEFAULT_FORMAT_OPTIONS = {
    errors: 'stack',
    events: true,
    metrics: true,
    services: true,
    requests: true
};
const DEFAULT_CONSOLE_OPTIONS = {
    prefix: DEFAULT_PREFIX_OPTIONS,
    formats: DEFAULT_FORMAT_OPTIONS
};
// ENUMS AND INTERFACES
// ================================================================================================
(function (SeverityLevel) {
    SeverityLevel[SeverityLevel["debug"] = 1] = "debug";
    SeverityLevel[SeverityLevel["info"] = 2] = "info";
    SeverityLevel[SeverityLevel["warning"] = 3] = "warning";
    SeverityLevel[SeverityLevel["error"] = 4] = "error";
})(exports.SeverityLevel || (exports.SeverityLevel = {}));
var SeverityLevel = exports.SeverityLevel;
var SeverityLevel;
(function (SeverityLevel) {
    function parse(value) {
        if (!value)
            return;
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string')
            return SeverityLevel[value];
    }
    SeverityLevel.parse = parse;
})(SeverityLevel = exports.SeverityLevel || (exports.SeverityLevel = {}));
exports.Color = {
    black: 'black',
    red: 'red',
    green: 'green',
    yellow: 'yellow',
    blue: 'blue',
    magenta: 'magenta',
    cyan: 'cyan',
    white: 'white',
    grey: 'grey'
};
// LOGGER CLASS
// ================================================================================================
class Logger {
    constructor(options) {
        this.name = options.name;
        this.level = SeverityLevel.parse(options.level) || SeverityLevel.debug;
        if (options.console) {
            const cOptions = typeof options.console === 'boolean'
                ? DEFAULT_CONSOLE_OPTIONS
                : Object.assign({}, DEFAULT_CONSOLE_OPTIONS, options.console);
            this.prefixer = buildPrefixer(cOptions.prefix, this.name);
            this.colorizer = buildColorizer(cOptions.color);
            this.fOptions = Object.assign({}, DEFAULT_FORMAT_OPTIONS, cOptions.formats);
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
    debug(message) {
        if (this.level > SeverityLevel.debug || !message || typeof message !== 'string')
            return;
        // log to console
        if (this.fOptions) {
            this.logToConsole(message, SeverityLevel.debug);
        }
        // send to telemetry
        if (this.tClient) {
            this.tClient.trackTrace(message, 0 /* Verbose */);
        }
    }
    info(message) {
        if (this.level > SeverityLevel.info || !message || typeof message !== 'string')
            return;
        // log to console
        if (this.fOptions) {
            this.logToConsole(message, SeverityLevel.info);
        }
        // send to telemetry
        if (this.tClient) {
            this.tClient.trackTrace(message, 1 /* Information */);
        }
    }
    warn(message) {
        if (this.level > SeverityLevel.warning || !message || typeof message !== 'string')
            return;
        // log to console
        if (this.fOptions) {
            this.logToConsole(message, SeverityLevel.warning);
        }
        // send to telemetry
        if (this.tClient) {
            this.tClient.trackTrace(message, 2 /* Warning */);
        }
    }
    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error) {
        if (!error || !(error instanceof Error))
            return;
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
    log(event, properties) {
        if (typeof event !== 'string')
            return;
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
    track(metric, value) {
        if (!metric || typeof value !== 'number')
            return;
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
    trace(service, command, time, success) {
        if (typeof service !== 'string' || typeof command !== 'string' || typeof time !== 'number')
            return;
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
    request(request, response) {
        // log to console
        if (this.fOptions && this.fOptions.requests) {
            const start = process.hrtime();
            onFinished(response, () => {
                const format = this.fOptions.requests;
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
    logToConsole(message, level, service) {
        if (!message || !level)
            return;
        // build prefix
        if (this.prefixer) {
            message = `${this.prefixer(level)}: ${message}`;
        }
        // colorize the message
        if (this.colorizer) {
            message = this.colorizer(message, level, service);
        }
        // print the message
        switch (level) {
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
function buildPrefixer(optionsOrFlag, name) {
    if (typeof optionsOrFlag === 'boolean') {
        if (!optionsOrFlag)
            return;
        var options = DEFAULT_PREFIX_OPTIONS;
    }
    else {
        var options = Object.assign({}, DEFAULT_PREFIX_OPTIONS, optionsOrFlag);
        if (!options.time && !options.name && !options.level)
            return;
    }
    return function (level) {
        let prefix = (options.time ? `[${new Date().toISOString()}]` : '');
        if (options.name) {
            prefix += `[${name}]`;
        }
        if (options.level) {
            prefix += `[${level}]`;
        }
        return prefix;
    };
}
function buildColorizer(optionsOrColor) {
    if (!optionsOrColor)
        return;
    if (typeof optionsOrColor === 'string') {
        return function (message, level, service) {
            return applyColor(message, optionsOrColor);
        };
    }
    else {
        const options = {
            levels: optionsOrColor.levels || {},
            services: optionsOrColor.services || {}
        };
        return function (message, level, service) {
            const levelString = SeverityLevel[level];
            return applyColor(message, options.levels[levelString] || options.services[service]);
        };
    }
}
function applyColor(message, color) {
    if (!message)
        return;
    if (!color)
        return message;
    switch (color) {
        case exports.Color.black: return colors.black(message);
        case exports.Color.red: return colors.red(message);
        case exports.Color.green: return colors.green(message);
        case exports.Color.yellow: return colors.yellow(message);
        case exports.Color.blue: return colors.blue(message);
        case exports.Color.magenta: return colors.magenta(message);
        case exports.Color.cyan: return colors.cyan(message);
        case exports.Color.white: return colors.white(message);
        case exports.Color.grey: return colors.grey(message);
        default: throw new Error('Invalid Color');
    }
}
function buildRequestLine(request, response, duration, format) {
    if (!request)
        return;
    const address = request.ip || (request.connection && request.connection.remoteAddress);
    const method = request.method;
    const url = request.url;
    const version = request.httpVersion;
    const status = response.statusCode;
    const length = response.getHeader('content-length');
    if (format === 'short') {
        return `${address} - ${method} ${url} HTTP/${version} ${status} ${length} - ${duration} ms`;
    }
    else if (format === 'dev') {
        return `${method} ${url} ${status} ${duration} ms - ${length}`;
    }
}
function since(start) {
    const diff = process.hrtime(start);
    return (diff[0] * 1000 + Math.round(diff[1] / 1000) / 1000);
}
//# sourceMappingURL=index.js.map