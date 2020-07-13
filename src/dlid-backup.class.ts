import { Configurable } from "./types";
import { CollectorBase } from "./types/CollectorBase.type";
import { TargetBase } from "./types/TargetBase.type";
import { DlidBackupConfiguration } from "./configuration/dlid-backup-configuration.class";
import { typeToString } from "./util";
import tmp = require('tmp');
import { Archive } from "./archive/Archive";
const os = require('os');
import { CollectionResult } from "./types/CollectionResult.type";
import { logger } from './util';
import { CollectorArguments } from "./types/CollectorArguments.interface";
import { moveMessagePortToContext } from "worker_threads";
import {formatISO} from 'date-fns';
import { getUtcNowString } from "./util/getUtcNowString.function";


export class DlidBackup {
    
    private config: DlidBackupConfiguration;
    private readmeLines: string[] = [];
    
    constructor(private version: string, configurables: Configurable[], parameters: string[]) {
        this.config = new DlidBackupConfiguration(configurables, parameters);
        logger.info('version is ', this.version);
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
            
            // First - parse parameters
            try {
                await this.config.parseParameters();
            } catch (e) {
                return reject(e);
            }
            
            if (this.config.action.indexOf('help') === 0) {
                this.help(this.config.action.replace(/^help\s?/, ''));
                return;
            }

            let collectionResult: CollectionResult;

            try {
                // Execute Collector
                collectionResult = await this.collect();
            } catch (e) {
                return reject(e);
            }

            if (!collectionResult.isCollected) {
                logger.warn('No backup data was collected');
                await collectionResult.archive.discard();

                return resolve();
            }


            try {

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

                
            } catch (e) {
                return reject(e);
            }

            console.log("SEND THE FILE TO TARGET! " + collectionResult.zipFilename);


            // 
            
            
            resolve(true);
        });
    }
    
    private help(topic: string = null) {
        
        console.log(`
        dlid-backup will zip \x1b[32msource\x1b[0m data
            and save that data in \x1b[36mtarget\x1b[0m.`);
            
            console.log(`Usage
            
            dlid-backup [run|explain]
            \x1b[32m-s:\x1b[0m<type> \x1b[32m--source:\x1b[0m<type>               The Source to make a backup of
                \x1b[32m-s.\x1b[0m<option>=val \x1b[32m--source\x1b[0m.<option>=val   Set an option for the source
                    -t:<type> --target:<type>               The target - where to save the backup
                    -t.<option>=val --target.<option>=val   Set an option for the target
                    -o=filename.zip                         The filename of the resulting zip archive
                    
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