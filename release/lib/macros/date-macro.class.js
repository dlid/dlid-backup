"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateMacroFormatter = void 0;
const macro_formatter_base_class_1 = require("./macro-formatter-base.class");
const formatMacroDate_function_1 = require("../util/formatMacroDate.function");
class DateMacroFormatter extends macro_formatter_base_class_1.MacroFormatterBase {
    constructor() {
        super(...arguments);
        this.prefix = 'date';
    }
    format(value) {
        return formatMacroDate_function_1.formatMacroDate(new Date(), value);
    }
}
exports.DateMacroFormatter = DateMacroFormatter;
