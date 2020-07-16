"use strict";
/**
 * Simple test of string match
 * Where pattern can start or end with *
 *
 * @export
 * @param {string} val
 * @param {string} pattern
 * @returns {boolean}
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSimpleMatch = void 0;
function isSimpleMatch(val, pattern) {
    if (pattern) {
        if (pattern.startsWith('*')) {
            if (val.endsWith(pattern.substr(1))) {
                return true;
            }
        }
        else if (pattern.endsWith('*')) {
            if (val.startsWith(pattern.substr(0, pattern.length - 1))) {
                return true;
            }
        }
        return false;
    }
    return true;
}
exports.isSimpleMatch = isSimpleMatch;
