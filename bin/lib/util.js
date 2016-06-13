"use strict";
// DURATION CALCULATOR
// ================================================================================================
function since(start) {
    const diff = process.hrtime(start);
    return (diff[0] * 1000 + Math.round(diff[1] / 1000) / 1000);
}
exports.since = since;
//# sourceMappingURL=util.js.map