
/**
 * Join the provided strings with an 'or' instead of comma before the last value
 * @param values The values to join
 */
export function joinWithOr(values: string[], orString: string = 'or'): string {
    if (values.length > 1) {
        let result = values.slice(0, values.length - 1);
        return `${result.join(', ')} ${orString} ${values[values.length - 1]}`; 
    }
    return values.join('');
}
