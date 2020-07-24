import { CollectorBase } from "../../types/CollectorBase.type";
import {logger, Logger} from './../../util/logger'
import { CollectorArguments } from "../../types/CollectorArguments.interface";
import { UserOptionInterface, UserOptionType, ParsedCommand, UserOptionManagerInterface } from "../../lib";
import { inject, autoInjectable } from "tsyringe";
import { ParameterException } from "../../exceptions";
import { extractZipFolderName } from "../../util";
const os = require('os');
const path = require('path');

export interface FolderSourceOptions {
    folder: string[];
}
 
@autoInjectable()
export class FolderCollector extends CollectorBase<FolderSourceOptions> {
    name: string = 'folder';
    description: string = 'Backup folder(s)';
    sensitiveValues = {};

    private optionsx;
    private log: Logger;

    constructor(@inject("UserOptionManagerInterface") private userOptionsManager: UserOptionManagerInterface) {
        super();
        this.log = logger.child('Folder Collector');
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
                    this.userOptionsManager.addOptionValue(command, 'folder', f);
                })
            }
        }
    }


    async collect(config: FolderSourceOptions, args: CollectorArguments): Promise<any> {

        this.log.debug('Entering Folder Collector');
        return new Promise<boolean>(async (resolve, reject) => {
            console.log(config);

            this.log.info(`Collecting local files`);

            if (config.folder.length === 0) {
                throw new ParameterException('-s.folder', null, 'Please specify folder to collect');
            }
    
            const zipFolders = {};
            let addedItems = 0;
            
            for (let i=0; i < config.folder.length; i++) {
                this.log.debug(`Collecting folder ${config.folder[i]}`);
                let { zipTargetFolder, value } = extractZipFolderName(config.folder[i], ``);
                console.log("target?", zipTargetFolder, value);
                const baseName = path.basename(value);
                if (!zipTargetFolder) {
                    zipTargetFolder = baseName || `folder_${i}`;
                }
                args.archive.addLocalFolder(value, zipTargetFolder);
                addedItems++;
                args.readmeLines.push(`Added folder ${value} to ${zipTargetFolder} in archive`);
                this.log.debug(`Added folder ${value} to ${zipTargetFolder} in archive`);
            }
    
            this.log.success('Data collection complete');
                    

            resolve(addedItems > 0);
        });
    }


    explain(config: FolderSourceOptions, args: CollectorArguments) {
        // ...
    }

    get options(): UserOptionInterface[] {
        return [
            {
                key: 'folder',
                type: UserOptionType.FolderPathArray,
                isRequired: true,
                description: 'Folders to backup',
                allowZipTargetFolder: true,
                zipTargetValueExample: os.type() === 'Windows_NT' ? 'E:\\MyFiles' : '/var/myfiles'
            }
        ];
    }

}