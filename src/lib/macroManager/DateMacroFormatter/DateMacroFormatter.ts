import { IDateManager } from 'lib/dateManager/IDateManager';
import { autoInjectable, inject } from 'tsyringe';
import { MacroFormatterBase } from '../MacroFormatterBase';

@autoInjectable()
export class DateMacroFormatter extends MacroFormatterBase {

    public readonly name: string = 'Date Macro Formatter';
    public readonly prefix: string = 'date';

    constructor(
        @inject("IDateManager") private dateManager: IDateManager
    ) {
        super();
    }

    public format(value: string): string {
        return this.dateManager.formatUtcNow(value);
    }

    public help(): string {
        return [
            `Macro for inserting av formated date/time value`,
            '',
            `Usage: {date:<format>}`,
            '',
            `Where <format> must be a valid date-fns format string`,
            "  See https://date-fns.org/v2.15.0/docs/format",
            "",
            "Examples:",
            " {date:yyyy-MM-dd} -> " + this.dateManager.formatUtcNow('yyyy-MM-dd'),
            " {date:yyyy-MM-dd'T'HH:mm:ss} -> " + this.dateManager.formatUtcNow(`yyyy-MM-dd'T'HH:mm:ss`),
            " {date:yyyy-MM-dd'W'II} -> " + this.dateManager.formatUtcNow(`yyyy-MM-dd'W'II`),
            " {date:h aaaa} -> " + this.dateManager.formatUtcNow(`hh aaaa`),
            " {date:B} -> " + this.dateManager.formatUtcNow(`B`),
        ].join("\n");
    }

} 