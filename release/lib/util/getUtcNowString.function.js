"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUtcNowString = void 0;
const date_fns_1 = require("date-fns");
const date_fns_2 = require("date-fns");
function getUtcNowString(date) {
    return date_fns_1.format(date_fns_2.addMinutes(date, date.getTimezoneOffset()), `yyyy-MM-dd'T'HH:mm:ss'Z'`);
}
exports.getUtcNowString = getUtcNowString;
