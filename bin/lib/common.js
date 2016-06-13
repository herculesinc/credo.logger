"use strict";
// SEVERITY LEVEL
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
//# sourceMappingURL=common.js.map