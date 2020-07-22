import { UserOptionManagerInterface, UserOptionType } from ".";
import { UserOptionInterface } from "./UserOptionInterface";
import { ParsedCommand } from "../commandManager";
import { ParameterException, DlidBackupError } from "../../exceptions";
import { ok } from "assert";
import { FileManagerInterface } from "../fileManager";
import { inject, autoInjectable } from "tsyringe";
import { SourceManagerInterface } from "../sourceManager";
import { TargetManagerInterface } from "..";

interface UserOptionParseContext {
    source: string;
    option: UserOptionInterface;
    command: ParsedCommand;
}

@autoInjectable()
export class UserOptionManager implements UserOptionManagerInterface {

    constructor(
        @inject("FileManagerInterface") private fileManager: FileManagerInterface,
        @inject("SourceManagerInterface") private sourceManager: SourceManagerInterface,
        @inject("TargetManagerInterface") private targetManager: TargetManagerInterface
    ) {}

    public resolveFromParsedCommand(parameterSource: string, options: UserOptionInterface[], cmd: ParsedCommand): { [key: string]: any } {
        let result: any = {};

        if (cmd.commandLongName === 'source' && cmd.parameters?.length > 0) {
            // IF any parameters, give the source a chance to parse the parameters and modify the command options
            const src = this.sourceManager.getByName(parameterSource);
            src?.prepareParsedCommand(cmd);
        } else if (cmd.commandLongName === 'target' && cmd.parameters?.length > 0) {
            // IF any parameters, give the source a chance to parse the parameters and modify the command options
            const src = this.targetManager.getByName(parameterSource);
            src?.prepareParsedCommand(cmd);
        }

        options.forEach(o => {
            const definedOption = cmd.options?.find(opt => opt.key === o.key);
            if (definedOption) {
                result[this.camelCaseOptionName(o.key)] = this.parse({
                    command: cmd, 
                    source: parameterSource, 
                    option: o
                });
            } else if (o.defaultValue) {
                result[this.camelCaseOptionName(o.key)] = o.defaultValue;
            } else if (o.isRequired) {
                throw new ParameterException(`--${cmd.commandLongName}.${o.key} (${parameterSource})`, null, 'Required - ' + o.description);
            }
        });

        cmd.options?.filter(userOption => !options.find(definedOption => definedOption.key === userOption.key) ).forEach(unknownOption => {
            throw new ParameterException(`--${cmd.commandLongName}.${unknownOption.key} (${parameterSource})`, null, 'Unknown option');
        })

        return result;
    }


    private camelCaseOptionName(val: string): string {
        let i = -1;
        let n = 0;
        do {
            i = val.indexOf('-');
            if (i !== -1) {
                
              console.log("1", val.substring(0, i))      ;
              console.log("2", val.substr(i + 1, 1).toUpperCase())
              console.log("3", val.substring(i + 2));

                val = val.substring(0, i) + val.substr(i + 1, 1).toUpperCase() + val.substring(i + 2);

            }
            n++;
            if (n > 50) {
                console.log("BREAK!");
                break;
            }
        } while (i !== -1);
        return val;
    }


    /**
     * Add a new value to the existing named option or add the option with the value
     */
    public addOptionValue(command: ParsedCommand, optionName: string, optionValue: string): void {
        const e = command.options.find(f =>f.key === optionName)
        if (e) {
            e.values.push(optionValue);
        } else {
            command.options.push({key: optionName, values: [optionValue]});
        }
    }

    private parse(ctx: UserOptionParseContext) {
        
        let value: any;
        const userProvidedOpion = ctx.command.options.find(opt => opt.key === ctx.option.key);

        switch(ctx.option.type) {
            case UserOptionType.String:
            case UserOptionType.MacroString:
                value = this.parseAsString(userProvidedOpion.values, ctx);
            break;
            case UserOptionType.Int:
                value = this.parseAsInt(userProvidedOpion.values, ctx);
            break;
            case UserOptionType.StringArray:
                value = this.parseAsStringArray(userProvidedOpion.values, ctx);
            break;
            // case UserOptionType.FilePath:
            //     value = this.parseAsFilePath(originalValue, prop);
            // break;
            case UserOptionType.FolderPath:
                value = this.parseAsFolderPath(userProvidedOpion.values, ctx);
            break;
            case UserOptionType.FolderPathArray:
                value = this.parseAsFolderPathArray(userProvidedOpion.values, ctx);
            break;
            default:
                throw new DlidBackupError('Unknown type', `(${this.typeToString(ctx.option.type)}) - Property type for '${ctx.option.key}' is not implemented`, '');
            break;
        }
        return value;
    }

    private parseAsString(value: string[], ctx: UserOptionParseContext) {
        if (value.length === 1) {
            return value[0];
        } else if (value.length > 1) {
            throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `${this.typeToString(ctx.option.type)} - Only one value is allowed (is ${value.join(',')}) - ${ctx.option.description}`);
        }
    }

    private parseAsStringArray(value: string[], ctx: UserOptionParseContext) {
        return value.filter(v => v).map(v => v.toString());
    }

    private parseAsInt(value: string[], ctx: UserOptionParseContext) {
        if (value.length === 1) {
            if (value[0].toString().match(/^\d+$/)) {
                return parseInt(value[0], 10);
            } else {
                throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `(${this.typeToString(ctx.option.type)}) - Not a valid integer (${value[0]}) - ${ctx.option.description}`);
            }
            return value[0];
        } else if (value.length > 1) {
            throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `${this.typeToString(ctx.option.type)} - Only one value is allowed (${value.join(',')}) - ${ctx.option.description}`);
        }
    }

    private parseAsFolderPath(value: string[], ctx: UserOptionParseContext) {
       
        if (value.length === 0) {
            throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `${this.typeToString(ctx.option.type)} - No value was specified - ${ctx.option.description}`);
        }

        if (value.length > 1) {
            throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `${this.typeToString(ctx.option.type)} - Only one value is allowed (is ${value.join(',')}) - ${ctx.option.description}`);
        }

        let zipFolderInfo = this.extractZipFolderName(value[0], '');
        let valuesToTest = [zipFolderInfo.value];
        let existingFolderPath: string = null;
        
        valuesToTest.forEach(currentPath => {
            if (this.fileManager.exists(currentPath)) {
                existingFolderPath = this.fileManager.resolvePath(currentPath);
            }
        })

        if (!existingFolderPath) {
            throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `${this.typeToString(ctx.option.type)} - Folder not found - ${zipFolderInfo.value}` + (zipFolderInfo.zipTargetFolder ? ` (Zip target folder "${zipFolderInfo.zipTargetFolder}" was removed from test)` : ''));
        }

        return existingFolderPath;
    }

    private parseAsFolderPathArray(value: string[], ctx: UserOptionParseContext) {
       
        if (value.length === 0) {
            throw new ParameterException(`--${ctx.command.commandLongName}.${ctx.option.key} (${ctx.source})`, null, `${this.typeToString(ctx.option.type)} - No value was specified - ${ctx.option.description}`);
        }

        let paths = value.map(v => this.parseAsFolderPath([v], ctx) );

        return paths;
    }

    public extractZipFolderName(val: string, fallbackTargetFolderValue: string): { zipTargetFolder: string, value: string} {
        let zipTargetFolder = fallbackTargetFolderValue;
        let value = val;
        const regexMatch = val.match(/^@([\/a-zA-Z0-9_-]+)\((.*?)\)$/);
        if (regexMatch) {
            value = regexMatch[2]
            zipTargetFolder = regexMatch[1];
        }
        return { zipTargetFolder, value }
    }
    

    
    public typeToString(type: UserOptionType): string {
        switch(type) {
            case UserOptionType.StringArray:
            return 'string[]';
            case UserOptionType.String:
            return 'string';
            case UserOptionType.MacroString:
            return 'macroString';
            case UserOptionType.Int:
            return 'int';
            case UserOptionType.IntArray:
            return 'int[]';
            case UserOptionType.FilePath:
            return 'filepath';
            case UserOptionType.FolderPath:
            return 'folderpath';
            case UserOptionType.FolderPathArray:
            return 'folderpath[]';
            default:
            return 'unknown';
        }
    }
    


}
