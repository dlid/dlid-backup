import { FileInformation } from "../types/FileInformation.type";
import { isSimpleMatch } from "./isSimpleMatch.function";
import path = require('path');

export function getFilesToDelete(files: FileInformation[], keep: number, keepPattern: string): FileInformation[] {
    let items = keepPattern ? files.slice(0).filter(f => f).filter(f => isSimpleMatch( path.basename(f.fullName), keepPattern )) : files.slice(0);
    
    items.sort((a, b) => {
        if (a.created.getTime() !== b.created.getTime()) {
            return a.created.getTime() < b.created.getTime() ? 1 : -1;
        }
        return 0;
    });

    return items.slice(keep);
}