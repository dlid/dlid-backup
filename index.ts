import { GlobCollector, MySqlCollector }  from "./src/collectors";
import { FileSystemTarget, FireStoreTarget } from './src/targets';
import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "./src/types";
import { ConfigurableArgumentParser } from "./src/configuration/ConfigurableArgumentParser";
import { CollectorBase } from "./src/types/CollectorBase.type";
import { TargetBase } from "./src/types/TargetBase.type";
import { Archive } from "./src/archive/Archive";
const fs = require('fs');
const path = require('path');


var globby = require('globby');

(async () => {
        const paths = await globby(['../*']);
     
        console.log("x", paths);
        //=> ['unicorn', 'rainbow']
    })();



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

        help() {
                console.log(`
dlid-backup [run|explain]
 -s:<type> --source:<type>               Pick a source to make a backup of (mysql)
 -s.<option>=val --source.<option>=val   Set an option for the source
 -t:<type> --target:<type>               Pick a target where to save the backup
 -t.<option>=val --target.<option>=val   Set an option for the target
 -o=filename.zip                         The filename of the resulting zip archive
 
 dlid-backup -s   To run a guide to create source parameters
 dlid-backup -t   To run a guide to setup target parameters
 dlid-backup -o   To show available macros for output filename
 
                `);
        }

        parseArguments(): Promise<{
                action: '' | 'run' | 'explain' | 'save',
                source: Configurable;
                sourceOptions: any;
                target: Configurable;
                targetOptions: any
        }> {

                return new Promise((resolve, reject) => {
                        const argparser = new ConfigurableArgumentParser();
                        let args = process.argv.slice(2);
                        let action;
                        if (args.length === 0) {
                                this.help();
                                return;
                        }

                        if (args[0] !== 'explain' && args[0] !== 'run' && args[0] !== 'save') {
                                throw new Error('First parameter must be ACTION (run, explain or dry-run)')
                        }
                        action = args[0];


                        let source = argparser.extractArguments('s', 'source', args,  this.configurables, CollectorBase);

                        if (!source.collectorName) {
                                throw new Error(`Source is required`);
                        }

                        if (!source.configExists) {
                                throw new Error(`Source type '${source.collectorName}' was not found`);
                        }


                        let target = argparser.extractArguments('t', 'target', source.remainingArguments,  this.configurables, TargetBase);
                        if (!target.collectorName) {
                                const targets = this.configurables.filter(c => c instanceof TargetBase).map(c => c.name);
                                throw new Error(`[error] <em>target</em> is required. Use <code>-t</code> parameter to set target.\n\nAvailable targets: ${targets.join(', ')}`);
                        }
                        if (!target.configExists) {
                                throw new Error(`Target type '${target.collectorName}' was not found`);
                        }

                        const collector = this.configurables.find(cfg => cfg.name === source.collectorName);
                        const targetCollector = this.configurables.find(cfg => cfg.name === target.collectorName);
                        
                        let sourceSettings = this.setupConfigurable( collector, source.settings)
                     
                        let targetSettings = this.setupConfigurable( targetCollector, target.settings)

                        let errors = this.verifyRequiredSettings(collector, sourceSettings);
                        errors = errors.concat(this.verifyRequiredSettings(targetCollector, targetSettings))


                        if (errors.length > 0) {
                                throw new Error(`\n\n\x1b[31m${errors.join('\n')}\x1b[0m\n\n`);
                        }

                        resolve({
                                action: action,
                                source: collector,
                                sourceOptions: sourceSettings,
                                target: targetCollector,
                                targetOptions: targetSettings
                        });

                });
        }

        verifyRequiredSettings(cfg: Configurable, settings: any) {
                const options = cfg.getOptions();
                const errors = [];

                options.forEach(op => {
                        if (op.isRequired && typeof settings[op.key] === 'undefined') {
                                const type = cfg instanceof CollectorBase  ? '-s' : '-t';
                                const options = cfg.getOptions();
                                const desc = `\n <code>${op.key}</code>\t\t${this.typeToSting(op.type)}\t` + options[0].description


                                errors.push(`<em>${cfg.name}</em> option <code>${type}.${op.key}</code> is required${desc}\n`);
                        }
                });

                return errors;
        }

        setupConfigurable(cfg: Configurable, settings: any, ) {

                const options = cfg.getOptions();
                const keys = Object.keys(settings);
                const result = {};

                keys.filter(key => key !== '__multi').forEach(propertyName => {

                        const property = options.find(option => option.key === propertyName);
                        let values = [settings[propertyName]];
                        console.log("?", propertyName);
                        


                        if (property) {

                                if (settings['__multi']) {
                                        if (settings['__multi'][propertyName]) {
                                                if (property.multi === true) {
                                                
                                                        values = settings['__multi'][propertyName];
                                                } else {
                                                        const type = cfg instanceof CollectorBase  ? '-s' : '-t';
                                                        throw new Error(`[error] ${cfg.name} property <code>${type}.${propertyName}</code> can only be specified once`);
                                                }
                                        } 
                                }

                                values.forEach(value => {
                                        const prop = this.parseProperty(cfg.name, propertyName, property, value);
                                        if (prop.error) {
                                                const type = cfg instanceof CollectorBase  ? '-s' : '-t';
                                                throw new Error(`[error] ${cfg.name}: <code>${type}.${propertyName}</code> - ` + prop.error);
                                        }
                                        if (property.multi === true) {
                                                if(!result[propertyName]) {
                                                        result[propertyName] = [];
                                                }
                                                result[propertyName].push(prop.value);
                                        } else {
                                                result[propertyName] = prop.value;
                                        }
                                })
                                
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

                console.warn("AHA", result);

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
                                
                        }
                }

                if (!value) {
                        error = 'Could not find file <em>' + val + '</em>';
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
                               
                        }
                }

                if (!value) {
                        error = 'Could not find folder <em>' + val + '</em>';
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

var bak = new DlidBackup([new GlobCollector(), new MySqlCollector(), new FileSystemTarget()]);
try {

bak.parseArguments().then(f => {
        
        // if (f.action === 'save') {
        //         var data = "New File Contents";

        //         fs.writeFile("databases.json", JSON.stringify({type: f.source.name, options: f.sourceOptions}, null, 2), (err) => {
        //         if (err) console.log(err);
        //         console.log("Successfully Written to File.");
        //         });
        // }

        // throw new Error(f.action);


        var tmp = require('tmp');
        var tempFilename = tmp.tmpNameSync() + '.zip';
        var outputFile = new Archive(tempFilename);

        (<any>f.source as CollectorBase).collect(outputFile, f.sourceOptions).then(f => {
                outputFile.save().then(f => {
                        console.log(`${tempFilename} created. Send using Target`);
                })
        });        

}).catch(err => {
        console.log(format(err.message));
})
// .then()
// .catch(err => err)


} catch (e) {
        console.log(format(e.message));
}

function format(val: string) {

        const tags = {
                em: '\x1b[35m',
                code: '\x1b[33m'
        };

        let keys = Object.keys(tags);


        val = val.replace('[error]', '\x1b[41m\x1b[37m error \x1b[0m');

        keys.forEach(tagName => {
                let re = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`);
                let arrMatch;
                while (arrMatch = re.exec(val)) {
                        val = val.replace( arrMatch[0], `${tags[tagName]}${arrMatch[1]}\x1b[0m`);
                }
        })

        return val;



}
