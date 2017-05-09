"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// SEVERITY LEVEL
// ================================================================================================
var MessageLevel;
(function (MessageLevel) {
    MessageLevel[MessageLevel["debug"] = 1] = "debug";
    MessageLevel[MessageLevel["info"] = 2] = "info";
    MessageLevel[MessageLevel["warning"] = 3] = "warning";
})(MessageLevel = exports.MessageLevel || (exports.MessageLevel = {}));
(function (MessageLevel) {
    function parse(value) {
        if (!value)
            return;
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string')
            return MessageLevel[value];
        if (typeof value === 'boolean')
            return value ? MessageLevel.debug : undefined;
    }
    MessageLevel.parse = parse;
})(MessageLevel = exports.MessageLevel || (exports.MessageLevel = {}));
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
//# sourceMappingURL=common.js.map