// import { FileInformation } from "../types/FileInformation.type";
// import { isSimpleMatch } from "./isSimpleMatch.function";
// import path = require('path');

// /**
//  * Return the files from the list that should be deleted - sorted by creation date
//  *
//  * @export
//  * @param {FileInformation[]} files The original list of files
//  * @param {number} keep The number of files to keep
//  * @param {string} keepPattern Only care about files matching this pattern
//  * @returns {FileInformation[]} The files that should be deleted 
//  */
// export function getFilesToDelete(files: FileInformation[], keep: number, keepPattern: string): FileInformation[] {
//     let items = keepPattern ? files.slice(0).filter(f => f).filter(f => isSimpleMatch( path.basename(f.fullName), keepPattern )) : files.slice(0);
    
//     items.sort((a, b) => {
//         if (a.created.getTime() !== b.created.getTime()) {
//             return a.created.getTime() < b.created.getTime() ? 1 : -1;
//         }
//         return 0;
//     });

//     return items.slice(keep);
// }