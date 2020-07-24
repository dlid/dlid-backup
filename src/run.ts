import "reflect-metadata";
// import { DlidBackup } from "./dlid-backup.class";
// import { DlidBackupError } from "./exceptions/collector.error";
// import { logger } from './util/logger'
// import { argv } from "process";

import { container, autoInjectable, inject } from "tsyringe";

import { CommandManagerInterface, CommandManager, ArgvManager, SourceManagerInterface, SourceManager, UserOptionManager, TargetManager, TargetManagerInterface, TableManager} from './lib';
import { FileManager } from "./lib/fileManager";
import {DlidBackup} from './dlid-backup.class';
import { MySqlCollector, FolderCollector, GlobCollector } from "./collectors";
import { DlidBackupError } from "./exceptions";
import {FileSystemTarget} from './targets/index';


container.register("CommandManagerInterface", {useValue: new CommandManager()});
container.register("FileManagerInterface", {useValue: new FileManager()});
container.register("SourceManagerInterface", { useValue: new SourceManager() });
container.register("TargetManagerInterface", { useValue: new TargetManager() });
container.register("ArgvManagerInterface", {useClass: ArgvManager});
container.register("TableManagerInterface", {useClass: TableManager});

container.register("DlidBackup", { useClass: DlidBackup });
container.register("UserOptionManagerInterface", { useClass: UserOptionManager });

container.register("MySqlCollectorInterface", { useClass: MySqlCollector });
container.register("FolderCollectorInterface", { useClass: FolderCollector });
container.register("GlobCollector", { useClass: GlobCollector });
container.register("FilesystemTargetInterface", { useClass: FileSystemTarget });


(container.resolve("SourceManagerInterface") as SourceManagerInterface)
    .add("FolderCollectorInterface")
    .add("GlobCollector")
    .add("MySqlCollectorInterface");

(container.resolve("TargetManagerInterface") as TargetManagerInterface)
    .add("FilesystemTargetInterface")

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
  
// @autoInjectable()
// class Bar {
//     static i = 0;

//     constructor() {
//         Bar.i++;
//     }

//     public getI() {
//         return Bar.i;
//     }
// }
  

// @autoInjectable()
// class Foo {
//     constructor(@inject(Bar) bar: Bar, baz: string) {
//         console.log("ja?", bar.getI());
//     } 
// }



console.log(1);

// var dlidBackup = new DlidBackup(argv);

// dlidBackup.run().then(() => {
//     logger.success(`Done`);
// }).catch(err => { 
//     if (err instanceof DlidBackupError) {
//         const derr = err as DlidBackupError;
//         console.log(`\n\x1b[1m\x1b[31mERROR\x1b[0m\t\x1b[41m\x1b[37m${derr.name}\x1b[0m\t\x1b[36m\x1b[1m${err.category}\x1b[0m\t\x1b[37m${err.message}\x1b[0m\t${derr.details}`);
//     } else if (err instanceof Error) {
//         console.log(`\n\n\x1b[1m\x1b[31mUNHANDLED ERROR\x1b[0m\t${err.message}\x1b[0m\t${err.stack}`);
//     }
// });
 