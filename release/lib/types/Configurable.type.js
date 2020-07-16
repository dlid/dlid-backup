"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurableSettingType = void 0;
var ConfigurableSettingType;
(function (ConfigurableSettingType) {
    ConfigurableSettingType[ConfigurableSettingType["String"] = 0] = "String";
    ConfigurableSettingType[ConfigurableSettingType["MacroString"] = 1] = "MacroString";
    ConfigurableSettingType[ConfigurableSettingType["Int"] = 2] = "Int";
    ConfigurableSettingType[ConfigurableSettingType["FolderPath"] = 3] = "FolderPath";
    ConfigurableSettingType[ConfigurableSettingType["FolderPathArray"] = 4] = "FolderPathArray";
    ConfigurableSettingType[ConfigurableSettingType["FilePath"] = 5] = "FilePath";
    ConfigurableSettingType[ConfigurableSettingType["StringArray"] = 6] = "StringArray";
    ConfigurableSettingType[ConfigurableSettingType["IntArray"] = 7] = "IntArray";
    ConfigurableSettingType[ConfigurableSettingType["Float"] = 8] = "Float";
    ConfigurableSettingType[ConfigurableSettingType["FloatArray"] = 9] = "FloatArray";
    ConfigurableSettingType[ConfigurableSettingType["Custom"] = 10] = "Custom";
})(ConfigurableSettingType = exports.ConfigurableSettingType || (exports.ConfigurableSettingType = {}));
// dlid-backup
// What do you want to backup?
// o Folder or file
// o Local MySQL Database
//   -> config
// Where yo do you want to back it up to?
// o Firestore
// o Local filesystem
// o (SFTP)
// o (FTP)
// o (OneDrive)
