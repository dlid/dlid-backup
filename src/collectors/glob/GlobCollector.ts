import { CollectorBase } from "../../types/CollectorBase.type";
import {logger, Logger} from './../../util/logger'
import { CollectorArguments } from "../../types/CollectorArguments.interface";
import { UserOptionInterface, UserOptionType, ParsedCommand, UserOptionManagerInterface } from "../../lib";
import { inject, autoInjectable } from "tsyringe";

export interface GlobSourceOptions {
    pattern: string[];
    exclude?: string[];
}
 
@autoInjectable()
export class GlobCollector extends CollectorBase<GlobSourceOptions> {
    name: string = 'glob';
    description: string = 'Backup files matching glob patterns';
    sensitiveValues = {};

    private optionsx;
    private log: Logger;

    constructor(@inject("UserOptionManagerInterface") private userOptionsManager: UserOptionManagerInterface) {
        super();
        this.log = logger.child('Glob Collector');
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
            if( command.parameters.length > 1) {
                command.parameters.slice(1).filter(f => f).forEach(f => {
                    this.userOptionsManager.addOptionValue(command, 'pattern', f);
                })
            }
        }
    }


    async collect(config: GlobSourceOptions, args: CollectorArguments): Promise<any> {

        this.log.debug('Entering Glob Collector');
        return new Promise<boolean>(async (resolve, reject) => {
            console.log(config);
            resolve(true);
        });
    }


    explain(config: GlobSourceOptions, args: CollectorArguments) {
        // ...
    }

    get options(): UserOptionInterface[] {
        return [
            {
                key: 'pattern',
                type: UserOptionType.StringArray,
                isRequired: true,
                description: 'Glob pattern(s) to backup',
                allowZipTargetFolder: true,
                zipTargetValueExample: './src/**/*.ts'
            }
        ];
    }

}