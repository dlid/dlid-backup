import { ParsedCommand, UserOptionInterface } from "..";

export interface UserOptionManagerInterface {
    resolveFromParsedCommand(options: UserOptionInterface[], cmd: ParsedCommand): any;
} 
