
/**
 * Simple test of string match
 * Where pattern can start or end with *
 *
 * @export
 * @param {string} val
 * @param {string} pattern
 * @returns {boolean}
 */

export function isSimpleMatch(val: string, pattern: string): boolean {
    if (pattern) {
        if (pattern.startsWith('*')) {
            if (val.endsWith(pattern.substr(1))) {
                return true;
            }
        } else if (pattern.endsWith('*')) {
            if (val.startsWith(pattern.substr(0, pattern.length -1))) {
                return true;
            }
        }
        return false;
    }
    return true;
} 