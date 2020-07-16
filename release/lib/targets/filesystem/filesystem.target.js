"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemTarget = void 0;
const Configurable_type_1 = require("../../types/Configurable.type");
const TargetBase_type_1 = require("../../types/TargetBase.type");
const fs = require("fs");
const path = require("path");
const exceptions_1 = require("../../exceptions");
const util_1 = require("../../util");
const isSimpleMatch_function_1 = require("./../../util/isSimpleMatch.function");
class FileSystemTarget extends TargetBase_type_1.TargetBase {
    constructor() {
        super();
        this.description = 'Save backup to filesystem';
        this.name = 'filesystem';
        this.log = util_1.logger.child(this.constructor.name);
    }
    async run(args) {
        console.log("TARGET BABY");
        return new Promise(async (resolve, reject) => {
            let targetFolder = args.config.macros.format(args.options['folder']);
            let targetFilename = args.config.macros.format(args.options['filename']);
            targetFolder = targetFolder.replace(/\\/g, '/');
            if (!targetFilename.endsWith('.zip')) {
                targetFilename += '.zip';
            }
            try {
                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder, { recursive: true });
                }
            }
            catch (e) {
                return reject(new exceptions_1.TargetError(this.constructor.name, 'Could not create destination folder', e.toString()));
            }
            let finalDestination = path.join(targetFolder, targetFilename);
            try {
                fs.copyFileSync(args.archiveFilename, finalDestination);
            }
            catch (e) {
                return reject(new exceptions_1.TargetError(this.constructor.name, 'Could not copy file to destination', e.toString()));
            }
            const keep = parseInt(args.options['keep'], 10);
            const keepPattern = args.options['keep-match'];
            if (keep > 0) {
                await this.cleanup(targetFolder, keep, keepPattern);
            }
            resolve();
        });
    }
    async cleanup(folder, keep, keepPattern) {
        const self = this;
        return new Promise((resolve, reject) => {
            const files = [];
            fs.readdir(folder, function (err, items) {
                for (var i = 0; i < items.length; i++) {
                    if (keepPattern && !isSimpleMatch_function_1.isSimpleMatch(items[i], keepPattern)) {
                        continue;
                    }
                    const fullpath = path.join(folder, items[i]);
                    const { birthtime } = fs.statSync(fullpath);
                    files.push({
                        filename: fullpath,
                        created: new Date(birthtime)
                    });
                }
                files.sort((a, b) => {
                    if (a.created.getTime() !== b.created.getTime()) {
                        return a.created.getTime() < b.created.getTime() ? 1 : -1;
                    }
                    return 0;
                });
                files.slice(keep).forEach(f => {
                    try {
                        fs.unlinkSync(f.filename);
                    }
                    catch (e) {
                        self.log.debug('Could not delete file ' + f.filename);
                    }
                });
                resolve();
            });
        });
    }
    explain(options) {
        return [
            `Targeting local file system`,
            `the destination path is ${options['folder']}`
        ];
    }
    getOptions() {
        return [
            {
                key: 'folder',
                type: Configurable_type_1.ConfigurableSettingType.MacroString,
                isRequired: true,
                description: 'Directory where to save backups'
            },
            {
                key: 'filename',
                type: Configurable_type_1.ConfigurableSettingType.MacroString,
                isRequired: true,
                description: 'Filename of the backup file'
            },
            {
                key: 'keep',
                type: Configurable_type_1.ConfigurableSettingType.Int,
                isRequired: false,
                description: 'Number of maximum files to keep at the target location'
            },
            {
                key: 'keep-match',
                type: Configurable_type_1.ConfigurableSettingType.String,
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
exports.FileSystemTarget = FileSystemTarget;
