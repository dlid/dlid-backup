import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { CollectorBase } from "../../types/CollectorBase.type";
import { Archive } from "../../archive/Archive";
// import { pathMatch } from "tough-cookie";
const os = require('os');
const path = require('path');
const { exec, spawn } = require('child_process');

export class MySqlCollector extends CollectorBase implements Configurable {
    name: string = 'mysql';
 
    private options;

    async collect(archive: Archive, options: any): Promise<any> {
        this.options = options;

        const result = await this.mysql('SHOW DATABASES') as string[];

        for(var i = 0; i < result.length; i++) {
            if (this.testShouldDumpDatabase(result[i])) {
                const dump = await this.dumpDatabase(result[i]);
                archive.addString(`${result[i]}.sql`, dump);
            }
        }
            
    }




    dumpDatabase(name): Promise<string> {
        return new Promise((resolve, reject) => {
            const { command, args } = this.cmd('mysqldump', `--databases`, name)
            this.execute(command, args ).then(sql => {
                resolve(sql);
                //setTimeout(() => resolve(stdout), 1500);

            });
        });
    }

    execute(process: string, args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            
            let arr = args.join(' ');

            arr = arr.replace(/ -p.*?(\s|$)/, ' -p*** ');

            console.log(`\x1b[36mexecute\x1b[0m`, process, arr);

            var child = spawn(process, args);
            let content = '';

            child.stdout.on('data', function (data) {
                content += data.toString();
            });

            child.stderr.on('data', function (data) {

                if (data.toString().indexOf('ERROR ') !== -1) {
                    return reject(data.toString());
                } else {
                    // console.log("eeh", data.toString());
                }
                //reject(data.toString());
            });

            child.on('close', function (code) {
                resolve(content);
            });

        })
    }


    private async mysql(sql: string) {
        return new Promise((resolve, reject) => {
            const { command, args } = this.cmd('mysql', '-e', sql, '-N')

            this.execute(command, args).then(result => {
                resolve(this.linesplit(result).filter(r => r));

            }).catch(reject);

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
            args.push(`-p` +  this.options['password'].replace(`\\!`, `!`)) ;
        }

        args = args.concat(params);

        if (os.type() === 'Windows_NT') {
            command = path.join((this.options['mysql-path'] ? this.options['mysql-path'] : ''), name) + ".exe";
        } else {
            command = name;
        }
        
        return { command, args };
    }

    testShouldDumpDatabase(dbName: string): boolean {
        let isIncluded = false;
        const include: string[] = this.options['include'] || null;
        const exclude: string[] = this.options['exclude'] || null;

        if (include) {
            isIncluded = false;
            if (include.find(inc => inc === dbName)) {
                isIncluded = true;
            }
        }

        if (exclude) {
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
                prompt: 'MySQL Password'
            },
            {
                key: 'exclude',
                type: ConfigurableSettingType.StringArray,
                defaultValue: ['information_schema', 'mysql'],
                description: 'Databases to exclude',
                prompt: 'Exclude databases'
            },
            {
                key: 'include',
                type: ConfigurableSettingType.StringArray,
                defaultValue: null,
                description: 'Databases to include (Use * as wildcard)',
                prompt: 'Include databases'
            }
        ];
    }
}