import { ParsedCommand, UserOptionInterface, UserOptionType } from "..";

export interface UserOptionManagerInterface {
    resolveFromParsedCommand(parameterSource: string, options: UserOptionInterface[], cmd: ParsedCommand): any;
    
    addOptionValue(command: ParsedCommand, optionName: string, optionValue: string): void;
    typeToString(type: UserOptionType): string;
} 
