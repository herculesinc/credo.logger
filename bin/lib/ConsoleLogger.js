"use strict";
const colors = require('colors');
const onFinished = require('on-finished');
const common_1 = require('./common');
const util_1 = require('./util');
// MODULE VARIABLES
// ================================================================================================
const DEFAULT_PREFIX_OPTIONS = {
    name: true
};
const DEFAULT_FORMAT_OPTIONS = {
    error: 'stack',
    request: 'short'
};
const DEFAULT_CONSOLE_OPTIONS = {
    prefix: DEFAULT_PREFIX_OPTIONS,
    formats: DEFAULT_FORMAT_OPTIONS
};
var ConsoleStream;
(function (ConsoleStream) {
    ConsoleStream[ConsoleStream["debug"] = 1] = "debug";
    ConsoleStream[ConsoleStream["info"] = 2] = "info";
    ConsoleStream[ConsoleStream["warning"] = 3] = "warning";
    ConsoleStream[ConsoleStream["error"] = 4] = "error";
})(ConsoleStream || (ConsoleStream = {}));
// LOGGER CLASS
// ================================================================================================
class ConsoleLogger {
    constructor(name, options) {
        this.name = name;
        const cOptions = typeof options === 'boolean'
            ? DEFAULT_CONSOLE_OPTIONS
            : Object.assign({}, DEFAULT_CONSOLE_OPTIONS, options);
        this.prefixer = buildPrefixer(cOptions.prefix, this.name);
        this.colorizer = buildColorizer(cOptions.color);
        this.fOptions = Object.assign({}, DEFAULT_FORMAT_OPTIONS, cOptions.formats);
    }
    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message) {
        this.logToConsole(message, ConsoleStream.debug);
    }
    info(message) {
        this.logToConsole(message, ConsoleStream.info);
    }
    warn(message) {
        this.logToConsole(message, ConsoleStream.warning);
    }
    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error) {
        const message = this.fOptions.error === 'stack' && error.stack
            ? error.stack
            : error.message || 'Unknown error';
        this.logToConsole(message, ConsoleStream.error);
    }
    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event, properties) {
        const message = (properties ? `${event}: ${JSON.stringify(properties)}` : event);
        this.logToConsole(message, ConsoleStream.info);
    }
    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric, value) {
        this.logToConsole(`[${metric}=${value}]`, ConsoleStream.info);
    }
    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(service, command, duration, success) {
        const message = success
            ? `executed [${command}] in ${duration} ms`
            : `failed to execute [${command}] in ${duration} ms`;
        this.logToConsole(message, ConsoleStream.info, service);
    }
    // Request Logging
    // --------------------------------------------------------------------------------------------
    request(request, response) {
        const start = process.hrtime();
        onFinished(response, () => {
            const line = buildRequestLine(request, response, util_1.since(start), this.fOptions.request);
            this.logToConsole(line, ConsoleStream.info);
        });
    }
    // Private Methods
    // --------------------------------------------------------------------------------------------
    logToConsole(message, stream, service) {
        if (!message || !stream)
            return;
        // build prefix
        if (this.prefixer) {
            message = `${this.prefixer(stream, service)}: ${message}`;
        }
        // colorize the message
        if (this.colorizer) {
            message = this.colorizer(message, stream, service);
        }
        // print the message
        switch (stream) {
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
exports.ConsoleLogger = ConsoleLogger;
// HELPER FUNCTIONS
// ================================================================================================
function buildPrefixer(optionsOrFlag, name) {
    if (typeof optionsOrFlag === 'boolean') {
        if (!optionsOrFlag)
            return;
        var options = DEFAULT_PREFIX_OPTIONS;
    }
    else {
        var options = Object.assign({}, DEFAULT_PREFIX_OPTIONS, optionsOrFlag);
        if (!options.time && !options.name && !options.stream)
            return;
    }
    return function (stream, service) {
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
    };
}
function buildColorizer(optionsOrColor) {
    if (!optionsOrColor)
        return;
    if (typeof optionsOrColor === 'string') {
        return function (message, stream, service) {
            return applyColor(message, optionsOrColor);
        };
    }
    else {
        const options = {
            severity: optionsOrColor.severity || {},
            services: optionsOrColor.services || {}
        };
        return function (message, stream, service) {
            const severity = ConsoleStream[stream];
            return applyColor(message, options.severity[severity] || options.services[service]);
        };
    }
}
function applyColor(message, color) {
    if (!message)
        return;
    if (!color)
        return message;
    switch (color) {
        case common_1.Color.black: return colors.black(message);
        case common_1.Color.red: return colors.red(message);
        case common_1.Color.green: return colors.green(message);
        case common_1.Color.yellow: return colors.yellow(message);
        case common_1.Color.blue: return colors.blue(message);
        case common_1.Color.magenta: return colors.magenta(message);
        case common_1.Color.cyan: return colors.cyan(message);
        case common_1.Color.white: return colors.white(message);
        case common_1.Color.grey: return colors.grey(message);
        default: throw new Error('Invalid Color');
    }
}
function buildRequestLine(request, response, duration, format) {
    if (!request)
        return;
    const address = request.ip || (request.connection && request.connection.remoteAddress);
    const method = request.method;
    const url = request.path || request.url;
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
//# sourceMappingURL=ConsoleLogger.js.map