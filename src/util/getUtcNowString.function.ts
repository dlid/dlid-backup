import {format} from "date-fns";
import { addMinutes } from "date-fns";

export function getUtcNowString(date) {
    return format(addMinutes(date, date.getTimezoneOffset()), `yyyy-MM-dd'T'HH:mm:ss'Z'`);
}

    