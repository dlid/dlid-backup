import { ConfigurableSettingType } from "../types";

export function typeToString(type: ConfigurableSettingType) {
    switch(type) {
        case ConfigurableSettingType.StringArray:
        return 'string[]';
        case ConfigurableSettingType.String:
        return 'string';
        case ConfigurableSettingType.Int:
        return 'int';
        case ConfigurableSettingType.IntArray:
        return 'int[]';
        case ConfigurableSettingType.FilePath:
        return 'filepath';
        case ConfigurableSettingType.FolderPath:
        return 'folderpath';
        case ConfigurableSettingType.FolderPathArray:
        return 'folderpath[]';
        default:
        return 'unknown';
    }
}