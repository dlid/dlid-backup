// import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
// import { TargetBase } from "../../types/TargetBase.type";
// import { TargetArguments } from "../../types";
// import * as fs from "fs";
// import path = require("path");
// import { TargetError } from "../../exceptions";
// import { Logger, logger } from "../../util";
// import { isSimpleMatch } from './../../util/isSimpleMatch.function'

import { TargetBase, TargetArguments } from "../../types";
import { UserOptionInterface, UserOptionType, ParsedCommand, UserOptionManagerInterface } from "../../lib";
import { pathToFileURL } from "url";
import { FileManagerInterface } from "../../lib/fileManager";
import { inject, autoInjectable } from "tsyringe";
import { Console } from "console";
export interface FileSystemTargetOptions {
     folder: string;
     filename: string;
     keep?: number;
     'keep-match'?: string;
} 
@autoInjectable()
export class FileSystemTarget extends TargetBase<FileSystemTargetOptions> {
    name: string = 'filesystem';
    description: string = 'Save backup to local filesystem';

    constructor(
        @inject("FileManagerInterface") private fileManager: FileManagerInterface,
        @inject("UserOptionManagerInterface") private userOptionsManager: UserOptionManagerInterface
    ) {
        super();
    }

    async run(config: FileSystemTargetOptions, args: TargetArguments): Promise<void> {
        
        return new Promise((reject, resolve) => {
                console.log("To target", config, args);

        }); 

    }

    public prepareParsedCommand(command: ParsedCommand): void {
        if (command.parameters.length > 1) {
            const fileInfo = this.fileManager.getFileParts(command.parameters[1]);
            if (fileInfo.filename !== '.') {
                if (!fileInfo.filename.endsWith('.zip')) {
                    fileInfo.filename += '.zip';
                }
                this.userOptionsManager.addOptionValue(command, 'folder', fileInfo.directory);
                this.userOptionsManager.addOptionValue(command, 'filename', fileInfo.filename);
            }
        }
    }

    public get options(): UserOptionInterface[] {
        return [
            {
                key: 'folder',
                type: UserOptionType.String,
                isRequired: true,
                description: 'Directory where to save backups'
            },
            {
                key: 'filename',
                type: UserOptionType.String,
                isRequired: true,
                description: 'Filename of the backup file'
            },
            {
                key: 'keep',
                type: UserOptionType.Int,
                isRequired: false,
                description: 'Number of maximum files to keep at the target location'
            },
            {
                key: 'keep-match',
                type: UserOptionType.String,
                isRequired: false,
                description: 'Only list files matching this pattern when deciding what to keep',
                examples: {
                    "-t.keep-match=prefix_*": "Includes files starting with prefix_",
                    "-t.keep-match=*_sufix": "Includes files ending with _sufix",
                }
            }
        ];
    }

} 


// export class FileSystemTarget extends TargetBase implements Configurable {
//     description: string = 'Save backup to filesystem';
//     name: string = 'filesystem';
//     log: Logger;

//     constructor() {
//       super();
//       this.log = logger.child(this.constructor.name);
//     }
  
//     async run(args: TargetArguments): Promise<any> {

//   console.log("TARGET BABY");

//       return new Promise(async (resolve, reject) => {
          
//           let targetFolder = args.config.macros.format(args.options['folder']);
//           let targetFilename = args.config.macros.format(args.options['filename']);

//           targetFolder = targetFolder.replace(/\\/g, '/');

//           if (!targetFilename.endsWith('.zip')) {
//             targetFilename+= '.zip';
//           }

//           try {
//             if (!fs.existsSync(targetFolder)) {
//               fs.mkdirSync(targetFolder, { recursive: true});
//             }
//           } catch(e) {
//             return reject(new TargetError(this.constructor.name, 'Could not create destination folder', e.toString()));
//           }


//           let finalDestination = path.join(targetFolder, targetFilename);

//           try {
//             fs.copyFileSync(args.archiveFilename, finalDestination);
//           } catch(e) {
//             return reject(new TargetError(this.constructor.name, 'Could not copy file to destination', e.toString()));

//           }

//           const keep = parseInt(args.options['keep'], 10);
//           const keepPattern = args.options['keep-match'];
//           if (keep > 0) {
//             await this.cleanup(targetFolder, keep, keepPattern);
//           }


        

//           resolve();
//       });
//     }

//     private async cleanup(folder: string, keep: number, keepPattern: string): Promise<void> {
//       const self = this;

//       return new Promise((resolve, reject) => {
//         const files: {filename: string, created: Date}[] = [];

//         fs.readdir(folder, function(err, items) { 

//             for (var i=0; i<items.length; i++) {

//               if (keepPattern && !isSimpleMatch(items[i], keepPattern)) {
//                 continue;
//               }

//               const fullpath = path.join(folder, items[i]);
//                 const { birthtime } = fs.statSync(fullpath); 
//                 files.push({
//                   filename: fullpath,
//                   created: new Date(birthtime)
//                 });
//             }
 
//             files.sort((a, b) => {
//               if (a.created.getTime() !== b.created.getTime()) {
//                 return a.created.getTime() < b.created.getTime() ? 1 : -1;
//               }
//               return 0;
//             });


//             files.slice(keep).forEach(f => {
//               try {
//                 fs.unlinkSync(f.filename);
//               } catch (e) {
//                 self.log.debug('Could not delete file ' + f.filename);
//               }

//             });


//             resolve();
//         });
//       });
 
//     }
 
//     explain(options: any): string[] {
//       return [
//         `Targeting local file system`,
//         `the destination path is ${options['folder']}`
//       ];
//     }
//     getOptions(): ConfigurableSetting[] {
//         return [
//             {
//               key: 'folder',
//               type: ConfigurableSettingType.MacroString,
//               isRequired: true,
//               description: 'Directory where to save backups'
//             },
//             {
//               key: 'filename',
//               type: ConfigurableSettingType.MacroString,
//               isRequired: true,
//               description: 'Filename of the backup file'
//           },
//             {
//               key: 'keep',
//               type: ConfigurableSettingType.Int,
//               isRequired: false,
//               description: 'Number of maximum files to keep at the target location'
//             },
//             {
//               key: 'keep-match',
//               type: ConfigurableSettingType.String,
//               isRequired: false,
//               description: 'Only list files matching this pattern when deciding what to keep',
//               examples: {
//                 "-t.keep-match=prefix_*": "Includes files starting with prefix_",
//                 "-t.keep-match=*_sufix": "Includes files ending with _sufix",
//               }
//             }
//         ];
//     }
// }