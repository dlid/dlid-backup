import "reflect-metadata"; 
import { InitializeDependencyInjection } from "./lib";
import { container } from "tsyringe";
import {DlidBackup} from './dlid-backup.class';
import { DlidBackupError } from "./exceptions";
InitializeDependencyInjection();
 
// Yes I use "I" prefix for interfaces because I think it makes sense for the classes... Sorry Typescript standards....

var x: DlidBackup = container.resolve("DlidBackup");
x.run().then(f => {

}).catch(err => { 
        if (err instanceof DlidBackupError) {
            const derr = err as DlidBackupError;
            console.error(`\n\x1b[1m\x1b[31mERROR\x1b[0m\t\x1b[41m\x1b[37m${derr.name}\x1b[0m\t\x1b[36m\x1b[1m${err.category}\x1b[0m\t\x1b[37m${err.message}\x1b[0m\t${derr.details}`);
        } else if (err instanceof Error) {
            console.error(`\n\n\x1b[1m\x1b[31mUNHANDLED ERROR\x1b[0m\t${err.message}\x1b[0m\t${err.stack}`);
        }
    });
  