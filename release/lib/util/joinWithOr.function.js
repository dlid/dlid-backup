"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinWithOr = void 0;
/**
 * Join the provided strings with an 'or' instead of comma before the last value
 * @param values The values to join
 */
function joinWithOr(values) {
    if (values.length > 1) {
        let result = values.slice(0, values.length - 1);
        return `${result.join(', ')} or ${values[values.length - 1]}`;
    }
    return values.join('');
}
exports.joinWithOr = joinWithOr;
