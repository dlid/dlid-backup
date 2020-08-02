import { DlidBackupError } from './../../exceptions/collector.error';
import { stringify } from 'yaml';
import { FileSystemTargetOptions } from './../../targets/filesystem/filesystem.target';
import { Logger, logger, LogLevel } from './../../util/logger';
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
    private log: Logger;

    constructor() {
        this.log = logger.child('CommandManager');
    }

    /**
     * Set the list of valid commands
     * @param commands List of available commands
     */
    public setCommands(...commands: CommandInterface[]): void {

        commands.filter(c => c.shortName.length > 1).forEach(c => {
            throw new DlidBackupError('CommandManager', 'Command shortName must not be longer than 1 character', null);
        })

        this.commands = commands;
    }
    
    /**
     * Parse the incoming, normalized, parameters to a list of commands with arguments and options
     */
    public parseFromCommandLineParameters(normalizedParameters: ArgvParameterArray): ParsedCommand[] {

        this.log.debug(`Parsing commands from normalized parameters`);

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
                    this.log.trace(`[${value}] Detected option`);
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
                        
                    this.log.trace(`[${value}] Initializing command ${result.length}`);
                    } else {
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
                    this.log.trace(`[${value}] Command is not one of ${this.commands.map(x => x.longName).join(',')}`);
                    throw new ParameterException(value, null, `Unknown parameter ${value}`, null);
                }
            } else {
                if (current) {
                    if (!currentOptionName) {
                        current.parameters.push(value);
                        this.log.trace(`[--${current.commandLongName}] Adding parameter "${value}"`);
                    } else {
                        
                        let c = prevOptionIndex !== null ? result[prevOptionIndex] : current;
                        let existingOption =  c.options.find(f => f.key === currentOptionName);
                        
                        this.log.trace(`[--${c.commandLongName}.${currentOptionName}] Adding value "${value}" to option`);
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

        result.forEach((o, i) => {
            this.log.trace(`command[${i}].name == '${o.commandLongName}'`);
            this.log.trace(`command[${i}].parameters = ${JSON.stringify(o.parameters)}`);
            o.options.forEach(op => {
                this.log.trace(`command[${i}].options[${op.key}] = ${JSON.stringify(op.values)}`);
            })
        });

        this.log.debug(`Found ${result.length} command(s)`);
        
        return result;
    }
    
    /**
     * Return all commands
     */
    public getAll(): CommandInterface[] {
        return this.commands.slice(0);
    }

    /**
     * Get a command by its long name
     */
    public getByLongName(longName: string): CommandInterface {
        return longName 
        ? this.commands.find(c => c.longName === longName.replace(/^[-\\/]*/, ''))
        : undefined;
    }
    
    /**
     * Get a command by its short name
     */
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
        } else {
            result = this.commands.find(c => c.longName === val);
        }
        return result;
    }
}
