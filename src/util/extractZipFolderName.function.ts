export function extractZipFolderName(val: string, fallbackValue: string) {
    let zipTargetFolder = fallbackValue;
    let value = val;
    const m = val.match(/^@([a-zA-Z0-9_-]+)\((.*?)\)$/);
    if (m) {
        value = m[2]
        zipTargetFolder = m[1];
    }
    return { zipTargetFolder, value }
}
