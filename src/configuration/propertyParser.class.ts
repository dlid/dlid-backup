import path = require('path');
import fs = require('fs');
import { Logger, logger } from '../util/logger';
import { ConfigurableSetting, ConfigurableSettingType } from '../types';
import { typeToString } from '../util';

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
    
    parseAsString(val: any, isSensitive?: boolean) {
        let error = '';
        let value = null;
        
        if(typeof val === 'undefined' || val === null) {
            value = '';
        } else {
            value = val.toString();
        }
        return { error, value };
    }  
    
    parseAsStringArray(val: string): {error: string, value: string[]} {
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

    parseAsFolderPath(val: string) {
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
                       
                }
        }
    
        if (!value) {
            error = 'Could not find folder "' + val + '"';
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
                
            }
        }
        
        if (!value) {
            error = 'Could not find file <em>' + val + '</em>';
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
