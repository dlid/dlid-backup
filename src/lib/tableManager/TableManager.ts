import { TableManagerInterface } from "./TableManagerInterface";
import { autoInjectable, } from "tsyringe";

@autoInjectable()
export class TableManager implements TableManagerInterface {

    tabsToTable(tabbedStrings: string[], padding: number = 3): string {
        const columnWidth: number[] = [];
        const lines: string[][] = [];

        tabbedStrings.forEach(str => {
            const cols = str.split('\t');
            lines.push(cols);
            cols.forEach((c, i) => {
                const len = c.length === 0 ? 1 : c.length;
                let w = columnWidth.length > i ? columnWidth[i] : 0;
                if (w < len) {
                    columnWidth[i] = len;
                }
            })
        });

        let result = '';
        lines.forEach(line => {
            line.forEach((value, colIndex) => {
                const cellPadding = columnWidth[colIndex] + padding;
                result += value.padEnd(cellPadding, ' ');
            })
            result += '\n';
        });
        return result;
    }

    private consoleColor(text: string, color: string) {
        return `${color}${text}\x1b[0m`;
    }

    fgGreen(value: string) {
        return this.consoleColor(value, `\x1b[32m`);
    }

    fgYellow(value: string) {
        return this.consoleColor(value, `\x1b[33m`);
    }

    fgBlue(value: string) {
        return this.consoleColor(value, `\x1b[34m`);
    }

    fgWhite(value: string) {
        return this.consoleColor(value, `\x1b[37m`);
    }

    fgRed(value: string) {
        return this.consoleColor(value, `\x1b[31m`);
    }

    fgMagenta(value: string) {
        return this.consoleColor(value, `\x1b[35m`);
    }

    fgCyan(value: string) {
        return this.consoleColor(value, `\x1b[36m`);
    }

}
