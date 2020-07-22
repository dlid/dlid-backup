import { ParsedCommand, UserOptionInterface } from "..";

export interface UserOptionManagerInterface {
    resolveFromParsedCommand(parameterSource: string, options: UserOptionInterface[], cmd: ParsedCommand): any;
    
    addOptionValue(command: ParsedCommand, optionName: string, optionValue: string): void;
} 
