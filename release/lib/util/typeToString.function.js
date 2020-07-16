"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeToString = void 0;
const types_1 = require("../types");
function typeToString(type) {
    switch (type) {
        case types_1.ConfigurableSettingType.StringArray:
            return 'string[]';
        case types_1.ConfigurableSettingType.String:
            return 'string';
        case types_1.ConfigurableSettingType.MacroString:
            return 'macroString';
        case types_1.ConfigurableSettingType.Int:
            return 'int';
        case types_1.ConfigurableSettingType.IntArray:
            return 'int[]';
        case types_1.ConfigurableSettingType.FilePath:
            return 'filepath';
        case types_1.ConfigurableSettingType.FolderPath:
            return 'folderpath';
        case types_1.ConfigurableSettingType.FolderPathArray:
            return 'folderpath[]';
        default:
            return 'unknown';
    }
}
exports.typeToString = typeToString;
