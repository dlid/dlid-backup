import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { CollectorBase } from "../../types/CollectorBase.type";

export class MySqlCollector extends CollectorBase implements Configurable {
    name: string = 'mysql';
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
                key: 'exclude',
                type: ConfigurableSettingType.StringArray,
                defaultValue: null,
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