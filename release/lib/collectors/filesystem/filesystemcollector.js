"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesystemCollector = void 0;
const Configurable_type_1 = require("../../types/Configurable.type");
const CollectorBase_type_1 = require("../../types/CollectorBase.type");
const globby = require("globby");
const util_1 = require("../../util");
const extractZipFolderName_function_1 = require("../../util/extractZipFolderName.function");
const path = require("path");
const exceptions_1 = require("../../exceptions");
class FilesystemCollector extends CollectorBase_type_1.CollectorBase {
    constructor() {
        super();
        this.description = 'Backup local files and folders';
        this.name = 'filesystem';
        this.log = util_1.logger.child(this.constructor.name);
    }
    explain(options) {
        return [];
    }
    getOptions() {
        return [
            {
                key: 'glob',
                type: Configurable_type_1.ConfigurableSettingType.StringArray,
                allowZipTargetFolder: true,
                isRequired: false,
                multi: true,
                description: 'List of glob patterns',
                examples: {
                    '-s.pattern=C:\\config\\**\\*.*': 'All files and folders in C:\\config. Stored in "c_config" folder in zip',
                    '-s.pattern=(?settings)C:\\config\*.js': 'All .js files in configfolder. Stored in "settings" folder in zip'
                }
            },
            {
                key: 'folder',
                type: Configurable_type_1.ConfigurableSettingType.FolderPathArray,
                allowZipTargetFolder: true,
                isRequired: false,
                multi: true,
                description: 'List of folders',
                examples: {
                    '-s.folder=C:\\Temp -s.folder=E:\\config': 'Adds the temp and config folders to backup zip'
                }
            }
        ];
    }
    findBasePath(paths) {
        let basePath = paths[0].replace('\\', '/');
        do {
            const startsWithBasePath = paths.filter(p => p.startsWith(basePath)).length;
            if (startsWithBasePath !== paths.length) {
                if (basePath.includes('/')) {
                    basePath = basePath.substring(0, basePath.lastIndexOf('/'));
                }
                else {
                    basePath = '';
                }
            }
            else {
                break;
            }
        } while (basePath.length > 0);
        return basePath;
    }
    async collect(args) {
        this.options = args.options;
        this.log.info(`Collecting local files`);
        const patterns = args.options.glob || [];
        const folders = args.options.folder || [];
        if (patterns.length === 0 && folders.length === 0) {
            throw new exceptions_1.ParameterException('-s.glob | -s.folder', null, 'Please specify a glob or folder to collect');
        }
        const zipFolders = {};
        let addedItems = 0;
        for (let i = 0; i < patterns.length; i++) {
            this.log.debug(`Collecting files from glob ${patterns[i]}`);
            let glob = patterns[i];
            let { zipTargetFolder, value } = extractZipFolderName_function_1.extractZipFolderName(glob, `glob_${i}`);
            this.log.trace(`Finding files matching "${value}"`);
            const paths = await globby([value]);
            args.readmeLines.push(`Adding ${paths.length} files from glob pattern "${value}" to folder "${zipTargetFolder}"`);
            if (paths.length > 0) {
                var basePath = this.findBasePath(paths);
                for (let j = 0; j < paths.length; j++) {
                    const targetFilename = paths[j].replace(/\//g, '/').replace(basePath, zipTargetFolder);
                    args.archive.addLocalFile(paths[j], targetFilename);
                    addedItems++;
                }
                this.log.info(`Added ${paths.length} file(s) to "${zipTargetFolder}" folder in archive`);
            }
            else {
                this.log.debug(`No files added`);
            }
        }
        for (let i = 0; i < folders.length; i++) {
            this.log.debug(`Collecting folder ${folders[i]}`);
            let { zipTargetFolder, value } = extractZipFolderName_function_1.extractZipFolderName(folders[i], ``);
            const baseName = path.basename(value);
            if (!zipTargetFolder) {
                zipTargetFolder = baseName || `folder_${i}`;
            }
            args.archive.addLocalFolder(value, zipTargetFolder);
            addedItems++;
            args.readmeLines.push(`Added folder ${value} to ${zipTargetFolder} in archive`);
            this.log.debug(`Folder added`);
        }
        this.log.success('Data collection complete');
        return addedItems > 0;
    }
}
exports.FilesystemCollector = FilesystemCollector;
