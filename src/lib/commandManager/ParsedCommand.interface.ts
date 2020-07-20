import { CommandInterface } from "./Command.interface";

export interface ParsedCommand {
    commandLongName: string;
    parameters?: string[];
    options: { key: string, values: any[] }[];
    command?: CommandInterface;
}
