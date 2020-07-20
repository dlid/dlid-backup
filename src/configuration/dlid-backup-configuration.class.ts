import { CollectorBase } from "../types";
import { commandLineParser } from "./command-line-parameter-parser.instance";
import { propertyParser } from "./propertyParser.class";
import { Logger, logger, joinWithOr } from "../util";
import { ParameterException } from "../exceptions";
import {MacroStore} from '../macros/macro-store.class';
import fs = require('fs');
import { autoInjectable, injectable, inject } from "tsyringe";
import {CommandManagerInterface, UserOptionInterface } from './../lib';


@autoInjectable()
export class DlidBackupConfiguration {
    
    action: string;
    source?: CollectorBase<any>;
    sourceOptions?: any;
    target?: CollectorBase<any>;
    targetOptions?: any
    macros: MacroStore;
    
    private log: Logger;
    
    constructor() {
        this.log = logger.child(this.constructor.name)
    }
    


    // public parseCommands(normalizedArguments: string[]): ParsedCommand[] {
    //     let result: ParsedCommand[] = [];

    //     let current: ParsedCommand = null;
    //     let currentOptionName: string = null;
    //     let prevOptionIndex: number;
    //     normalizedArguments.forEach((value, index) => {


    //         if (value.startsWith('--')) {
    //             let commandLongName = value.substring(2);
    //             const isOption = commandLongName.indexOf('.') !== -1;
    //             if (isOption) {
    //                 commandLongName = commandLongName.substr(0, commandLongName.indexOf('.'))
    //                 currentOptionName = value.substring(value.indexOf('.') + 1);
    //             } else {
    //                 currentOptionName = null;
    //             }
    //             let cmd = this.commandManager.getByLongName(commandLongName);
    //             if (cmd) {

    //                 if (isOption && cmd.hasOptions && commandLongName !== current?.commandLongName) {
    //                     const prev = result.findIndex(f => f.commandLongName === commandLongName);
    //                     if (prev !== -1) {
    //                         prevOptionIndex = prev;
    //                         return;
    //                     }
    //                     throw new Error("Option specified for non-initialized " + cmd.long);
    //                 }

    //                 prevOptionIndex = null;

    //                 if (!isOption) {
    //                     // New command from here
    //                     if (current) {
    //                         result.push(current);
    //                     }
    //                     current = {
    //                         commandLongName: cmd.long,
    //                         options: [],
    //                         parameters: []
    //                     }
    //                 } else if (current) {
    //                     const existingOption = current.options.find(k => k.key === currentOptionName);
    //                     if (!existingOption) {
    //                         current.options.push({
    //                             key: currentOptionName,
    //                             values: []
    //                         });
    //                     }
    //                     current.options[currentOptionName];
    //                 }
    //             } else {
    //                 throw new ParameterException('Unknown parameter', null, value);
    //             }
    //         } else {
    //             if (current) {
    //                 if (!currentOptionName) {
    //                     current.parameters.push(value);
    //                 } else {

    //                     let c = prevOptionIndex !== null ? result[prevOptionIndex] : current;
    //                     let existingOption =  c.options.find(f => f.key === currentOptionName);

    //                     if (!existingOption) {
    //                         c.options.push({
    //                             key: currentOptionName,
    //                             values: [value]
    //                         });
    //                     } else {
    //                         existingOption.values.push(value);
    //                     }
    //                 }
    //             }
    //         }

    //     });
    //     if (current) {
    //         result.push(current);
    //     }

    //     return result;
    // }



    


    /** 
    * Parse the incoming parameters in order to resolve the configuration
    */
    public async parseParameters(): Promise<void> {


        return new Promise((resolve, reject) => {
            // try {
            //     console.log(this.parseArguments());

            // }catch (e) {
            //     reject(e);
            // }
           
            return reject("nä"); 

            // const actions: string[] = ['run', 'help']; // , 'explain', 'dry-run',
            // let args = this.parameters.slice(2);
            // let action;
            // if (args.length === 0) {
            //     this.action = 'help';
            //     resolve();
            //     return;
            // }
            
            // if (!actions.includes(args[0])) {
            //     this.log.error(`First parameter must be a valid action (${joinWithOr(actions)})`)
            //     throw new ParameterException('Action', args[0], `First parameter must be ACTION (${joinWithOr(actions)})`)
            // }
            
            // action = args[0];
            
            // if (action === 'help') {
            //     this.log.trace('Help parameter detected');
            //     this.action = 'help ' + args.slice(1).join(' ')
            //     return resolve();
            // }
            
            // const targets = this.configurables.filter(c => c instanceof CollectorBase).map(c => c.name);
            // const collectors = this.configurables.filter(c => c instanceof TargetBase).map(c => c.name);
            
            // /**
            // * Find the source (collector) and all its options
            // */
            
            // let source = commandLineParser.extractArguments('s', 'source', args,  this.configurables, CollectorBase);
            // if (!source.collectorName) {
            //     throw new ParameterException('--source', null, `Source parameter is required (--source:${collectors.join('|')})`)
            // }
            
            // if (!source.configExists) {
            //     throw new ParameterException('--source', source.collectorName, `"${source.collectorName}" is not a registered source type (${collectors.join('|')})`)
            // }
            
            // const collector = this.configurables.find(cfg => cfg.name === source.collectorName && cfg instanceof CollectorBase);
            // let sourceSettings = this.findSettings( collector, source.settings)
            
            
            // /**
            // * Find the target and all its options
            // */
            // let target = commandLineParser.extractArguments('t', 'target', source.remainingArguments, this.configurables, TargetBase);
            // if (!target.collectorName) {
            //     throw new ParameterException('--target', null, `Target parameter is required: --target:${targets.join('|')}`);
            // }
            // if (!target.configExists) {
            //     throw new ParameterException('--target', target.collectorName, `"${target.collectorName}" is not a registered target type (${targets.join('|')})`)
            // }
            
            // const targetConfigurable = this.configurables.find(cfg => cfg.name === target.collectorName&& cfg instanceof TargetBase);
            // const targetSettings = this.findSettings(targetConfigurable, target.settings)

            // this.action = action;
            // this.source = collector;
            // this.sourceOptions = sourceSettings;
            // this.target = targetConfigurable;
            // this.targetOptions = targetSettings;
            // resolve();
        });    
    }
    
    
    /**
    * Identify and return relevant Configurable configuration from the settings
    * @param cfg The Configurable for which to extract settings
    * @param settings All the settings to extract relevant settings for
    * @param log The logger to use
    */
    findSettings(options: UserOptionInterface[], settings: any, log?: Logger)   {
        log = log || logger.child(this.constructor.name);
        
        const keys = Object.keys(settings);
        const result = {};
        // const type = cfg instanceof CollectorBase  ? '-s' : '-t';
        
        // log.trace(`${type}.${cfg.name} Finding settings`)
        
        // keys.filter(key => key !== '__multi').forEach(propertyName => {
            
        //     const property = options.find(option => option.key === propertyName);
        //     let values = [settings[propertyName]];
            
        //     if (property) {
        //         if (settings['__multi']) {
        //             if (settings['__multi'][propertyName]) {
        //                 if (property.multi === true) {
                            
        //                     values = settings['__multi'][propertyName];
        //                 } else {
        //                     throw new ParameterException(`${type}.${propertyName}`, null, `[${cfg.name}] "${propertyName}" can only be specified once`);
        //                 }
        //             } 
        //         }
                
        //         values.forEach(value => {
        //             const prop = propertyParser.parsePropertyValue(cfg.name, propertyName, property, value);
        //             if (prop.error) {
        //                 const isCollector = cfg instanceof CollectorBase;
        //                 throw new ParameterException(property.key, value, prop.error, cfg.name, isCollector);
        //             }
        //             if (property.multi === true) {
        //                 if(!result[propertyName]) {
        //                     result[propertyName] = [];
        //                 }
        //                 if (property.type === ConfigurableSettingType.StringArray) {
        //                     if (Array.isArray(prop.value)) {
        //                         result[propertyName] = result[propertyName].concat(prop.value);
        //                         return;
        //                     }
        //                 }
        //                 result[propertyName].push(prop.value);
        //             } else {
        //                 result[propertyName] = prop.value;
        //             }
        //         })
                
        //     } else {
        //         throw new ParameterException(`${type}.${propertyName}`, null, `[${cfg.name}] "${propertyName}" is not a valid option`);
        //     }
            
        // });
        
        // options.forEach(op => {
        //     if (typeof result[op.key] === 'undefined') {
        //         if ( typeof op.defaultValue !== 'undefined' ) {
        //             result[op.key] = op.defaultValue;
        //         }
        //     }
        // });
        
        // log.trace(`${type}.${cfg.name} Check for missing ${type === '-t' ? 'Target' : 'Collector'} ${cfg.name} options`);
        // cfg.getOptions().filter(f => f.isRequired).forEach(requiredParameter => {
        //     if (typeof result[requiredParameter.key] === 'undefined') {
        //         throw new ParameterException(`${type}.${requiredParameter.key}`, undefined, `Missing required ${cfg.name} parameter "${requiredParameter.key}"`);
        //     }
        // });
        // log.trace(`${type}.${cfg.name} All options are set`);
        
        return result;
        
    }
    
    
    
}
