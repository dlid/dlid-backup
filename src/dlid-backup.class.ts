import { SourceResultInterface } from './lib/sourceManager/SourceResultInterface';
import { TargetBase } from "./types/TargetBase.type";
import {  LogLevel, Logger } from "./util"; 
import tmp = require('tmp');
import { Archive } from "./archive/Archive";
const os = require('os');
import { CollectorBase } from './types/CollectorBase.type';
import { CollectionResult } from "./types/CollectionResult.type";
import { logger } from './util';
import { getUtcNowString } from "./util/getUtcNowString.function";
import fs = require('fs');
import { inject, autoInjectable } from "tsyringe";
import { ArgvManagerInterface, CommandManagerInterface, ArgvParameterArray, SourceManagerInterface, ParsedCommand, UserOptionManagerInterface, TargetManagerInterface, TableManagerInterface, UserOptionType, JobManagerInterface, IHelpManager } from "./lib";
import { ParameterException } from "./exceptions";


@autoInjectable()
 export class DlidBackup {
    
    private readmeLines: string[] = [];
    private version = '%DLID-BACKUP-VERSION%'; // Replaced by script
    private parameters: ArgvParameterArray;
    private arvg: string[];
    private log: Logger;
    
    constructor(
        @inject("ArgvManagerInterface") private argvManager: ArgvManagerInterface,
        @inject("CommandManagerInterface") private commandManager: CommandManagerInterface,
        @inject("SourceManagerInterface") private sourceManager: SourceManagerInterface,
        @inject("TargetManagerInterface") private targetManager: TargetManagerInterface,
        @inject("UserOptionManagerInterface") private userOptionManager: UserOptionManagerInterface,
        @inject("TableManagerInterface") private tableManager: TableManagerInterface,
        @inject("JobManagerInterface") private jobManager: JobManagerInterface,
        @inject("IHelpManager") private helpManager: IHelpManager
    ) { 
        this.log = logger.child('DlidBackup');
        this.arvg = logger.setLogLevel(LogLevel.Info, process.argv.slice(2));
    }
    
    async run(): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            this.commandManager.setCommands(
                {longName: 'help', shortName: 'h', name: 'Help'},
                {longName: 'source', shortName: 's', name: 'Source'},
                {longName: 'target', shortName: 't', name: 'Target'}
            );

            try {

                 //1) First normalize parameters and parse them into "commands"
                this.parameters = this.argvManager.parseArguments(this.arvg);
                const action = this.arvg[0];
                this.log.debug(`Detected action: "${action}"`);
                this.log.debug(`Parsing command line arguments`);
                const commands = this.commandManager.parseFromCommandLineParameters(this.parameters);
                const sources: {source: CollectorBase<any>, command: ParsedCommand, userOptions?: any}[] = [];
                const targets: {target: TargetBase<any>, command: ParsedCommand, userOptions?: any}[] = [];

                if (commands.length === 0 && (action === "help" || !action)) {

                    this.helpManager.showHelp(this.parameters);
                    resolve();
                    return;
                }

                if (action === 'run' || action === 'explain' || 'params') {

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
                    });

                    //3) Parse and validate the options
                    sources.forEach(s => {
                        s.userOptions = this.userOptionManager.resolveFromParsedCommand(s.source.name, s.source.options, s.command);
                    });
    
                    targets.forEach(t => {
                        t.userOptions = this.userOptionManager.resolveFromParsedCommand(t.target.name, t.target.options, t.command);
                    });

                    if (action === 'run') {
                        if (!commands.find(c => c.commandLongName === 'source' && c.parameters?.length > 0)) {
                            throw new ParameterException('--source', null, 'You must specify at least one source. Write ' + this.tableManager.fgGreen('dlid-backup help source') + ' for help');
                        }


                        if (!commands.find(c => c.commandLongName === 'target' && c.parameters?.length > 0)) {
                            throw new ParameterException('--target', null, 'You must specify at least one target. Write ' + this.tableManager.fgGreen('dlid-backup help target') + ' for help');
                        }
                    } else if (action === 'params') {
                        if (sources.length === 0 && targets.length === 0) {
                            throw new ParameterException('--target, --source', null, 'You must specify at least one target or source when exporting parameters');
                        }
                    }
    
                    let zipFilename = tmp.tmpNameSync({postfix: '.zip'});
                    const archive = new Archive(zipFilename);
    
                    // Create archive...

                    if (action === 'params') {
                        const data = [];

                        const padlen = 16;
                        data.push(`# Parameter file exported by dlid-backup`);
                        data.push(`# Include at any time by passing file:///<path> as parameter`);
                        data.push(`# Empty lines or lines starting with # are ignored`);

                        commands.forEach(cmd => {
                            
                            if (data.length > 0) {data.push('');}
                            data.push(`--${cmd.commandLongName}`);
                            cmd.parameters?.forEach(p => data.push(p));

                            cmd.options.forEach(opt => {
                                data.push('');
                                data.push(`--${cmd.commandLongName}.${opt.key}`);
                                opt.values?.forEach(val => {
                                    data.push(val);
                                })
                            });
                        })

                        console.log(data.join("\n"));

                        //console.log(yaml.stringify(data));
                        //console.log(JSON.stringify(data, null, 2));
                    } else {

                        for (let ix = 0; ix < sources.length; ix++) {
                            let s = sources[ix];
                            if (action === 'run') {
        
                                const r = await this.jobManager.startJob<SourceResultInterface>(async () => this.sourceManager.runSource(s.source, s.userOptions, archive), { jobName: `${sources.length > 1 ? `Source ${ix + 1}/${sources.length}: ` : ''}${s.source.name} Data collection` });
                                
                                console.log("resultat", r);

                            } else if (action === 'explain') {
                                await s.source.explain(s.userOptions, {
                                    archive: archive
                                });
                            }
                        }
        console.log("isini", archive.isInitialized);
                        if (archive.isInitialized) {

                            await archive.save();

                            for (let ix = 0; ix < targets.length; ix++) {
                                let t = targets[ix];
                                if (action === 'run') {
            
                                    const r = await this.jobManager.startJob<SourceResultInterface>(async () => this.targetManager.runTarget(t.target, t.userOptions, archive), { jobName: `${sources.length > 1 ? `Send To Target ${ix + 1}/${sources.length}: ` : ''}${t.target.name}` });
                                    
                                } else if (action === 'explain') {
                                    // await t.target.explain(s.userOptions, {
                                    //     archive: archive
                                    // });
                                }
                            }

                            
                        } else {
                            this.log.info(`No data was collected`);
                        }

                    }
    
    
                }

            } catch(e) {
                return reject(e);
            }

        });
    }
}
