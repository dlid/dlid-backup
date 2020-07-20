import { autoInjectable } from "tsyringe";
import { CommandManagerInterface } from "./CommandManagerInterface";
import { ParsedCommand } from "./ParsedCommand.interface";
import { ParameterException } from "../../exceptions";
import { ArgvParameterArray } from "../argvManager";
import { CommandInterface } from "./Command.interface";

/**
* Manage the commands allowed as CLI arguments 
*/
@autoInjectable()
export class CommandManager implements CommandManagerInterface {
    
    private commands: CommandInterface[] = [];
    
    constructor() {
        this.commands = [
            {longName: 'help', shortName: 'h', name: 'Help'},
            {longName: 'source', shortName: 's', name: 'Source'},
            {longName: 'target', shortName: 't', name: 'Target'},
            {longName: 'verbose', shortName: 'v', name: 'Verbose'}
        ];
    }
    
    public parseFromCommandLineParameters(normalizedParameters: ArgvParameterArray): ParsedCommand[] {
        let result: ParsedCommand[] = [];
    
        
        let current: ParsedCommand = null;
        let currentOptionName: string = null;
        let prevOptionIndex: number;
        normalizedParameters.forEach((value, index) => {
            if (value.startsWith('--')) {
                let commandLongName = value.substring(2);
                const isOption = commandLongName.indexOf('.') !== -1;
                if (isOption) {
                    commandLongName = commandLongName.substr(0, commandLongName.indexOf('.'))
                    currentOptionName = value.substring(value.indexOf('.') + 1);
                } else {
                    currentOptionName = null;
                }
                let cmd = this.getByLongName(commandLongName);
                if (cmd) {
                    if (isOption && commandLongName !== current?.commandLongName) {
                        const prev = result.findIndex(f => f.commandLongName === commandLongName);
                        if (prev !== -1) {
                            prevOptionIndex = prev;
                            return;
                        }
                        throw new Error("Option specified for non-initialized " + cmd.longName);
                    }
                    
                    prevOptionIndex = null;
                    
                    if (!isOption) {
                        // New command from here
                        if (current) {
                            result.push(current);
                        }
                        current = {
                            commandLongName: cmd.longName,
                            options: [],
                            parameters: []
                        }
                    } else if (current) {
                        const existingOption = current.options.find(k => k.key === currentOptionName);
                        if (!existingOption) {
                            current.options.push({
                                key: currentOptionName,
                                values: []
                            });
                        }
                        current.options[currentOptionName];
                    }
                } else {
                    throw new ParameterException('Unknown parameter', null, value);
                }
            } else {
                if (current) {
                    if (!currentOptionName) {
                        current.parameters.push(value);
                    } else {
                        
                        let c = prevOptionIndex !== null ? result[prevOptionIndex] : current;
                        let existingOption =  c.options.find(f => f.key === currentOptionName);
                        
                        if (!existingOption) {
                            c.options.push({
                                key: currentOptionName,
                                values: [value]
                            });
                        } else {
                            existingOption.values.push(value);
                        }
                    }
                }
            }
            
        });
        if (current) {
            result.push(current);
        }
        
        return result;
    }
    
    public getAll(): CommandInterface[] {
        return this.commands.slice(0);
    }
    
    public getByLongName(longName: string): CommandInterface {
        return longName 
        ? this.commands.find(c => c.longName === longName.replace(/^[-\\/]*/, ''))
        : undefined;
    }
    
    public getByShortName(shortName: string): CommandInterface {
        return shortName 
        ? this.commands.find(c => c.shortName === shortName.replace(/^[-\\/]*/, ''))
        : undefined;
    }
    
    public find(val: string): CommandInterface {
        let result: CommandInterface;
        if (val.startsWith('-') && !val.startsWith('--')) {
            result = this.commands.find(c => c.shortName === val.replace(/^-+/g, ''));    
        } else if (val.startsWith('--')) {
            result = this.commands.find(c => c.longName === val.replace(/^-+/g, ''));    
        } else if (val.startsWith('/')) {
            let withoutSlash = val.substr(1);
            result = this.commands.find(c => c.shortName === withoutSlash || c.longName === withoutSlash);    
        } else if (val.length === 1) {
            result = this.commands.find(c => c.shortName === val);    
        } else if (val.length > 1) {
            result = this.commands.find(c => c.longName === val);    
        }
        return result;
    }
}

class Singleton {
    
    private static instance: CommandManager;
    
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new CommandManager();
        }
    }
    
    getInstance(): CommandManager {
        return Singleton.instance;
    }
    
}
