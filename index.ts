import { FolderCollector, MySqlCollector }  from "./src/collectors";
import { FileSystemTarget, FireStoreTarget } from './src/targets';
import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "./src/types";
import { ConfigurableArgumentParser } from "./src/configuration/ConfigurableArgumentParser";
import { CollectorBase } from "./src/types/CollectorBase.type";
import { TargetBase } from "./src/types/TargetBase.type";
const fs = require('fs');
const path = require('path');


interface Configuration {
        collectors: OConfig[];
        targets: OConfig[];
        
}

interface OConfig {
        name: string;
        type: string,
        settings: {[key: string]: any};
}

interface JobConfiguration {
        source: Configurable;
        sourceSettings: {[key: string]: any};
        target: Configurable;
        targetSettings: {[key: string]: any};
}

// dlid-backup --job config-files --archive=config-files-{year}W{week}.zip --output weekly/{year}W{week}/ --save 10


// dlid-backup /s:mysql /s.host=localhost /s.port=3306


class DlidBackup {
        constructor(private configurables: Configurable[]) {}
        
        /**
        * 
        * @param configFilePath 
        */
        load(configFilePath: string) {
                return new Promise((reolve, reject) => {
                        
                });
        }
        
        config(config: Configuration) {
                
        }

        parseArguments() {

                const argparser = new ConfigurableArgumentParser();

                let source = argparser.extractArguments('s', 'source', process.argv.slice(2),  this.configurables, CollectorBase);

                if (!source.collectorName) {
                        throw new Error(`Source is required`);
                }

                if (!source.configExists) {
                        throw new Error(`Source type '${source.collectorName}' was not found`);
                }

                let target = argparser.extractArguments('t', 'target', source.remainingArguments,  this.configurables, TargetBase);
                if (!target.collectorName) {
                        throw new Error(`Target is required`);
                }
                if (!target.configExists) {
                        throw new Error(`Target type '${target.collectorName}' was not found`);
                }

                console.log("source", source);
                console.log("target", target);


                const collector = this.configurables.find(cfg => cfg.name === source.collectorName);
                const targetCollector = this.configurables.find(cfg => cfg.name === target.collectorName);

                let sourceSettings = this.setupConfigurable( collector, source.settings)
                let targetSettings = this.setupConfigurable( targetCollector, target.settings)

                let errors = this.verifyRequiredSettings(collector, sourceSettings);
                errors.concat(this.verifyRequiredSettings(targetCollector, targetSettings))


                if (errors.length > 0) {
                        console.log(`\n\n\x1b[31m${errors.join('\n')}\x1b[0m\n\n`);
                        throw new Error(`Configuration error`);
                }

                console.log(errors);

                console.log(collector.explain(sourceSettings));
                console.log(targetCollector.explain(targetSettings));

        }

        verifyRequiredSettings(cfg: Configurable, settings: any) {
                const options = cfg.getOptions();
                const errors = [];

                options.forEach(op => {
                        if (op.isRequired && typeof settings[op.key] === 'undefined') {
                                const type = cfg instanceof CollectorBase  ? '-s' : '-t';
                                errors.push(`[${cfg.name}] option '${type}.${op.key}' is required `);
                        }
                });

                return errors;
        }

        setupConfigurable(cfg: Configurable, settings: any, ) {

                const options = cfg.getOptions();
                const keys = Object.keys(settings);
                const result = {};

                keys.forEach(propertyName => {

                        const property = options.find(option => option.key === propertyName);

                        if (property) {
                                const prop = this.parseProperty(cfg.name, propertyName, property, settings[propertyName]);
                                if (prop.error) {
                                        throw new Error(prop.error);
                                }
                                result[propertyName] = prop.value;
                        } else {
                                throw new Error("unknown property " + propertyName);
                        }

                });

                options.forEach(op => {
                        if (typeof result[op.key] === 'undefined') {
                                if ( typeof op.defaultValue !== 'undefined' ) {
                                        result[op.key] = op.defaultValue;
                                }
                        }
                })

                return result;
        }

        private typeToSting(type: ConfigurableSettingType) {
                switch(type) {
                        case ConfigurableSettingType.StringArray:
                                return 'string[]';
                        case ConfigurableSettingType.String:
                                return 'string';
                        case ConfigurableSettingType.Int:
                                return 'int';
                        case ConfigurableSettingType.IntArray:
                                return 'int[]';
                        case ConfigurableSettingType.FilePath:
                                return 'filepath';
                        case ConfigurableSettingType.FolderPath:
                                return 'folderpath';
                        default:
                                return 'unknown';
                }
        }

        parseProperty(configurableName: string, propertyName: string, prop: ConfigurableSetting, originalValue: any) {

                let parsedValue: { value: any, error: string } = null;

                switch(prop.type) {
                        case ConfigurableSettingType.String:
                                parsedValue = this.parseAsString(originalValue);
                                
                        break;
                        case ConfigurableSettingType.Int:
                                parsedValue = this.parseAsInt(originalValue);
                        break;
                        case ConfigurableSettingType.StringArray:
                                parsedValue = this.parseAsStringArray(originalValue);
                        break;
                        case ConfigurableSettingType.FilePath:
                                parsedValue = this.parseAsFilePath(originalValue);
                        break;
                        case ConfigurableSettingType.FolderPath:
                                parsedValue = this.parseAsFolderPath(originalValue);
                        break;
                        default:
                                parsedValue.error = `${propertyName} Property type '${this.typeToSting(prop.type)}' is not implemented`;
                        break;
                }

                const value = parsedValue.value;
                const error = parsedValue.error;

                return { value, error };
        }

        parseAsString(val: any) {
                let error = '';
                let value = null;

                if(typeof val === 'undefined' || val === null) {
                        value = '';
                } else {
                        value = val.toString();
                }
                return { error, value };
        }  

        parseAsFilePath(val: any) {
                let error = '';
                let value = null;

                if(typeof val === 'undefined' || val === null) {
                        value = '';
                }

                let tries = [path.resolve(val)];
                tries.push( path.join( __dirname, val));

                for( let i=0; i < tries.length; i++) {
                        try {
                                if (fs.existsSync(tries[i])) {
                                        value = tries[i];
                                        break;
                                }
                        } catch(err) {
                                console.error(err)
                        }
                }

                if (!value) {
                        error = 'Could not find file ' + val;
                }

                return { error, value };
        }

        parseAsFolderPath(val: any) {
                let error = '';
                let value = null;

                if(typeof val === 'undefined' || val === null) {
                        value = '';
                }

                let tries = [path.resolve(val)];
                tries.push( path.join( __dirname, val));

                for( let i=0; i < tries.length; i++) {
                        try {
                              fs.statSync(tries[i]);
                        value = tries[i];
                        break;
                        } catch(err) {
                                console.error(err)
                        }
                }

                if (!value) {
                        error = 'Could not find folder ' + val;
                }

                return { error, value };
        }

        parseAsStringArray(val: string) {
                let error = '';
                let value = null;

                const m = val.match(/^(.) /);
                let separator = ',';

                if (m) {
                        separator = m[1];
                        val = val.substring(m[0].length)
                }
                
                value = val.split(separator).map(f => f.trim()).filter(f => f);

                return { error, value };
        }  
        
        parseAsInt(val: any) {
                let error = '';
                let value = null;

                if(typeof val === 'undefined' || val === null) {
                        error = 'no value';
                }
                if (val.toString().match(/^\d+$/)) {
                        value = parseInt(val, 10);
                } else {
                        error = 'Invalid int: ' + val.toString();
                }
                return { error, value };
        }   
        
}

var bak = new DlidBackup([new FolderCollector(), new MySqlCollector(), new FileSystemTarget()]);

bak.parseArguments()
// .then()
// .catch(err => err)




