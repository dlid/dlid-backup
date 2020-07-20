// import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
// import { CollectorBase } from "../../types/CollectorBase.type";
// import { Archive } from "../../archive/Archive";
// import globby = require('globby');
// import { Logger, logger } from "../../util";
// import { arch } from "os";
// import { resolve, basename } from "path";
// import { extractZipFolderName } from "../../util/extractZipFolderName.function";
// import path = require("path");
// import { ParameterException } from "../../exceptions";
// import { DlidBackupConfiguration } from "../../configuration/dlid-backup-configuration.class";
// import { CollectorArguments } from "../../types/CollectorArguments.interface";

// export class FilesystemCollector extends CollectorBase implements Configurable {
//     description: string = 'Backup local files and folders';
//     name: string = 'filesystem';
//     options;
//     log: Logger;

//     constructor() {
//         super();
//         this.log = logger.child(this.constructor.name);
//     }

//     explain(options: any): string[] {
//         return [];
//     }

//     getOptions(): ConfigurableSetting[] {
//         return [
//             {
//                 key: 'glob',
//                 type: ConfigurableSettingType.StringArray,
//                 allowZipTargetFolder: true,
//                 isRequired: false,
//                 multi: true,
//                 description: 'List of glob patterns',
//                 examples: {
//                     '-s.pattern=C:\\config\\**\\*.*': 'All files and folders in C:\\config. Stored in "c_config" folder in zip',
//                     '-s.pattern=(?settings)C:\\config\*.js': 'All .js files in configfolder. Stored in "settings" folder in zip'
//                 }
//             },
//             {
//                 key: 'folder',
//                 type: ConfigurableSettingType.FolderPathArray,
//                 allowZipTargetFolder: true,
//                 isRequired: false,
//                 multi: true,
//                 description: 'List of folders',
//                 examples: {
//                     '-s.folder=C:\\Temp -s.folder=E:\\config': 'Adds the temp and config folders to backup zip'
//                 }
//             }
//         ];
//     }

//     private findBasePath(paths: string[]) {
//          let basePath = paths[0].replace('\\', '/');
//         do {
//             const startsWithBasePath = paths.filter(p => p.startsWith(basePath)).length;

//             if (startsWithBasePath !== paths.length) {
//                 if (basePath.includes('/')) {
//                     basePath = basePath.substring(0, basePath.lastIndexOf('/'));
//                 } else {
//                     basePath = '';
//                 }
//             } else {
//                 break;
//             }
//         } while (basePath.length > 0);
//         return basePath;
//     }

//     async collect(args: CollectorArguments): Promise<any> {
//         this.options = args.options;

//         this.log.info(`Collecting local files`);

//         const patterns: string[] = args.options.glob || [];
//         const folders: string[] = args.options.folder || [];

//         if (patterns.length === 0 && folders.length === 0) {
//             throw new ParameterException('-s.glob | -s.folder', null, 'Please specify a glob or folder to collect');
//         }

//         const zipFolders = {};
//         let addedItems = 0;

//         for (let i=0; i < patterns.length; i++) {
//             this.log.debug(`Collecting files from glob ${patterns[i]}`);
//             let glob = patterns[i];
//             let { zipTargetFolder, value } = extractZipFolderName(glob, `glob_${i}`);
//             this.log.trace(`Finding files matching "${value}"`);
//             const paths = await globby([value]);
//             args.readmeLines.push(`Adding ${paths.length} files from glob pattern "${value}" to folder "${zipTargetFolder}"`);

//             if (paths.length > 0) {
//                 var basePath = this.findBasePath(paths);
//                 for (let j=0; j < paths.length; j++) {
//                     const targetFilename = paths[j].replace(/\//g, '/').replace(basePath, zipTargetFolder);
//                     args.archive.addLocalFile(paths[j], targetFilename);
//                     addedItems++;
//                 }
//                 this.log.info(`Added ${paths.length} file(s) to "${zipTargetFolder}" folder in archive`);
//             } else {
//                 this.log.debug(`No files added`);
//             }
//         }

//         for (let i=0; i < folders.length; i++) {
//             this.log.debug(`Collecting folder ${folders[i]}`);
//             let { zipTargetFolder, value } = extractZipFolderName(folders[i], ``);
//             const baseName = path.basename(value);
//             if (!zipTargetFolder) {
//                 zipTargetFolder = baseName || `folder_${i}`;
//             }
//             args.archive.addLocalFolder(value, zipTargetFolder);
//             addedItems++;
//             args.readmeLines.push(`Added folder ${value} to ${zipTargetFolder} in archive`);
//             this.log.debug(`Folder added`);
//         }

//         this.log.success('Data collection complete');
        
//         return addedItems > 0;
//     }

// } 
