import { TargetArguments } from "./types";
import { TargetBase } from "./types/TargetBase.type";
import { DlidBackupConfiguration } from "./configuration/dlid-backup-configuration.class";
import { typeToString, LogLevel } from "./util";
import tmp = require('tmp');
import { Archive } from "./archive/Archive";
const os = require('os');
import { CollectorBase } from './types/CollectorBase.type';
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
import { MySqlCollector } from "./collectors";
//import { FileSystemTarget, FireStoreTarget, SynologyFilestationTarget } from "./targets";
import { inject, autoInjectable } from "tsyringe";
import { ArgvManagerInterface, CommandManagerInterface, ArgvParameterArray, SourceManagerInterface, ParsedCommand, UserOptionManagerInterface, TargetManagerInterface, TableManagerInterface, UserOptionType } from "./lib";
import { rejects } from "assert";
import { ParameterException } from "./exceptions";


@autoInjectable()
 export class DlidBackup {
    
    private config: DlidBackupConfiguration;
    private readmeLines: string[] = [];
    private version = '%DLID-BACKUP-VERSION%'; // Replaced by script
    private parameters: ArgvParameterArray;
    private arvg: string[];
    
    constructor(
        @inject("ArgvManagerInterface") private argvManager: ArgvManagerInterface,
        @inject("CommandManagerInterface") private commandManager: CommandManagerInterface,
        @inject("SourceManagerInterface") private sourceManager: SourceManagerInterface,
        @inject("TargetManagerInterface") private targetManager: TargetManagerInterface,
        @inject("UserOptionManagerInterface") private userOptionManager: UserOptionManagerInterface,
        @inject("TableManagerInterface") private tableManager: TableManagerInterface,
    ) {
        this.arvg = logger.setLogLevel(LogLevel.Info, process.argv.slice(2));
    }
    
    private async collect(): Promise<CollectionResult> {

        let isCollected = false;
        let zipFilename = tmp.tmpNameSync({postfix: '.zip'});
        const archive = new Archive(zipFilename);
        const source = <any>this.config.source as CollectorBase<any>;
        

        const args: CollectorArguments = {
            archive: archive,
            readmeLines: []
        };

        try {

            logger.warn(`NOTE! SHOW THAT WE'RE WORKING IF COLLECTING TAKES LONG!`);

            // isCollected = await source.collect(args);
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

            try {

                 //1) First normalize parameters and parse them into "commands"
                this.parameters = this.argvManager.parseArguments(this.arvg);
                const action = this.arvg[0];
                const commands = this.commandManager.parseFromCommandLineParameters(this.parameters);
                const sources: {source: CollectorBase<any>, command: ParsedCommand, userOptions?: any}[] = [];
                const targets: {target: TargetBase<any>, command: ParsedCommand, userOptions?: any}[] = [];
 
                if (this.parameters.length === 0) {
                    console.log(`usage:\n  dlid-backup ` + this.tableManager.fgGreen('{command}') + ` ` + this.tableManager.fgMagenta("{source}") + ' [, '+ this.tableManager.fgMagenta("{source}") + ' ...] \x1b[34m{target}\x1b[0m [, \x1b[34m{target}\x1b[0m ...] [--' + this.tableManager.fgYellow('{loglevel}') + ']\n');
                    console.log("Data is collected by "+this.tableManager.fgMagenta("source") +"(s) zipped, and then sent to \x1b[34mtarget\x1b[0m(s)\n");

                    console.log(`\nLog levels:`);
                    console.log(this.tableManager.tabsToTable([
                        `${this.tableManager.fgYellow('  trace')} or ${this.tableManager.fgYellow('verbose')}, ${this.tableManager.fgYellow('debug')}, ${this.tableManager.fgYellow('info')}, ${this.tableManager.fgYellow('warn')}, ${this.tableManager.fgYellow('error')}\t-\tDefault is ${this.tableManager.fgYellow('info')}`,
                    ], 2));

                    console.log(`Commands:`);
                    console.log(this.tableManager.tabsToTable([
                        `${this.tableManager.fgGreen('  run')}\t-\tRun the backup with your specified options.`,
                        `${this.tableManager.fgGreen('  explain')}\t-\tExplains the options you have specified in a human readable format`,
                        `${this.tableManager.fgGreen('  help')}\t-\tLearn how to use dlid-backup`
                    ], 2));
      
                    console.log("Sources:")
                    console.log(this.tableManager.tabsToTable(this.sourceManager.getAll().map(o => {
                        return `${this.tableManager.fgMagenta(`  ${o.name}`)}\t-\t${o.description}`;
                    }), 2));

                    console.log("Targets:")
                    console.log(this.tableManager.tabsToTable(this.targetManager.getAll().map(o => {
                        return `${this.tableManager.fgBlue(`  ${o.name}`)}\t-\t${o.description}`;
                    }), 2));


                    console.log("Examples:")
                    console.log(`  dlid-backup ` + this.tableManager.fgGreen('run ') + this.tableManager.fgMagenta('-s mysql -s.host localhost -s.username root -s.password 123') + this.tableManager.fgBlue(` -t filesystem -t.folder E:\\backup -t.filename "db_backup_{date:yyyy-MM-dd}.zip"`));
                    console.log(`  dlid-backup run -s mysql root:123@localhost -t filesystem E:\\backup\\db_backup_{date:yyyy-MM-dd}.zip`);
                    console.log(`  dlid-backup run -s folder -s.folder E:\\data -t filesystem E:\\backup\\data_backup{date:yyyy-MM-dd'T'HHmmss}.zip`);


                }

                if (action === 'run' || action === 'explain') {

                    //2) Find 'source' commands and its corresponding CollectorBase 
                    commands.filter(f => f.commandLongName === 'source' || f.commandLongName === 'target').forEach(command => {
                        if (command.parameters?.length > 0) {
                            if (command.commandLongName === 'source') {
                                const s = this.sourceManager.getByName(command.parameters[0]);
                                if (s) {
                                    sources.push({source: s, command: command});
                                } else {
                                    throw new ParameterException('source', null, `Unknown Source type "${command.parameters[0]}"`);
                                }
                            } else if (command.commandLongName === 'target') {
                                const s = this.targetManager.getByName(command.parameters[0]);
                                if (s) {
                                    targets.push({target: s, command: command});
                                } else {
                                    throw new ParameterException('target', null, `Unknown Target type "${command.parameters[0]}"`);
                                }
                            }
                        }
                    })
    
                    //3) Parse and validate the options
                    sources.forEach(s => {
                        s.userOptions = this.userOptionManager.resolveFromParsedCommand(s.source.name, s.source.options, s.command);
                    });
    
                    targets.forEach(t => {
                        t.userOptions = this.userOptionManager.resolveFromParsedCommand(t.target.name, t.target.options, t.command);
                    });
    
    
                    let zipFilename = tmp.tmpNameSync({postfix: '.zip'});
                    const archive = new Archive(zipFilename);
    
                    // Create archive...
                    sources.forEach(async s => {
                        
                        if (action === 'run') {
    
                            await s.source.collect(s.userOptions, {
                                archive: archive,
                                readmeLines: []
                            });
                        } else if (action === 'explain') {
                            await s.source.explain(s.userOptions, {
                                archive: archive,
                                readmeLines: []
                            });
                        }
                    })
    
                    console.log("Saved", archive.filename);
                    await archive.save();
    
                    console.log(targets);
    
                }

            } catch(e) {
                return reject(e);
            }

        });






        return new Promise(async (resolve, reject) => {
console.log("HO");
            var start = new Date();

            try {

                const targetsAndCollectors = [
                   // new FilesystemCollector(),
                    // new MySqlCollector(),
                    // new FileSystemTarget(),
                    // new FireStoreTarget(),
                    // new SynologyFilestationTarget()
                ];
                
//            this.config = new DlidBackupConfiguration(targetsAndCollectors, this.parameters);
            logger.info('version is ', this.version);

                
//            this.config.macros = new MacroStore();
//            this.config.macros.add(new DateMacroFormatter());
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
 
                const target = <any>this.config.target as TargetBase<any>;
                
                const args: TargetArguments = {
                    archiveFilename: collectionResult.zipFilename,
                    config: this.config,
                    options: this.config.targetOptions
                };
                
                try {
                // await target.run(args)
                } catch(e) {
                    return reject(e);
                }

                // this.deleteCollectedFile(collectionResult.zipFilename);


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

//             if (topic === 'macros') {

//                 console.log();
//                 console.log("MacroStrings can be used to dynamically name files and folders");
//                 console.log();
                    
//                 const d = this.config.macros.format("weekly/{date:yyyy}/{date:yyyy'W'II}");
//                 const daily = this.config.macros.format("monthly/{date:yyyy}/{date:yyyy-MM}");

//                 console.log(`-t.folder="weekly/{date:yyyy}/{date:yyyy'W'II}"    -   Save weekly backup in weekly folder "${d}"`);
//                 console.log(`-t.folder="monthly/{date:yyyy}/{date:yyyy-MM}"    -   Save monthly backup "${daily}"`);
//                 console.log();

//                 console.log("{date:<pattern>} - See https://date-fns.org/v2.14.0/docs/format for valid patterns");
//                 // console.log("{env:<name>}     - Environment variable value");
//                 return;
//             }

        
//         console.log(`
//         dlid-backup will zip \x1b[32msource\x1b[0m data
//             and save that data in \x1b[36mtarget\x1b[0m.`);
            
//             console.log(`Usage
            
// dlid-backup [run|explain]
// \x1b[32m-s:\x1b[0m<type> \x1b[32m--source:\x1b[0m<type>               The Source to make a backup of
// \x1b[32m-s.\x1b[0m<option>=val \x1b[32m--source\x1b[0m.<option>=val   Set an option for the source
// -t:<type> --target:<type>               The target - where to save the backup
// -t.<option>=val --target.<option>=val   Set an option for the target
                    
//                     Sources
//                     `);
                    
//                     var collectors = this.config.configurables.filter(cfg => cfg instanceof CollectorBase);
//                     var targets = this.config.configurables.filter(cfg => cfg instanceof TargetBase);
                    
                    
//                     collectors.forEach(collector => {
//                         const c = <any>collector as CollectorBase;
//                         console.log(`\x1b[32m-s:${collector.name}\x1b[0m - ${c.description}`);
                        
//                         var maxKeyLen = collector.getOptions().reduce((v, va) => {
//                             var l = `  -s.${va.key}=<${typeToString(va.type)}>`.length;
//                             return l > v ? l : v;
//                         }, 0) + 4;
                        
//                         collector.getOptions().forEach(opt => {
//                             var protot = `  -s.${opt.key}=<${typeToString(opt.type)}>`;
//                             var padded = protot.padEnd(maxKeyLen, ' ');
//                             var required =  opt.isRequired === true ? '[required]' : '';
                            
//                             console.log(`${padded} - ${required}${opt.description}`);
//                         });
                         
//                         console.log("\n"); 
//                     });
                    
//                     console.log('Targets\n');
//                     targets.forEach(collector => {
//                         const c = <any>collector as TargetBase;
//                         console.log(`\x1b[36m-t:${collector.name}\x1b[0m - ${c.description}`);
                        
//                         var maxKeyLen = collector.getOptions().reduce((v, va) => {
//                             var l = `  -t.${va.key}=<${typeToString(va.type)}>`.length;
//                             return l > v ? l : v;
//                         }, 0) + 4;
                        
//                         collector.getOptions().forEach(opt => {
//                             var protot = `  \x1b[36m-t\x1b[0m.${opt.key}=<${typeToString(opt.type)}>`;
//                             var padded = protot.padEnd(maxKeyLen, ' ');
//                             var required =  opt.isRequired === true ? '[required]' : '';
                            
//                             console.log(`${padded} - ${required}${opt.description}`);
//                         });
                        
//                         console.log("\n");
//                     })
                    
                    
//                 }
    }
                
            }