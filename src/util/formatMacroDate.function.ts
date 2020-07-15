import {format} from "date-fns";
import { addMinutes } from "date-fns";

export function formatMacroDate(date: Date, formatString: string): string {
    const utcDate = addMinutes(date, date.getTimezoneOffset());
    return format(utcDate, formatString);
}

     