import { FileManagerInterface } from './../../lib/fileManager/FileManagerInterface';
import { CollectorBase } from "../../types/CollectorBase.type";
import { logger, Logger} from './../../util/logger'
import { CollectorArguments } from "../../types/CollectorArguments.interface";
import { UserOptionInterface, UserOptionType, ParsedCommand, UserOptionManagerInterface } from "../../lib";
import { inject, autoInjectable } from "tsyringe";
import { extractZipFolderName } from '../../util';
import { SourceResultInterface } from 'lib/sourceManager/SourceResultInterface';
import { basename } from 'path';

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

    constructor(
        @inject("UserOptionManagerInterface") private userOptionsManager: UserOptionManagerInterface,
        @inject("FileManagerInterface") private fileManager: FileManagerInterface,
        ) {
        super();
        this.log = logger.child('Glob Collector');
    }

    /**
     * After command line argument is parsed as a source it will be passed into this function
     * Here we can adjust or set new values before they are parsed and validated
     * 
     * In this case, we support writing --source glob /etc/what/*.txt /etc/what/*.js
     * instead of --source glob -s.pattern /etc/what/*.txt /etc/what/*.js
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


    async collect(config: GlobSourceOptions, args: CollectorArguments): Promise<SourceResultInterface> {
        const result: SourceResultInterface = { readmeLines: []  };

        this.log.debug('Entering Glob Collector');
        return new Promise(async (resolve, reject) => {

            for (let i=0; i < config.pattern?.length; i++) {
                const pattern = config.pattern[i];
                const info = extractZipFolderName(pattern, '');
                
                // console.log("INFO", JSON.stringify(info));

                const files = await this.fileManager.glob(info.value);

                const basePath = this.findBasePath(files);
                let baseName = this.fileManager.getBasename(basePath);
                if (basePath) {
                    if (!baseName) {
                        baseName = basePath.replace(/[:\/]/g, '');
                    }
                }

                baseName = baseName?.replace(/[\/\\]/g, '');

                // console.log("===================")

                // console.log("FILES", files);
                // console.log("BASEPATH", basePath);
                // console.log("baseName", baseName);

                // console.log("");

                files.forEach(f => {
                    let targetFolder = info.zipTargetFolder ? info.zipTargetFolder : baseName;
                    if (!targetFolder?.startsWith('\\')) { targetFolder = `\\${targetFolder}`; }

                    args.archive.addLocalFile( f,  this.fileManager.join(targetFolder, f.replace(basePath, '') ));
                });
                result.readmeLines.push(`Glob: ${files.length} file(s) added from pattern ${info.value}`);
            }

            resolve(result);
        });
    }
    
    private findBasePath(paths: string[]) {

      //  console.log("PATHS", paths);

        let p2 = paths.map(p => this.fileManager.getDirectoryName(p));

        let basePath = p2[0].replace(/\\/g, '/');

        let shortestPathLen = p2.reduce((previousValue, path) => previousValue == -1 || path.length < previousValue ? path.length : previousValue, -1);

        for (let i = shortestPathLen; i >= 0; i--) {
            const part = p2[0].substr(0, i);
            const startsWithPath = p2.filter(p => p.startsWith(part)).length;
            if (startsWithPath === p2.length) {
                basePath = part;
                break;
            }
        }


        //  do {
        //     const startsWithBasePath = p2.filter(p => p.startsWith(basePath)).length;

        //     if (startsWithBasePath !== p2.length) {
        //         if (basePath.includes('/')) {
        //             basePath = basePath.substring(0, basePath.lastIndexOf('/'));
        //         } else {
        //             basePath = '';
        //         }
        //     } else {
        //         break;
        //     }
        // } while (basePath.length > 0);
       
        return basePath;
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