import { DlidBackup } from "./dlid-backup.class";
import { DlidBackupError } from "./exceptions/collector.error";
import { logger } from './util/logger'
import { argv } from "process";

var dlidBackup = new DlidBackup(argv);

dlidBackup.run().then(() => {
    logger.success(`Done`);
}).catch(err => { 
    if (err instanceof DlidBackupError) {
        const derr = err as DlidBackupError;
        console.log(`\n\x1b[1m\x1b[31mERROR\x1b[0m\t\x1b[41m\x1b[37m${derr.name}\x1b[0m\t\x1b[36m\x1b[1m${err.category}\x1b[0m\t\x1b[37m${err.message}\x1b[0m\t${derr.details}`);
    } else if (err instanceof Error) {
        console.log(`\n\n\x1b[1m\x1b[31mUNHANDLED ERROR\x1b[0m\t${err.message}\x1b[0m\t${err.stack}`);
    }
});
 