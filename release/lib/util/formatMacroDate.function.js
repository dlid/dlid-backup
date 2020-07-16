"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMacroDate = void 0;
const date_fns_1 = require("date-fns");
const date_fns_2 = require("date-fns");
function formatMacroDate(date, formatString) {
    const utcDate = date_fns_2.addMinutes(date, date.getTimezoneOffset());
    return date_fns_1.format(utcDate, formatString);
}
exports.formatMacroDate = formatMacroDate;
