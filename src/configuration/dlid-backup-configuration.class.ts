import { Configurable, TargetBase, CollectorBase, ConfigurableSettingType } from "../types";
import { commandLineParser } from "./command-line-parameter-parser.instance";
import { propertyParser } from "./propertyParser.class";
import { Logger, logger, joinWithOr } from "../util";
import { ParameterException } from "../exceptions";


export class DlidBackupConfiguration {
    
    action: string;
    source?: Configurable;
    sourceOptions?: any;
    target?: Configurable;
    targetOptions?: any
    
    private log: Logger;
    
    constructor(public configurables: Configurable[], public parameters: string[]) {
        this.log = logger.child(this.constructor.name)
    }
    
    /**
    * Parse the incoming parameters in order to resolve the configuration
    */
    public async parseParameters(): Promise<void> {
        return new Promise((resolve, reject) => {
            const actions: string[] = ['run', 'explain', 'dry-run', 'help'];
            let args = this.parameters.slice(2);
            let action;
            if (args.length === 0) {
                this.action = 'help';
                resolve();
                return;
            }
            
            if (!actions.includes(args[0])) {
                this.log.error(`First parameter must be a valid action (${joinWithOr(actions)})`)
                throw new ParameterException('Action', args[0], `First parameter must be ACTION (${joinWithOr(actions)})`)
            }
            
            action = args[0];
            
            if (action === 'help') {
                this.log.trace('Help parameter detected');
                this.action = 'help ' + args.slice(1).join(' ')
                return;
            }
            
            const targets = this.configurables.filter(c => c instanceof TargetBase).map(c => c.name);
            const collectors = this.configurables.filter(c => c instanceof TargetBase).map(c => c.name);
            
            /**
            * Find the source (collector) and all its options
            */
            
            let source = commandLineParser.extractArguments('s', 'source', args,  this.configurables, CollectorBase);
            if (!source.collectorName) {
                throw new ParameterException('--source', null, `Source parameter is required (--source:${collectors.join('|')})`)
            }
            
            if (!source.configExists) {
                throw new ParameterException('--source', source.collectorName, `"${source.collectorName}" is not a registered source type (${collectors.join('|')})`)
            }
            
            const collector = this.configurables.find(cfg => cfg.name === source.collectorName);
            let sourceSettings = this.findSettings( collector, source.settings)
            
            
            /**
            * Find the target and all its options
            */
            let target = commandLineParser.extractArguments('t', 'target', source.remainingArguments, this.configurables, TargetBase);
            if (!target.collectorName) {
                throw new ParameterException('--target', null, `Target parameter is required: --target:${targets.join('|')}`);
            }
            if (!target.configExists) {
                throw new ParameterException('--target', target.collectorName, `"${target.collectorName}" is not a registered target type (${targets.join('|')})`)
            }
            
            const targetConfigurable = this.configurables.find(cfg => cfg.name === target.collectorName);
            const targetSettings = this.findSettings(targetConfigurable, target.settings)

            this.action = action;
            this.source = collector;
            this.sourceOptions = sourceSettings;
            this.target = targetConfigurable;
            this.targetOptions = targetSettings;
            resolve();
        });    
    }
    
    
    /**
    * Identify and return relevant Configurable configuration from the settings
    * @param cfg The Configurable for which to extract settings
    * @param settings All the settings to extract relevant settings for
    * @param log The logger to use
    */
    findSettings(cfg: Configurable, settings: any, log?: Logger)   {
        log = log || logger.child(this.constructor.name);
        
        const options = cfg.getOptions();
        const keys = Object.keys(settings);
        const result = {};
        const type = cfg instanceof CollectorBase  ? '-s' : '-t';
        
        log.trace(`${type}.${cfg.name} Finding settings`)
        
        keys.filter(key => key !== '__multi').forEach(propertyName => {
            
            const property = options.find(option => option.key === propertyName);
            let values = [settings[propertyName]];
            
            if (property) {
                if (settings['__multi']) {
                    if (settings['__multi'][propertyName]) {
                        if (property.multi === true) {
                            
                            values = settings['__multi'][propertyName];
                        } else {
                            throw new ParameterException(`${type}.${propertyName}`, null, `[${cfg.name}] "${propertyName}" can only be specified once`);
                        }
                    } 
                }
                
                values.forEach(value => {
                    const prop = propertyParser.parsePropertyValue(cfg.name, propertyName, property, value);
                    if (prop.error) {
                        const isCollector = cfg instanceof CollectorBase;
                        throw new ParameterException(property.key, value, prop.error, cfg.name, isCollector);
                    }
                    if (property.multi === true) {
                        if(!result[propertyName]) {
                            result[propertyName] = [];
                        }
                        if (property.type === ConfigurableSettingType.StringArray) {
                            if (Array.isArray(prop.value)) {
                                result[propertyName] = result[propertyName].concat(prop.value);
                                return;
                            }
                        }
                        result[propertyName].push(prop.value);
                    } else {
                        result[propertyName] = prop.value;
                    }
                })
                
            } else {
                throw new ParameterException(`${type}.${propertyName}`, null, `[${cfg.name}] "${propertyName}" is not a valid option`);
            }
            
        });
        
        options.forEach(op => {
            if (typeof result[op.key] === 'undefined') {
                if ( typeof op.defaultValue !== 'undefined' ) {
                    result[op.key] = op.defaultValue;
                }
            }
        });
        
        log.trace(`${type}.${cfg.name} Check for missing ${type === '-t' ? 'Target' : 'Collector'} ${cfg.name} options`);
        cfg.getOptions().filter(f => f.isRequired).forEach(requiredParameter => {
            if (typeof result[requiredParameter.key] === 'undefined') {
                throw new ParameterException(`${type}.${requiredParameter.key}`, undefined, `Missing required ${cfg.name} parameter "${requiredParameter.key}"`);
            }
        });
        log.trace(`${type}.${cfg.name} All options are set`);
        
        console.warn("AHA", result);
        
        return result;
        
    }
    
    
    
}
