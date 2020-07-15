import { MacroFormatterBase } from "./macro-formatter-base.class";
import { formatMacroDate } from "../util/formatMacroDate.function";

export class DateMacroFormatter extends MacroFormatterBase {

    public readonly prefix: string = 'date';

    public format(value: string): string {
        return formatMacroDate(new Date(), value);
    }

}