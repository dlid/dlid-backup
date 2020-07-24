export interface TableManagerInterface {

    /**
     * Take a list of tabular data and make sure the columns are adjusted to the content
     */
    tabsToTable(tabbedStrings: string[], padding: number): string;

    fgGreen(value: string): string;

    fgYellow(value: string): string;

    fgBlue(value: string): string;

    fgWhite(value: string): string;

    fgRed(value: string): string;

    fgMagenta(value: string): string;

    fgCyan(value: string): string;

}
