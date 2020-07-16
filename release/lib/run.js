"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dlid_backup_class_1 = require("./dlid-backup.class");
const collector_error_1 = require("./exceptions/collector.error");
const logger_1 = require("./util/logger");
const process_1 = require("process");
var dlidBackup = new dlid_backup_class_1.DlidBackup(process_1.argv);
dlidBackup.run().then(() => {
    logger_1.logger.success(`Done`);
}).catch(err => {
    if (err instanceof collector_error_1.DlidBackupError) {
        const derr = err;
        console.log(`\n\x1b[1m\x1b[31mERROR\x1b[0m\t\x1b[41m\x1b[37m${derr.name}\x1b[0m\t\x1b[36m\x1b[1m${err.category}\x1b[0m\t\x1b[37m${err.message}\x1b[0m\t${derr.details}`);
    }
    else if (err instanceof Error) {
        console.log(`\n\n\x1b[1m\x1b[31mUNHANDLED ERROR\x1b[0m\t${err.message}\x1b[0m\t${err.stack}`);
    }
});
