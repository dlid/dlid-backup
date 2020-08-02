import { addMinutes, format } from "date-fns"
import { autoInjectable } from "tsyringe";
import { IDateManager } from "./IDateManager";
 
/**
* Manage the commands allowed as CLI arguments 
*/
@autoInjectable()
export class DateManager implements IDateManager {

    now(): Date {
        return new Date();
    }

    utcNow(): Date {
        const now = this.now();
        return addMinutes(now, now.getTimezoneOffset());
    }

    formatUtcNow(dateFormat?: string): string {
        dateFormat = dateFormat || `yyyy-MM-dd'T'HH:mm:ss'Z'`;
        return format(this.utcNow(), dateFormat);
    }

}
