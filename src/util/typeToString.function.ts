import { UserOptionType } from "../lib";

export function typeToString(type: UserOptionType) {
    switch(type) {
        case UserOptionType.StringArray:
        return 'string[]';
        case UserOptionType.String:
        return 'string';
        case UserOptionType.MacroString:
        return 'macroString';
        case UserOptionType.Int:
        return 'int';
        case UserOptionType.IntArray:
        return 'int[]';
        case UserOptionType.FilePath:
        return 'filepath';
        case UserOptionType.FolderPath:
        return 'folderpath';
        case UserOptionType.FolderPathArray:
        return 'folderpath[]';
        default:
        return 'unknown';
    }
}