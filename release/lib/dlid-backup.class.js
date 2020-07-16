"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DlidBackup = void 0;
const CollectorBase_type_1 = require("./types/CollectorBase.type");
const TargetBase_type_1 = require("./types/TargetBase.type");
const dlid_backup_configuration_class_1 = require("./configuration/dlid-backup-configuration.class");
const util_1 = require("./util");
const tmp = require("tmp");
const Archive_1 = require("./archive/Archive");
const os = require('os');
const util_2 = require("./util");
const getUtcNowString_function_1 = require("./util/getUtcNowString.function");
const date_macro_class_1 = require("./macros/date-macro.class");
const macro_store_class_1 = require("./macros/macro-store.class");
const fs = require("fs");
const collectors_1 = require("./collectors");
const targets_1 = require("./targets");
class DlidBackup {
    constructor(parameters) {
        this.parameters = parameters;
        this.readmeLines = [];
        this.version = '0.5.1'; // Replaced by script
        util_2.logger.setLogLevel(util_1.LogLevel.Info, this.parameters);
    }
    async collect() {
        var _a;
        let isCollected = false;
        let zipFilename = tmp.tmpNameSync({ postfix: '.zip' });
        const archive = new Archive_1.Archive(zipFilename);
        const source = this.config.source;
        const args = {
            archive: archive,
            config: this.config,
            options: this.config.sourceOptions,
            readmeLines: []
        };
        try {
            isCollected = await source.collect(args);
            if (((_a = args.readmeLines) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                this.readmeLines = this.readmeLines.concat(args.readmeLines);
            }
        }
        catch (e) {
            archive.discard();
            throw e;
        }
        return { isCollected, zipFilename, archive };
    }
    async run() {
        return new Promise(async (resolve, reject) => {
            var start = new Date();
            try {
                const targetsAndCollectors = [
                    new collectors_1.FilesystemCollector(),
                    new collectors_1.MySqlCollector(),
                    new targets_1.FileSystemTarget(),
                    new targets_1.FireStoreTarget()
                ];
                this.config = new dlid_backup_configuration_class_1.DlidBackupConfiguration(targetsAndCollectors, this.parameters);
                util_2.logger.info('version is ', this.version);
                this.config.macros = new macro_store_class_1.MacroStore();
                this.config.macros.add(new date_macro_class_1.DateMacroFormatter());
                // this.config.macros.add(new DateMacroFormatter());
                // First - parse parameters
                await this.config.parseParameters();
                // console.log(yaml.stringify({
                //     'source': {
                //         'type': this.config.source.name,
                //         'options': this.config.sourceOptions
                //     },
                //     'target': {
                //         'type': this.config.target.name,
                //         'options': this.config.targetOptions
                //     }
                // }));
                //  throw "x";
                if (this.config.action.indexOf('help') === 0) {
                    this.help(this.config.action.replace(/^help\s?/, ''));
                    return;
                }
                let collectionResult;
                collectionResult = await this.collect();
                if (!collectionResult.isCollected) {
                    util_2.logger.warn('No backup data was collected');
                    await collectionResult.archive.discard();
                    return resolve();
                }
                const readme = [];
                readme.push(`DLID-BACKUP SUMMARY`);
                readme.push(`========================`);
                readme.push(`Thank you for using dlid-backup - http://github.com/dlid/dlid-backup/`);
                readme.push(`Version: ${this.version}`);
                readme.push(`Backup Started: ${getUtcNowString_function_1.getUtcNowString(start)}`);
                readme.push(`Archive Created: ${getUtcNowString_function_1.getUtcNowString(new Date())}`);
                readme.push(`Collector: ${this.config.source.name}`);
                readme.push(`Target: ${this.config.target.name}`);
                readme.push(`OS Type: ${os.type()}`);
                readme.push('');
                this.readmeLines = readme.concat(this.readmeLines);
                // Add readme to zip file
                collectionResult.archive.addString('dlid-backup.txt', this.readmeLines.join('\n'));
                util_2.logger.debug('Adding dlid-backup.txt to zip file');
                await collectionResult.archive.save();
                const target = this.config.target;
                const args = {
                    archiveFilename: collectionResult.zipFilename,
                    config: this.config,
                    options: this.config.targetOptions
                };
                await target.run(args);
                this.deleteCollectedFile(collectionResult.zipFilename);
            }
            catch (e) {
                reject(e);
            }
            resolve(true);
        });
    }
    deleteCollectedFile(filename) {
        try {
            if (fs.existsSync(filename)) {
                util_2.logger.debug('Deleting ', filename);
                fs.unlinkSync(filename);
            }
        }
        catch (e) {
            util_2.logger.debug('Error deleting ', filename);
        }
    }
    help(topic = null) {
        if (topic === 'macros') {
            console.log();
            console.log("MacroStrings can be used to dynamically name files and folders");
            console.log();
            const d = this.config.macros.format("weekly/{date:yyyy}/{date:yyyy'W'II}");
            const daily = this.config.macros.format("monthly/{date:yyyy}/{date:yyyy-MM}");
            console.log(`-t.folder="weekly/{date:yyyy}/{date:yyyy'W'II}"    -   Save weekly backup in weekly folder "${d}"`);
            console.log(`-t.folder="monthly/{date:yyyy}/{date:yyyy-MM}"    -   Save monthly backup "${daily}"`);
            console.log();
            console.log("{date:<pattern>} - See https://date-fns.org/v2.14.0/docs/format for valid patterns");
            // console.log("{env:<name>}     - Environment variable value");
            return;
        }
        console.log(`
        dlid-backup will zip \x1b[32msource\x1b[0m data
            and save that data in \x1b[36mtarget\x1b[0m.`);
        console.log(`Usage
            
            dlid-backup [run|explain]
            \x1b[32m-s:\x1b[0m<type> \x1b[32m--source:\x1b[0m<type>               The Source to make a backup of
                \x1b[32m-s.\x1b[0m<option>=val \x1b[32m--source\x1b[0m.<option>=val   Set an option for the source
                    -t:<type> --target:<type>               The target - where to save the backup
                    -t.<option>=val --target.<option>=val   Set an option for the target
                    -o=filename.zip                         The filename of the resulting zip archive
                    
                    Sources
                    `);
        var collectors = this.config.configurables.filter(cfg => cfg instanceof CollectorBase_type_1.CollectorBase);
        var targets = this.config.configurables.filter(cfg => cfg instanceof TargetBase_type_1.TargetBase);
        collectors.forEach(collector => {
            const c = collector;
            console.log(`\x1b[32m-s:${collector.name}\x1b[0m - ${c.description}`);
            var maxKeyLen = collector.getOptions().reduce((v, va) => {
                var l = `  -s.${va.key}=<${util_1.typeToString(va.type)}>`.length;
                return l > v ? l : v;
            }, 0) + 4;
            collector.getOptions().forEach(opt => {
                var protot = `  -s.${opt.key}=<${util_1.typeToString(opt.type)}>`;
                var padded = protot.padEnd(maxKeyLen, ' ');
                var required = opt.isRequired === true ? '[required]' : '';
                console.log(`${padded} - ${required}${opt.description}`);
            });
            console.log("\n");
        });
        console.log('Targets\n');
        targets.forEach(collector => {
            const c = collector;
            console.log(`\x1b[36m-t:${collector.name}\x1b[0m - ${c.description}`);
            var maxKeyLen = collector.getOptions().reduce((v, va) => {
                var l = `  -t.${va.key}=<${util_1.typeToString(va.type)}>`.length;
                return l > v ? l : v;
            }, 0) + 4;
            collector.getOptions().forEach(opt => {
                var protot = `  \x1b[36m-t\x1b[0m.${opt.key}=<${util_1.typeToString(opt.type)}>`;
                var padded = protot.padEnd(maxKeyLen, ' ');
                var required = opt.isRequired === true ? '[required]' : '';
                console.log(`${padded} - ${required}${opt.description}`);
            });
            console.log("\n");
        });
    }
}
exports.DlidBackup = DlidBackup;
