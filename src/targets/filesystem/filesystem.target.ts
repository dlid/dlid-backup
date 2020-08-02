import { QuickOptionInterface } from './../../lib/userOptionManager/QuickOptionInterface';
import { TargetError } from './../../exceptions/collector.error';
import { TargetBase, TargetArguments } from "../../types";
import { UserOptionInterface, UserOptionType, ParsedCommand, UserOptionManagerInterface, TargetResultInterface, IMacroManager } from "../../lib";
import { FileManagerInterface } from "../../lib/fileManager";
import { inject, autoInjectable } from "tsyringe";
import { Logger, logger } from '../../util';

export interface FileSystemTargetOptions {
     folder: string;
     filename: string;
     keep?: number;
     keepMatch?: string;
} 

@autoInjectable()
export class FileSystemTarget extends TargetBase<FileSystemTargetOptions> {
    parametersDescription: string = '  The full path to the destination file  \n\n  --target filesystem E:\\backup\\backup.zip\n  is the same as\n  --target filesystem --target.folder E:\\backup --target.filename backup.zip\n';
    parametersName: string = 'Filename';
    name: string = 'filesystem';
    description: string = 'Save backup to local filesystem';
    log: Logger;

    constructor(
        @inject("FileManagerInterface") private fileManager: FileManagerInterface,
        @inject("UserOptionManagerInterface") private userOptionsManager: UserOptionManagerInterface,
        @inject("IMacroManager") private macroManager: IMacroManager
    ) {
        super();
        this.log = logger.child('FileSystemTarget');
    }

    public getQuickOptions(): QuickOptionInterface[] {
        return [
            {
                description: 'Full path to target file (sets folder and filename options)',
                name: 'Filename',
                examples: [
                    '--target filesystem /mnt/bcktape001/filename.zip'
                ]
            }
        ] as QuickOptionInterface[];
    }

    async run(config: FileSystemTargetOptions, args: TargetArguments): Promise<TargetResultInterface> {
        
        return new Promise(async (resolve) => {

                
            let targetFolder = this.macroManager.format(config.folder);
            let targetFilename = this.macroManager.format(config.filename);

            targetFolder = targetFolder.replace(/\\/g, '/');

            if (!targetFilename.endsWith('.zip')) {
                targetFilename+= '.zip';
            }

            try {
                if (!this.fileManager.exists(targetFolder)) {
                    this.log.debug(`Creating destination folder ${targetFolder}`);
                    this.fileManager.mkdir(targetFolder);
                }
            } catch(e) {
                throw new TargetError(this.constructor.name, 'Could not create destination folder', e.toString());
            }

            let finalDestination = this.fileManager.join(targetFolder, targetFilename);
            this.log.debug(`Copying "${args.archiveFilename}" to "${finalDestination}"`);

            try {
                this.fileManager.copy(args.archiveFilename, finalDestination);
            } catch(e) {
                throw new TargetError(this.constructor.name, 'Could not copy file to destination', e.toString());

            }

            if (config.keep > 0) {
                await this.cleanup(targetFolder, config.keep, config.keepMatch);
            }

            resolve({});
        }); 

    }

    public prepareParsedCommand(command: ParsedCommand): void {
        if (command.parameters.length > 1) {
            this.log.debug(`Parsing command parameters`, command.parameters.slice(1));
            const fileInfo = this.fileManager.getFileParts(command.parameters[1]);
            if (fileInfo.filename !== '.') {
                this.log.debug(`Parameter was parsed as a path (Folder "${fileInfo.directory}" and file "${fileInfo.filename}"`);
                if (!fileInfo.filename.endsWith('.zip')) {
                    fileInfo.filename += '.zip';
                }
                this.userOptionsManager.addOptionValue(command, 'folder', fileInfo.directory);
                this.userOptionsManager.addOptionValue(command, 'filename', fileInfo.filename);
            } else {
                this.log.debug(`Parameter could not be parsed as a path`);
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

    /**
     * Delete old files in the folder.
     * @param folder The folder path
     * @param keep The number of files to keep
     * @param keepPattern Ignore files not matching this pattern
     */
    public async cleanup(folder: string, keep: number, keepPattern: string): Promise<void> {
        this.log.debug(`Cleaning up old files`);

        return new Promise(async (resolve, reject) => {

            const files = await this.fileManager.getFilesToDelete(folder, keep, keepPattern);
            this.log.debug(`Found ${files.length} file(s) to delete in ${folder}`);

            files.forEach(file => {
                try {
                    this.log.trace(`Deleting file ${file.fullName}`);
                    this.fileManager.delete(file.fullName);
                } catch (e) {
                    this.log.warn(`Could not delete ${file.fullName}`, e?.toString());
                }
            })
            resolve();
        });
    }

} 
