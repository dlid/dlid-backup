"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyParser = exports.PropertyParser = void 0;
const path = require("path");
const fs = require("fs");
const logger_1 = require("../util/logger");
const types_1 = require("../types");
const util_1 = require("../util");
const extractZipFolderName_function_1 = require("../util/extractZipFolderName.function");
class PropertyParser {
    constructor() {
        this.log = logger_1.logger.child(this.constructor.name);
    }
    parsePropertyValue(configurableName, propertyName, prop, originalValue, log) {
        log = log || logger_1.logger;
        let parsedValue = null;
        switch (prop.type) {
            case types_1.ConfigurableSettingType.String:
            case types_1.ConfigurableSettingType.MacroString:
                parsedValue = this.parseAsString(originalValue, prop);
                break;
            case types_1.ConfigurableSettingType.Int:
                parsedValue = this.parseAsInt(originalValue);
                break;
            case types_1.ConfigurableSettingType.StringArray:
                parsedValue = this.parseAsStringArray(originalValue, prop);
                break;
            case types_1.ConfigurableSettingType.FilePath:
                parsedValue = this.parseAsFilePath(originalValue, prop);
                break;
            case types_1.ConfigurableSettingType.FolderPath:
                parsedValue = this.parseAsFolderPath(originalValue, prop);
                break;
            case types_1.ConfigurableSettingType.FolderPathArray:
                parsedValue = this.parseAsFolderPath(originalValue, prop);
                break;
            default:
                parsedValue.error = `${propertyName} Property type '${util_1.typeToString(prop.type)}' is not implemented`;
                break;
        }
        const value = parsedValue.value;
        const error = parsedValue.error;
        if (!error) {
            log.trace(`${configurableName}.${propertyName} - ${util_1.typeToString(prop.type)} value was successfully parsed`, value);
        }
        else {
            log.trace(`${configurableName}.${propertyName} - could not be parsed as a ${util_1.typeToString(prop.type)}`);
        }
        return { value, error };
    }
    parseAsString(val, prop) {
        let error = '';
        let value = null;
        if (typeof val === 'undefined' || val === null) {
            value = '';
        }
        else {
            value = val.toString();
        }
        return { error, value };
    }
    parseAsStringArray(val, prop) {
        let error = '';
        let value = null;
        const m = val.match(/^(.) /);
        let separator = ',';
        if (m) {
            separator = m[1];
            val = val.substring(m[0].length);
        }
        value = val.split(separator).map(f => f.trim()).filter(f => f);
        return { error, value };
    }
    parseAsFolderPathArray(val, prop) {
        let { error, value } = this.parseAsStringArray(val, prop);
        if (!error) {
            value = value.map(f => this.parseAsFolderPath(f.trim(), prop).value).filter(f => f);
        }
        return { error, value };
    }
    parseAsFolderPath(val, prop) {
        let error = '';
        let value = null;
        if (typeof val === 'undefined' || val === null) {
            value = '';
        }
        var valueToTest = val;
        let zipFolderName = null;
        if (prop.allowZipTargetFolder) {
            const t = extractZipFolderName_function_1.extractZipFolderName(valueToTest, '');
            valueToTest = t.value;
            zipFolderName = t.zipTargetFolder;
        }
        let tries = [path.resolve(valueToTest)];
        tries.push(path.join(__dirname, valueToTest));
        for (let i = 0; i < tries.length; i++) {
            try {
                fs.statSync(tries[i]);
                value = tries[i];
                if (zipFolderName) {
                    value = `@${zipFolderName}(${value})`;
                }
                break;
            }
            catch (err) {
            }
        }
        if (!value) {
            error = 'Could not find folder "' + valueToTest + '"';
        }
        return { error, value };
    }
    parseAsFilePath(val, prop) {
        let error = '';
        let value = null;
        if (typeof val === 'undefined' || val === null) {
            value = '';
        }
        var valueToTest = val;
        let zipFolderName = null;
        if (prop.allowZipTargetFolder) {
            const t = extractZipFolderName_function_1.extractZipFolderName(valueToTest, '');
            valueToTest = t.value;
            zipFolderName = t.zipTargetFolder;
        }
        let tries = [path.resolve(valueToTest)];
        tries.push(path.join(__dirname, valueToTest));
        for (let i = 0; i < tries.length; i++) {
            try {
                if (fs.existsSync(tries[i])) {
                    value = tries[i];
                    if (zipFolderName) {
                        value = `@${zipFolderName}(${value})`;
                    }
                    break;
                }
            }
            catch (err) {
            }
        }
        if (!value) {
            error = 'Could not find file <em>' + valueToTest + '</em>';
        }
        return { error, value };
    }
    parseAsInt(val) {
        let error = '';
        let value = null;
        if (typeof val === 'undefined' || val === null) {
            error = 'no value';
        }
        if (val.toString().match(/^\d+$/)) {
            value = parseInt(val, 10);
        }
        else {
            error = 'Invalid int: ' + val.toString();
        }
        return { error, value };
    }
}
exports.PropertyParser = PropertyParser;
var propertyParser = new PropertyParser();
exports.propertyParser = propertyParser;
