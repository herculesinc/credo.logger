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
        if (this.fOptions.requests && typeof this.fOptions.requests === 'boolean') {
            this.fOptions.requests = 'dev';
        }
    }
    // Message logging
    // --------------------------------------------------------------------------------------------
    debug(message) {
        this.logToConsole(message, common_1.SeverityLevel.debug);
    }
    info(message) {
        this.logToConsole(message, common_1.SeverityLevel.info);
    }
    warn(message) {
        this.logToConsole(message, common_1.SeverityLevel.warning);
    }
    // Error logging
    // --------------------------------------------------------------------------------------------
    error(error) {
        const message = this.fOptions.errors === 'stack' && error.stack
            ? error.stack
            : error.message || 'Unknown error';
        this.logToConsole(message, common_1.SeverityLevel.error);
    }
    // Event logging
    // --------------------------------------------------------------------------------------------
    log(event, properties) {
        if (this.fOptions.events) {
            const message = (properties ? `${event}: ${JSON.stringify(properties)}` : event);
            this.logToConsole(message, common_1.SeverityLevel.info);
        }
    }
    // Metric tracking
    // --------------------------------------------------------------------------------------------
    track(metric, value) {
        if (this.fOptions.metrics) {
            this.logToConsole(`[${metric}=${value}]`, common_1.SeverityLevel.info);
        }
    }
    // Service tracing
    // --------------------------------------------------------------------------------------------
    trace(service, command, duration, success) {
        if (this.fOptions.services) {
            const message = success
                ? `[${service}]: executed [${command}] in ${duration} ms`
                : `[${service}]: failed to execute [${command}] in ${duration} ms`;
            this.logToConsole(message, common_1.SeverityLevel.info, service);
        }
    }
    // Request Logging
    // --------------------------------------------------------------------------------------------
    request(request, response) {
        if (this.fOptions.requests) {
            const start = process.hrtime();
            onFinished(response, () => {
                const format = this.fOptions.requests;
                const line = buildRequestLine(request, response, util_1.since(start), format);
                this.logToConsole(line, common_1.SeverityLevel.info);
            });
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
            case common_1.SeverityLevel.debug:
                console.log(message);
                break;
            case common_1.SeverityLevel.info:
                console.info(message);
                break;
            case common_1.SeverityLevel.warning:
                console.warn(message);
                break;
            case common_1.SeverityLevel.error:
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
            const levelString = common_1.SeverityLevel[level];
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
//# sourceMappingURL=ConsoleLogger.js.map