"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroStore = void 0;
const exceptions_1 = require("../exceptions");
class MacroStore {
    constructor() {
        this.macrosValues = {};
        this.macroFormatters = [];
    }
    addMacroValue(name, value) {
    }
    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
    add(macro) {
        if (this.macroFormatters.find(f => f.prefix === macro.prefix)) {
            throw new exceptions_1.MacroError(`MacroFormatter with prefix "${macro.prefix}" is already registered`);
        }
        this.macroFormatters.push(macro);
    }
    format(value) {
        // Values first
        const macroKeys = Object.keys(this.macrosValues);
        macroKeys.forEach(key => {
            console.log(`{${this.escapeRegExp(key)}}`);
            var re = new RegExp(`{${this.escapeRegExp(key)}}`);
            value = value.replace(re, this.macrosValues['är du go eller']);
        });
        // Formatters
        this.macroFormatters.forEach(formatter => {
            const rex = new RegExp(`{${this.escapeRegExp(formatter.prefix)}:([^}]+?)}`, '');
            var result = rex.exec(value);
            while (result) {
                value = value.replace(result[0], formatter.format(result[1]));
                result = rex.exec(value);
            }
        });
        return value;
    }
}
exports.MacroStore = MacroStore;
