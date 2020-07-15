import { DlidBackupConfiguration } from "../configuration/dlid-backup-configuration.class";

export interface TargetArguments {
    /**
     * The filename of the file to store in Target
     */
    archiveFilename: string;

    /**
     * The Target option values
     */
    options: any;

    /**
     * The entire current configuration
     */
    config: DlidBackupConfiguration;
} 