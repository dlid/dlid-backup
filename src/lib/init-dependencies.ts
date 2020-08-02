import { FolderCollector } from './../collectors/folder/FolderCollector';
import "reflect-metadata"; 

import { container } from "tsyringe";
import { CommandManager, ArgvManager, SourceManagerInterface, SourceManager, UserOptionManager, TargetManager, TargetManagerInterface, TableManager, JobManager, IMacroManager, MacroManager, DateMacroFormatter, HelpManager} from '.';
import { FileManager } from "./fileManager";
import { MySqlCollector,  GlobCollector } from "./../collectors";
import { FileSystemTarget } from './../targets/index';
import { DateManager } from "./dateManager/DateManager";
import { DlidBackup } from "./../dlid-backup.class";

export function InitializeDependencyInjection() {
 
    container.register("CommandManagerInterface", {useValue: new CommandManager()});
    container.register("FileManagerInterface", {useValue: new FileManager()});
    container.register("SourceManagerInterface", { useValue: new SourceManager() });
    container.register("TargetManagerInterface", { useValue: new TargetManager() });
    container.register("ArgvManagerInterface", {useClass: ArgvManager});
    container.register("TableManagerInterface", {useClass: TableManager});
    container.register("JobManagerInterface", {useClass: JobManager});
    container.register("IDateManager", {useValue: new DateManager()});
    container.register("IMacroManager", {useValue: new MacroManager()});
    container.register("IHelpManager", {useClass: HelpManager});
    
    container.register("DlidBackup", { useClass: DlidBackup });
    container.register("UserOptionManagerInterface", { useClass: UserOptionManager });

    container.register("DateMacroFormatter", {useClass: DateMacroFormatter});
    container.register("MySqlCollector", { useClass: MySqlCollector });
    container.register("FolderCollector", { useClass: FolderCollector });
    container.register("FolderCollectorInterface", { useClass: FolderCollector });
    container.register("GlobCollector", { useClass: GlobCollector });
    container.register("FilesystemTargetInterface", { useClass: FileSystemTarget });

    (container.resolve("IMacroManager") as IMacroManager)
        .add("DateMacroFormatter");
        
    (container.resolve("SourceManagerInterface") as SourceManagerInterface)
        .add("FolderCollectorInterface")
        .add("GlobCollector")
        .add("MySqlCollector");

    (container.resolve("TargetManagerInterface") as TargetManagerInterface)
        .add("FilesystemTargetInterface")

}
