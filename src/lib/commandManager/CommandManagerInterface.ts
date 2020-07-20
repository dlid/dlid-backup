import { ParsedCommand } from "./ParsedCommand.interface";
import { CommandInterface } from "./Command.interface";

export interface CommandManagerInterface {
    getByLongName(longName: string): CommandInterface;
    getByShortName(shortName: string): CommandInterface;
    getAll(): CommandInterface[];
    find(val: string): CommandInterface;

    parseFromCommandLineParameters(normalizedParameters: string[]): ParsedCommand[];
}

