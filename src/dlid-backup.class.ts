import { Configurable, TargetArguments } from "./types";
import { CollectorBase } from "./types/CollectorBase.type";
import { TargetBase } from "./types/TargetBase.type";
import { DlidBackupConfiguration } from "./configuration/dlid-backup-configuration.class";
import { typeToString, LogLevel } from "./util";
import tmp = require('tmp');
import { Archive } from "./archive/Archive";
const os = require('os');
import { CollectionResult } from "./types/CollectionResult.type";
import { logger } from './util';
import { CollectorArguments } from "./types/CollectorArguments.interface";
import { moveMessagePortToContext } from "worker_threads";
import {formatISO} from 'date-fns';
import { getUtcNowString } from "./util/getUtcNowString.function";
import { formatMacroDate } from "./util/formatMacroDate.function";
import {DateMacroFormatter} from './macros/date-macro.class';
import { MacroStore } from "./macros/macro-store.class";
import fs = require('fs');
import yaml = require('yaml');
import { FilesystemCollector, MySqlCollector } from "./collectors";
import { FileSystemTarget, FireStoreTarget } from "./targets";
import { SynologyFilestationTarget } from "./targets/syn-nas/syn-nas.target";


 export class DlidBackup {
    
    private config: DlidBackupConfiguration;
    private readmeLines: string[] = [];
    private version = '%DLID-BACKUP-VERSION%'; // Replaced by script
    
    constructor(private parameters: string[]) {
        logger.setLogLevel(LogLevel.Info, this.parameters);
    }
    
    private async collect(): Promise<CollectionResult> {

        let isCollected = false;
        let zipFilename = tmp.tmpNameSync({postfix: '.zip'});
        const archive = new Archive(zipFilename);
        const source = <any>this.config.source as CollectorBase;
        

        const args: CollectorArguments = {
            archive: archive,
            config: this.config,
            options: this.config.sourceOptions,
            readmeLines: []
        };

        try {
            isCollected = await source.collect(args);
            if (args.readmeLines?.length > 0) {
                this.readmeLines = this.readmeLines.concat(args.readmeLines);
            }
        } catch (e) {
            archive.discard();
            throw e;
        }

        return { isCollected, zipFilename, archive }
    }

    async run(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {

            var start = new Date();

            try {

                const targetsAndCollectors = [
                    new FilesystemCollector(),
                    new MySqlCollector(),
                    new FileSystemTarget(),
                    new FireStoreTarget(),
                    new SynologyFilestationTarget()
                ];
                
                this.config = new DlidBackupConfiguration(targetsAndCollectors, this.parameters);
                logger.info('version is ', this.version);
                

            this.config.macros = new MacroStore();
            this.config.macros.add(new DateMacroFormatter());
            // this.config.macros.add(new DateMacroFormatter());


            // First - parse parameters
                await this.config.parseParameters();


            // console.log(yaml.stringify({
            //     'source': {
            //         'type': this.config.source.name,
            //         'options': this.config.sourceOptions
            //     },
            //     'target': {
            //         'type': this.config.target.name,
            //         'options': this.config.targetOptions
            //     }
            // }));
           

          //  throw "x";

            
            if (this.config.action.indexOf('help') === 0) {

                this.help(this.config.action.replace(/^help\s?/, ''));

                return;
            }

            let collectionResult: CollectionResult;


                collectionResult = await this.collect();


            if (!collectionResult.isCollected) {
                logger.warn('No backup data was collected');
                await collectionResult.archive.discard();

                return resolve();
            }

                const readme: string[] = [];
 
                readme.push(`DLID-BACKUP SUMMARY`);
                readme.push(`========================`);
                readme.push(`Thank you for using dlid-backup - http://github.com/dlid/dlid-backup/`);
                readme.push(`Version: ${this.version}`);
                readme.push(`Backup Started: ${getUtcNowString(start)}`);
                readme.push(`Archive Created: ${getUtcNowString(new Date())}`);
                readme.push(`Collector: ${this.config.source.name}`);
                readme.push(`Target: ${this.config.target.name}`);
                readme.push(`OS Type: ${os.type()}`);
                readme.push('');
    
                this.readmeLines = readme.concat(this.readmeLines);
    
                // Add readme to zip file
                collectionResult.archive.addString('dlid-backup.txt', this.readmeLines.join('\n'));
                logger.debug('Adding dlid-backup.txt to zip file');
    
                await collectionResult.archive.save();
 
                const target = <any>this.config.target as TargetBase;
                
                const args: TargetArguments = {
                    archiveFilename: collectionResult.zipFilename,
                    config: this.config,
                    options: this.config.targetOptions
                };
                
                try {
                await target.run(args)
                } catch(e) {
                    return reject(e);
                }

                this.deleteCollectedFile(collectionResult.zipFilename);


            } catch(e) {
                reject(e);
            }

            resolve(true);
        });
    }

    private deleteCollectedFile(filename: string) {
        try {
            if (fs.existsSync(filename)) {
                logger.debug('Deleting ', filename);
                fs.unlinkSync(filename);
            }
        } catch(e) {
            logger.debug('Error deleting ', filename);
        }

    }

    private help(topic: string = null) {

            if (topic === 'macros') {

                console.log();
                console.log("MacroStrings can be used to dynamically name files and folders");
                console.log();
                    
                const d = this.config.macros.format("weekly/{date:yyyy}/{date:yyyy'W'II}");
                const daily = this.config.macros.format("monthly/{date:yyyy}/{date:yyyy-MM}");

                console.log(`-t.folder="weekly/{date:yyyy}/{date:yyyy'W'II}"    -   Save weekly backup in weekly folder "${d}"`);
                console.log(`-t.folder="monthly/{date:yyyy}/{date:yyyy-MM}"    -   Save monthly backup "${daily}"`);
                console.log();

                console.log("{date:<pattern>} - See https://date-fns.org/v2.14.0/docs/format for valid patterns");
                // console.log("{env:<name>}     - Environment variable value");
                return;
            }

        
        console.log(`
        dlid-backup will zip \x1b[32msource\x1b[0m data
            and save that data in \x1b[36mtarget\x1b[0m.`);
            
            console.log(`Usage
            
dlid-backup [run|explain]
\x1b[32m-s:\x1b[0m<type> \x1b[32m--source:\x1b[0m<type>               The Source to make a backup of
\x1b[32m-s.\x1b[0m<option>=val \x1b[32m--source\x1b[0m.<option>=val   Set an option for the source
-t:<type> --target:<type>               The target - where to save the backup
-t.<option>=val --target.<option>=val   Set an option for the target
                    
                    Sources
                    `);
                    
                    var collectors = this.config.configurables.filter(cfg => cfg instanceof CollectorBase);
                    var targets = this.config.configurables.filter(cfg => cfg instanceof TargetBase);
                    
                    
                    collectors.forEach(collector => {
                        const c = <any>collector as CollectorBase;
                        console.log(`\x1b[32m-s:${collector.name}\x1b[0m - ${c.description}`);
                        
                        var maxKeyLen = collector.getOptions().reduce((v, va) => {
                            var l = `  -s.${va.key}=<${typeToString(va.type)}>`.length;
                            return l > v ? l : v;
                        }, 0) + 4;
                        
                        collector.getOptions().forEach(opt => {
                            var protot = `  -s.${opt.key}=<${typeToString(opt.type)}>`;
                            var padded = protot.padEnd(maxKeyLen, ' ');
                            var required =  opt.isRequired === true ? '[required]' : '';
                            
                            console.log(`${padded} - ${required}${opt.description}`);
                        });
                         
                        console.log("\n"); 
                    });
                    
                    console.log('Targets\n');
                    targets.forEach(collector => {
                        const c = <any>collector as TargetBase;
                        console.log(`\x1b[36m-t:${collector.name}\x1b[0m - ${c.description}`);
                        
                        var maxKeyLen = collector.getOptions().reduce((v, va) => {
                            var l = `  -t.${va.key}=<${typeToString(va.type)}>`.length;
                            return l > v ? l : v;
                        }, 0) + 4;
                        
                        collector.getOptions().forEach(opt => {
                            var protot = `  \x1b[36m-t\x1b[0m.${opt.key}=<${typeToString(opt.type)}>`;
                            var padded = protot.padEnd(maxKeyLen, ' ');
                            var required =  opt.isRequired === true ? '[required]' : '';
                            
                            console.log(`${padded} - ${required}${opt.description}`);
                        });
                        
                        console.log("\n");
                    })
                    
                    
                }
                
                
            }