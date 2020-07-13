import path = require('path');
import fs = require('fs');
import { Logger, logger } from '../util/logger';
import { ConfigurableSetting, ConfigurableSettingType } from '../types';
import { typeToString } from '../util';
import { extractZipFolderName } from '../util/extractZipFolderName.function';

export class PropertyParser {
    
    private log: Logger;
    
    constructor() {
        this.log = logger.child(this.constructor.name);
    }

    parsePropertyValue(configurableName: string, propertyName: string, prop: ConfigurableSetting, originalValue: any, log?: Logger) {
        log = log || logger;
    
        let parsedValue: { value: any, error: string } = null;

        switch(prop.type) {
                case ConfigurableSettingType.String:
                        parsedValue = this.parseAsString(originalValue, prop);
                break;
                case ConfigurableSettingType.Int:
                        parsedValue = this.parseAsInt(originalValue);
                break;
                case ConfigurableSettingType.StringArray:
                        parsedValue = this.parseAsStringArray(originalValue, prop);
                break;
                case ConfigurableSettingType.FilePath:
                        parsedValue = this.parseAsFilePath(originalValue, prop);
                break;
                case ConfigurableSettingType.FolderPath:
                        parsedValue = this.parseAsFolderPath(originalValue, prop);
                break;
                case ConfigurableSettingType.FolderPathArray:
                        parsedValue = this.parseAsFolderPath(originalValue, prop);
                break;
                default:
                        parsedValue.error = `${propertyName} Property type '${typeToString(prop.type)}' is not implemented`;
                break;
        }
    
        const value = parsedValue.value;
        const error = parsedValue.error;
    
        if (!error) {
            log.trace(`${configurableName}.${propertyName} - ${typeToString(prop.type)} value was successfully parsed`, value);
        } else {
            log.trace(`${configurableName}.${propertyName} - could not be parsed as a ${typeToString(prop.type)}`);
        }
    
        return { value, error };
    }
    
    parseAsString(val: any, prop: ConfigurableSetting) {
        let error = '';
        let value = null;
        
        if(typeof val === 'undefined' || val === null) {
            value = '';
        } else {
            value = val.toString();
        }
        return { error, value };
    }  
    
    parseAsStringArray(val: string, prop: ConfigurableSetting): {error: string, value: string[]} {
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

    parseAsFolderPathArray(val: string, prop: ConfigurableSetting): {error: string, value: string[]} {
        
        let { error, value} = this.parseAsStringArray(val, prop);

        if (!error) {
            value = value.map(f => this.parseAsFolderPath(f.trim(), prop).value ).filter(f => f);
        }
        
        return { error, value };
    }

    parseAsFolderPath(val: string, prop: ConfigurableSetting) {
        let error = '';
        let value = null;
    
        if(typeof val === 'undefined' || val === null) {
                value = '';
        }

        var valueToTest = val;
        let zipFolderName: string = null;
        if (prop.allowZipTargetFolder) {
            const t = extractZipFolderName(valueToTest, '');
            valueToTest = t.value;
            zipFolderName = t.zipTargetFolder;
        }

        let tries = [path.resolve(valueToTest)];
        tries.push( path.join( __dirname, valueToTest));
    
        for( let i=0; i < tries.length; i++) {
            try {
                fs.statSync(tries[i]);
                value = tries[i];
                if (zipFolderName) {
                    value = `@${zipFolderName}(${value})`;
                }
                break;
            } catch(err) {
                    
            }
        }
    
        if (!value) {
            error = 'Could not find folder "' + valueToTest + '"';
        }
    
        return { error, value };
    }
    
    parseAsFilePath(val: any, prop: ConfigurableSetting) {
        let error = '';
        let value = null;
        
        if(typeof val === 'undefined' || val === null) {
            value = '';
        }

        var valueToTest = val;
        let zipFolderName: string = null;
        if (prop.allowZipTargetFolder) {
            const t = extractZipFolderName(valueToTest, '');
            valueToTest = t.value;
            zipFolderName = t.zipTargetFolder;
        }
        
        let tries = [path.resolve(valueToTest)];
        tries.push( path.join( __dirname, valueToTest));
        
        for( let i=0; i < tries.length; i++) {
            try {
                if (fs.existsSync(tries[i])) {
                    value = tries[i];
                    if (zipFolderName) {
                        value = `@${zipFolderName}(${value})`;
                    }
                    break;
                }
            } catch(err) {
                
            }
        }
        
        if (!value) {
            error = 'Could not find file <em>' + valueToTest + '</em>';
        }
        
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

var propertyParser = new PropertyParser();
export { propertyParser };
