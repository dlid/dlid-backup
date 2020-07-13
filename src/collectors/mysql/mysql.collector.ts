import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { CollectorBase } from "../../types/CollectorBase.type";
import { Archive } from "../../archive/Archive";
import { CollectorError, ParameterException } from "../../exceptions/collector.error";
import {logger, Logger} from './../../util/logger'
import fs = require("fs");
import { CollectorArguments } from "../../types/CollectorArguments.interface";


// import { pathMatch } from "tough-cookie";
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

export class MySqlCollector extends CollectorBase implements Configurable {
    name: string = 'mysql';
    description: string = 'Backup MySQL Database dumps';
    sensitiveValues = {};

    private options;
    private log: Logger;

    constructor() {
        super();
        this.log = logger.child('MySQL Collector');
    }

    async collect(args: CollectorArguments): Promise<any> {
        this.log.debug('Entering MySQL Collector');
        return new Promise<boolean>(async (resolve, reject) => {
            this.options = args.options;
            let databaseList: string[];
            let databasesBackedUp = 0;

            this.log.debug('Listing databases');
            try {
                databaseList = await this.mysql('SHOW DATABASES') as string[];
            } catch(e) {
                this.log.debug('Error listing databases');
                reject(e);
                return;
            }

            this.log.debug('Databases', databaseList);

            if (databaseList) {
                for(var i = 0; i < databaseList.length; i++) {
                    try {
                        if (this.testShouldDumpDatabase(databaseList[i])) {
                            const dump = await this.dumpDatabase(databaseList[i]);
                            const dbFilename = `${databaseList[i]}.sql`;
                            args.archive.addString(dbFilename, dump);
                            this.log.info(`Collected ${dbFilename} MySQL dump`);
                            args.readmeLines.push(`Added MySQL Dump of "${dbFilename}"`);
                            databasesBackedUp += 1;
                        } else {
                            args.readmeLines.push(`Skipping database "${databaseList[i]}"`);
                            this.log.debug(`Skipping database ${databaseList[i]}`);
                        }
                    } catch (e) {
                        return reject(e);
                    }
                }
            }

            resolve(databasesBackedUp > 0);
        });
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
        this.log.trace(`Executing MySQL SQL: ${sql}`)
        return new Promise((resolve, reject) => {
            const { command, args } = this.cmd('mysql', '-e', sql, '-N')
            this.execute(command, args).then(result => {
                this.log.trace(`SQL Command returned: ${result}`)
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
        
        if (this.options['username']) {
            args.push(`-u`);
            args.push(this.options['username']);
        }
        if (this.options['password']) {
            const passwordParameter = `-p` +  this.options['password'].replace(`\\!`, `!`);
            this.sensitiveValues[passwordParameter] = '-p***';
            args.push(passwordParameter);
        }

        args = args.concat(params);

        if (os.type() === 'Windows_NT') {
            if (typeof this.options['mysql-path'] === 'undefined') {
                throw new ParameterException('mysql-path', null, `On Windows you must specify -s.mysql-path`, this.name, true);
            }
            if (!fs.existsSync(this.options['mysql-path'])) { 
                throw new CollectorError(this.name, `The specified mysql-path does not exist: ${this.options['mysql-path']}`);
            }
            command = path.join((this.options['mysql-path'] ? this.options['mysql-path'] : ''), name) + ".exe";
        } else {
            command = name;
        }

        return { command, args };
    }



    testShouldDumpDatabase(dbName: string): boolean {
        let isIncluded = true;
        const include: string[] = this.options['include'] || null;
        const exclude: string[] = this.options['exclude'] || null;

        if (include) {
            isIncluded = false;
            if (include.find(inc => inc === dbName)) {
                isIncluded = true;
            } else {
                include.forEach(f => {
                    if (f.endsWith('*')) {
                        if (dbName.startsWith(f.substr(0, f.length - 1))) {
                            this.log.debug(`Include match for "${f}"`, dbName);
                            isIncluded = true;
                        }
                    } else if (f.startsWith('*')) {
                        if (dbName.endsWith(f.substr(1))) {
                            this.log.debug(`Include match for "${f}"`, dbName);
                            isIncluded = true;
                        }
                    }
                })
            }
        }

        if ( exclude ) {
            if (exclude.find(inc => inc === dbName)) {
                isIncluded = false;
            }
        }

        return isIncluded;

    }


    explain(options: any): string[] {

        let dbNames = '';
        if (options['include']) {
            dbNames = `database(s) ${options['include'].join(', ')}`
        } else if (options['exclude']) {
            dbNames = `all database(s) except ${options['exclude'].join(', ')}`
        } else {
            dbNames = `all dabases`;
        }

        return [
            `Connect to MySQL server at ${options['host']}:${options['port']}`,
            options['mysql-path'] ? `Then, using binaries from ${options['mysql-path']}` : null,
            `Dump ${dbNames}`,
            options['include'] && options['exclude'] ? `Except for ${options['exclude'].join(', ')}` : null
        ].filter(m => m);
    }
    getOptions(): ConfigurableSetting[] {
        return [
            {
                key: 'mysql-path',
                type: ConfigurableSettingType.FolderPath,
                isRequired: false,
                description: 'Path to Mysql Server bin folder (Windows only)'
            },
            {
                key: 'host',
                type: ConfigurableSettingType.String,
                isRequired: true,
                description: 'The hostname of the MySql server',
                prompt: 'MySQL Host name'
            },
            {
                key: 'port',
                type: ConfigurableSettingType.Int,
                isRequired: true,
                defaultValue: 3306,
                description: 'MySQL Server port number',
                prompt: 'MySQL Port'
            },
            {
                key: 'username',
                type: ConfigurableSettingType.String,
                isRequired: false,
                defaultValue: null,
                description: 'MySQL user name',
                prompt: 'MySQL User'
            },
            {
                key: 'password',
                type: ConfigurableSettingType.String,
                isRequired: false,
                defaultValue: null,
                description: 'MySQL password',
                prompt: 'MySQL Password',
                isSensitive: true
            },
            {
                key: 'exclude',
                type: ConfigurableSettingType.StringArray,
                defaultValue: ['information_schema', 'mysql', 'sys', 'performance_schema'],
                description: 'Databases to exclude',
                prompt: 'Exclude databases'
            },
            {
                key: 'include',
                type: ConfigurableSettingType.StringArray,
                multi: true,
                defaultValue: null,
                description: 'Databases to include (Use * as wildcard)',
                prompt: 'Include databases'
            }
        ];
    }
}