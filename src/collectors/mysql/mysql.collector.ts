import { DateManager } from './../../lib/dateManager/DateManager';
import { autoInjectable, inject } from 'tsyringe';
import { format } from 'date-fns';
import { FileManager } from './../../lib/fileManager/FileManager';
import { TableManager } from './../../lib/tableManager/TableManager';
import { SourceResultInterface } from './../../lib/sourceManager/SourceResultInterface';
import { CollectorBase } from "../../types/CollectorBase.type";
import { CollectorError, ParameterException } from "../../exceptions/collector.error";
import {logger, Logger} from './../../util/logger'
import { CollectorArguments } from "../../types/CollectorArguments.interface";
import { UserOptionInterface, UserOptionType, ParsedCommand, TableManagerInterface } from "../../lib";
import { isSimpleMatch, extractZipFolderName } from '../../util';
import { FileManagerInterface } from 'lib/fileManager';
import { IDateManager } from 'lib/dateManager/IDateManager';
import { config } from 'chai';
import { match } from 'assert';


const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

export interface MysqlSourceOptions {
    host: string;
    port: number;
    mysqlPath?: string;
    username?: string;
    password?: string;
    include?: string[];
    exclude?: string[];
    zipFolder?: string;
}

interface DatabaseToDump {
    name: string;
    zipFolder: string;
}

@autoInjectable()
export class MySqlCollector extends CollectorBase<MysqlSourceOptions> {
    name: string = 'mysql';
    description: string = 'Backup MySQL Database dumps';
    sensitiveValues = {};

    private optionsx;
    private log: Logger;

    constructor(
        @inject("TableManagerInterface") private tableManager: TableManagerInterface,
        @inject("FileManagerInterface") private fileManager: FileManagerInterface,
        @inject("IDateManager") private dateManager: IDateManager,
        ) {
        super();
        this.log = logger.child('MySqlSource');
    }

    /**
     * After command line argument is parsed as a MySQL source it will be passed into this function
     * Here we can adjust or set new values before they are parsed and validated
     * 
     * In this case, we support writing --source mysql localhost:1605 include_db1 include_db2 
     * instead of --source mysql --source.host=localhost --source.port=1605 --source.include include_db1 include_Db2
     */
    prepareParsedCommand(command: ParsedCommand): void {
        if (command.parameters?.length > 0) {
            if (command.parameters[0] === 'mysql') {
                if( command.parameters.length > 1) {
                    this.log.debug(`Parsing command parameters`, JSON.stringify(command.parameters.slice(1)));
                    const p = this.parseHostParameter(command.parameters[1]);

                    if (p.host) {
                        const hasHost = command.options.find(o => o.key === 'host');
                        this.log.debug(`Adding host value`, p.host);
                        if (!hasHost) {
                            command.options.push({key: 'host', values: [p.host] });
                        } else {
                            hasHost.values.push(p.host);
                        }
                    }

                    if (p.port) {
                        this.log.debug(`Adding port value`, p.port);
                        const hasPort = command.options.find(o => o.key === 'port');
                        if (!hasPort) {
                            command.options.push({key: 'port', values: [p.port] });
                        } else {
                            hasPort.values.push(p.port);
                        }
                    }

                    if (p.username) {
                        this.log.debug(`Adding username value`, p.username);
                        const hasPort = command.options.find(o => o.key === 'username');
                        if (!hasPort) {
                            command.options.push({key: 'username', values: [p.username] });
                        } else {
                            hasPort.values.push(p.username);
                        }
                    }

                    if (p.password) {
                        this.log.debug(`Adding password value`, '****');
                        const hasPort = command.options.find(o => o.key === 'password');
                        if (!hasPort) {
                            command.options.push({key: 'password', values: [p.password] });
                        } else {
                            hasPort.values.push(p.password);
                        }
                    }
                }
                if (command.parameters.length > 2) {
                    const hasPort = command.options.find(o => o.key === 'include');
                    this.log.debug(`Adding include value(s)`, command.parameters.slice(2));
                    if (!hasPort) {
                        command.options.push({key: 'include', values: command.parameters.slice(2) });
                    } else {
                        command.parameters.slice(2).forEach(v => hasPort.values.push(v));
                    }
                }
            }
        }
    }

    private parseHostParameter(value: string): { port?: string, host?: string, username?: string, password?: string } {
        let port: string;
        let host: string;
        let username: string;
        let password: string;

        host = value;

        const m = value.match(/\:(\d+)$/);
        if (m) {
            port = m[1];
            value = value.substr(0, m.index);
        }

        if (value.indexOf('@') !== -1) {
            const parts = value.split('@');
            const credentials = parts[0].split(':');
            username = credentials[0];
            if (credentials.length == 2) {
                password = credentials[1];
            }
            host = parts[1];
        }

        return { port, host, username, password };
    }

    private config: MysqlSourceOptions;


    private filterDatabases(databaseList: string[]): DatabaseToDump[] {
        const result: DatabaseToDump[] = [];
        for (let i=0; i < databaseList.length; i++) {
            const db = this.testShouldDumpDatabase(databaseList[i]);
            if (db) {
                result.push(db);
            }
        }
        return result;

        //return databaseList.filter(dbName => this.testShouldDumpDatabase(dbName));
    }

    async collect(config: MysqlSourceOptions, args: CollectorArguments): Promise<SourceResultInterface> {
        const result: SourceResultInterface = { };
        this.config = config;
         return new Promise(async (resolve, reject) => {
             
            let databaseNameList: string[];
            result.readmeLines = [];

            try {

                this.log.debug('Listing databases');
                databaseNameList = await this.mysql('SHOW DATABASES') as string[];
                let databaseList = this.filterDatabases(databaseNameList);
                this.log.debug(`Databases to dump: (${databaseList.length}) ${JSON.stringify(databaseList)}`);

                if (databaseList.length > 0) {
                    for (let i=0; i < databaseList.length; i++) {
                        const dump = await this.dumpDatabase(databaseList[i].name);
                        const dbFilename = `${databaseList[i].name}_${this.dateManager.formatUtcNow("yyyyMMddHHmmss")}.sql`;
                        result.readmeLines.push(`${databaseList[i].name} -> ${dbFilename}`);
                        args.archive.addString(dbFilename, dump, databaseList[i].zipFolder);
                        this.log.info(`Database "${this.tableManager.fgGreen(databaseList[i].name)}" (${this.fileManager.bytesToSize(dump.length)}) was added to archive folder "${databaseList[i].zipFolder || '/'}"`);
                    }
                }

                resolve(result);

            } catch(e) {
                reject(e);
            }

        });

        return Promise.resolve(result);


        // this.log.debug('Entering MySQL Collector');
        // return new Promise<boolean>(async (resolve, reject) => {
        //     this.optionsx = args.options;
        //     let databaseList: string[];
        //     let databasesBackedUp = 0;

        //     this.log.debug('Listing databases');
        //     try {
        //         databaseList = await this.mysql('SHOW DATABASES') as string[];
        //     } catch(e) {
        //         this.log.debug('Error listing databases');
        //         reject(e);
        //         return;
        //     }

        //     this.log.debug('Databases', databaseList);

        //     if (databaseList) {
        //         for(var i = 0; i < databaseList.length; i++) {
        //             try {
        //                 if (this.testShouldDumpDatabase(databaseList[i])) {
        //                     const dump = await this.dumpDatabase(databaseList[i]);
        //                     const dbFilename = `${databaseList[i]}.sql`;
        //                     args.archive.addString(dbFilename, dump);
        //                     this.log.info(`Collected ${dbFilename} MySQL dump`);
        //                     args.readmeLines.push(`Added MySQL Dump of "${dbFilename}"`);
        //                     databasesBackedUp += 1;
        //                 } else {
        //                     args.readmeLines.push(`Skipping database "${databaseList[i]}"`);
        //                     this.log.debug(`Skipping database ${databaseList[i]}`);
        //                 }
        //             } catch (e) {
        //                 return reject(e);
        //             }
        //         }
        //     }

        //     resolve(databasesBackedUp > 0);
        // });
    }

  
    
    dumpDatabase(name): Promise<string> {
        return new Promise((resolve, reject) => {
            const { command, args } = this.cmd('mysqldump', `--databases`, name)
            this.execute(command, args ).then(sql => {
                resolve(sql);
            });
        });
    }

    execute(process: string, args: string[]): Promise<string> {
        const self = this;
        return new Promise((resolve, reject) => {
            
            let arr = args.join(' ');
            let error = '';
            let readableCommand = process + ' ' + arr;
            let processError;

            Object.keys(this.sensitiveValues).forEach(sv => {
                readableCommand = readableCommand.replace(sv, this.sensitiveValues[sv]);
            })
            
            self.log.trace(`Spawing child process ${readableCommand}`);

            var child = spawn(process, args);
            let content = '';
            self.log.trace(`[Process ${child.pid}] Child Process created`);

            child.stdout.on('data', function (data) {
                content += data.toString();
            });
            child.stderr.on('data', function (data) {
                if (error || data.toString().indexOf('ERROR ') !== -1) {
                    if (!error) {
                        self.log.debug(`[Process ${child.pid}] Error detected in process output`);
                    }
                    error += data.toString();
                }
            });
            child.on('error', function(d) {
                processError = d;
            })
            

            child.on('close', function (code) {

                self.log.trace(`[Process ${child.pid}] Exited with code ${code}`);

                if (processError) {
                    return reject(new CollectorError(self.name, 'Error executing child process', readableCommand));
                }

                self.log.trace(`[Process ${child.pid}] Output Length: ${content.length} characters`);
                if (error) {
                    reject(new CollectorError(self.name, `MySQL command failed `, readableCommand + '\n' + error));
                } else {
                    resolve(content);
                }
            });

        })
    }


    private async mysql(sql: string) {
        this.log.trace(`Executing MySQL SQL: ${this.tableManager.fgCyan(sql)}`)
        return new Promise((resolve, reject) => {
            const { command, args } = this.cmd('mysql', '-e', sql, '-N')
            this.execute(command, args).then(result => {
                resolve(this.linesplit(result).filter(r => r));
            }).catch(err => {
                this.log.trace(`Error executing SQL command ${sql}`)
                reject(err);
            });

        });
    }

    linesplit(string) {

        var character = '\r\n';
        if (string.indexOf(character) === -1) {
            if (string.indexOf('\n') !== -1) {
                character = '\n';
            } else if (string.indexOf('\r') !== -1) {
                character = '\r';
            }
        }
        return string.split(character);
    }

    private mysqldump() {}


    cmd(name, ...params: string[]) {
        let command = "";
        let args = [];
        
        if (this.config.username) {
            args.push(`-u`);
            args.push(this.config.username);
        }
        if (this.config.password) {
            const passwordParameter = `-p` +  this.config.password.replace(`\\!`, `!`);
            this.sensitiveValues[passwordParameter] = '-p***';
            args.push(passwordParameter);
        }

        args = args.concat(params);

        if (os.type() === 'Windows_NT') {
            let mysqlPath = this.config.mysqlPath;
            if (!this.config.mysqlPath) {
                const envPath =  process.env.path?.split(';');
                envPath.filter(path => path.includes('MySQL') && path.includes('bin')).forEach(path => {
                    if (!mysqlPath) {
                    const tmpPath = this.fileManager.join(path, `${name}.exe`);
                    if (this.fileManager.exists(tmpPath)) {
                      mysqlPath = path;
                    }
                   }
                });
            }

            if (!mysqlPath) {
                throw new ParameterException('mysql-path', null, `Could not find "${name}.exe" - on Windows you must specify -s.mysql-path or add Mysql bin folder to PATH Environment variable`, this.name, true);
            }

            command = this.fileManager.join(mysqlPath, name) + ".exe";
        } else {
            command = name;
        }

        return { command, args };
    }




    testShouldDumpDatabase(dbName: string): DatabaseToDump {
        let isIncluded = true;
        let matchingPattern: string;
        const include: string[] = this.config.include || [];
        const exclude: string[] = this.config.exclude || [];

        if (include?.length > 0) {
            isIncluded = false;
            const exactMatch = include.find(inc => extractZipFolderName(inc, null).value === dbName);
            if (exactMatch) {
                isIncluded = true;
                this.log.debug(`Included: ${dbName} (match for pattern ${exactMatch})`);
                matchingPattern = exactMatch;
            } else {
                const match = include.find( includePattern => isSimpleMatch(dbName, extractZipFolderName(includePattern, null).value));
                isIncluded = !!match;
                if (isIncluded) {
                    this.log.debug(`Included: ${dbName} (match for pattern ${match})`);
                    matchingPattern = match;
                } else {
                    this.log.debug(`Not included: ${dbName}`);
                }
            }
        }

        if (exclude?.length > 0) {
            const match = exclude.find( excludePattern => isSimpleMatch(dbName, excludePattern));
            if (match) {
                isIncluded = false;
                this.log.debug(`Excluded: ${dbName} (match for pattern ${match})`);
            }
        }

        if (isIncluded) {
            let info = extractZipFolderName(matchingPattern, null);
            let zipFolder = info.zipTargetFolder || this.config.zipFolder;
    
            if (info.zipTargetFolder && this.config.zipFolder) {
                if (info.zipTargetFolder.startsWith('/') || info.zipTargetFolder.startsWith('\\')) {
                    zipFolder = info.zipTargetFolder;
                } else {
                    zipFolder = this.config.zipFolder;
                    if (!zipFolder.endsWith('/') && !zipFolder.endsWith('\/') ) {
                        zipFolder += '/';
                    }
                    zipFolder += info.zipTargetFolder;
                }
            }

            return { name: dbName, zipFolder: zipFolder  }
        }

        return null;

    }


    explain(config: MysqlSourceOptions, args: CollectorArguments) {
        console.log("config", config);
        let dbNames = '';
        if (config.include?.length > 0) {
            dbNames = `database${config.include.length == 1 ? '' : 's'} ${config.include.map(x => `"${x}"`).join(', ')}`
        } else if (config.exclude?.length > 0) {
            dbNames = `all database(s) except ${config.exclude.map(x => `"${x}"`).join(', ')}`
        } else {
            dbNames = `all dabases`;

        }

        let user = "";
        if (config.username) {
            user = ` as user "${config.username}" (${config.password ? 'using password' : 'no password'})`;
        }
    

        console.log([
            `Dump ${dbNames} from ${config.host}:${config.port}${user}` + (config.zipFolder ? ' into zip folder "' + config.zipFolder + '"': '')
        ].join('\n'));
    }

    get options(): UserOptionInterface[] {
        return [
            {
                key: 'mysql-path',
                type: UserOptionType.FolderPath,
                isRequired: false,
                description: 'Path to Mysql Server bin folder (Windows only)'
            },
            {
                key: 'host',
                type: UserOptionType.String,
                isRequired: true,
                defaultValue: 'localhost',
                description: 'The hostname of the MySql server',
                prompt: 'MySQL Host name'
            },
            {
                key: 'port',
                type: UserOptionType.Int,
                isRequired: true,
                defaultValue: 3306,
                description: 'MySQL Server port number',
                prompt: 'MySQL Port'
            },
            {
                key: 'username',
                type: UserOptionType.String,
                defaultValue: 'root',
                description: 'MySQL user name',
                prompt: 'MySQL User'
            },
            {
                key: 'password',
                type: UserOptionType.String,
                isRequired: false,
                defaultValue: null,
                description: 'MySQL password',
                prompt: 'MySQL Password',
                isSensitive: true
            },
            {
                key: 'exclude',
                type: UserOptionType.StringArray,
                defaultValue: ['information_schema', 'mysql', 'sys', 'performance_schema'],
                description: 'Databases to exclude',
                prompt: 'Exclude databases'
            },
            {
                key: 'include',
                type: UserOptionType.StringArray,
                multi: true,
                defaultValue: null,
                allowZipTargetFolder: true,
                description: 'Databases to include (Use * as wildcard)',
                prompt: 'Include databases'
            },
            {
                key: 'zip-folder',
                type: UserOptionType.String,
                multi: false,
                defaultValue: null,
                description: 'Folder name in zip file',
                prompt: 'Target zip path'
            }
        ];
    }

}