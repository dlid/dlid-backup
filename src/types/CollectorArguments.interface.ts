import { Archive } from "../archive/Archive";
///import { DlidBackupConfiguration } from "../configuration/dlid-backup-configuration.class";

export interface CollectorArguments {
    /**
     * The current, open archive where backup files can be saved
     */
    archive: Archive;
}