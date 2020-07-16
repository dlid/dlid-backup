"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilesToDelete = void 0;
const isSimpleMatch_function_1 = require("./isSimpleMatch.function");
const path = require("path");
function getFilesToDelete(files, keep, keepPattern) {
    let items = keepPattern ? files.slice(0).filter(f => f).filter(f => isSimpleMatch_function_1.isSimpleMatch(path.basename(f.fullName), keepPattern)) : files.slice(0);
    items.sort((a, b) => {
        if (a.created.getTime() !== b.created.getTime()) {
            return a.created.getTime() < b.created.getTime() ? 1 : -1;
        }
        return 0;
    });
    return items.slice(keep);
}
exports.getFilesToDelete = getFilesToDelete;
