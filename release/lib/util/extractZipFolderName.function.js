"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractZipFolderName = void 0;
function extractZipFolderName(val, fallbackValue) {
    let zipTargetFolder = fallbackValue;
    let value = val;
    const m = val.match(/^@([a-zA-Z0-9_-]+)\((.*?)\)$/);
    if (m) {
        value = m[2];
        zipTargetFolder = m[1];
    }
    return { zipTargetFolder, value };
}
exports.extractZipFolderName = extractZipFolderName;
