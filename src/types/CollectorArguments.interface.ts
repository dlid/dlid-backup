import { Archive } from "../archive/Archive";
import { DlidBackupConfiguration } from "../configuration/dlid-backup-configuration.class";

export interface CollectorArguments {
    /**
     * The current, open archive where backup files can be saved
     */
    archive: Archive;

    /**
     * The Collector option values
     */
    options: any;

    /**
     * The entire current configuration
     */
    config: DlidBackupConfiguration;

    /**
     * The lines of text that will be added to the readme file of the archive
     */
    readmeLines: string[];
}