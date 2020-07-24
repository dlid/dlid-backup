/**
 * Support using the following pattern @name1(C:\Files)
 * 
 * This method will extract the name1 part as the zipTargetFolder
 * And the C:\Files part as files files that should be put in that folder
 * 
 * Within the zip archive, all files from C:\Files will be put in the name1 folder
 *
 * @export
 * @param {string} val The value that may or may not contain the @name(value) pattern
 * @param {string} fallbackValue Fallback value for the zipTargetFolderName
 * @returns
 */
export function extractZipFolderName(val: string, fallbackValue: string) {
    let zipTargetFolder = fallbackValue;
    let value = val;
    const regexMatch = val.match(/^@([a-zA-Z0-9_-]+)\((.*?)\)$/);
    if (regexMatch) {
        console.log("m", regexMatch);
        value = regexMatch[2]
        zipTargetFolder = regexMatch[1];
    } else {
        console.log(`no '${val}`);
    }
    return { zipTargetFolder, value }
}
