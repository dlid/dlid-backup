
/**
 * Simple test of string match
 * Where pattern can start or end with * or %
 *
 * @export
 * @param {string} val
 * @param {string} pattern
 * @returns {boolean}
 */

export function isSimpleMatch(val: string, pattern: string): boolean {
    if (pattern) {
        pattern = pattern.replace(/%/g, '*')
        const startsWith = pattern.startsWith('*');
        const endsWith = pattern.endsWith('*');
        pattern = pattern.replace(/^\*+|\*+$/g, '');
        if (startsWith && endsWith) {
            return val.includes(pattern);
        } else if (startsWith) {
            return val.endsWith(pattern);
        } else if (endsWith) {
            return val.startsWith(pattern);
        } else {
            return val == pattern;
        }
    }
    return true;
} 