import { TableManagerInterface } from "./TableManagerInterface";
import { autoInjectable, } from "tsyringe";
import { CollectorBase } from "types";

@autoInjectable()
export class TableManager implements TableManagerInterface {

    tabsToTable(tabbedStrings: string[], padding: number = 3): string {
        const columnWidth: number[] = [];
        const lines: string[][] = [];

        tabbedStrings.forEach(str => {
            const cols = str.split('\t');
            
            let extraRows = 0;
            let extraRowsArray = [];
            for (let i=0; i < cols.length; i++) {
                if (cols[i].indexOf('<br>') !== -1) {
                    const x = cols[i].split(/<br>/gi);
                    if (x.length > extraRows) {
                        extraRows = x.length;
                    }
                }
            }

            let additionalRows: (string[])[] = [];
            if (extraRows > 0) {
                
                for (let i=0; i < extraRows - 1; i++) { 
                    let cells = cols.map(c => " ");
                    additionalRows.push(cells); 
                }

                for (let i=0; i < cols.length; i++) {
                    const x = cols[i].split(/<br>/gi);
                    if (x.length > 1) {
                        cols[i] = x[0];
                        for (var j = 1; j < x.length; j++) {
                            additionalRows[j - 1][i] = x[j];
                        }
                    }
                }
            }

            lines.push(cols);
            additionalRows?.forEach(r => lines.push(r));

            cols.forEach((c, i) => {
                const len = c.length === 0 ? 1 : c.length;
                let w = columnWidth.length > i ? columnWidth[i] : 0;
                if (w < len) {
                    columnWidth[i] = len;
                }
            })
        });

        lines.forEach(cols => {
            cols.forEach((c, i) => {
                const len = c.length === 0 ? 1 : c.length;
                let w = columnWidth.length > i ? columnWidth[i] : 0;
                if (w < len) {
                    columnWidth[i] = len;
                }
            })
        })
        

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
