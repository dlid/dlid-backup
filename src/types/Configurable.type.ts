export interface Configurable {
    name: string;
    getOptions(): ConfigurableSetting[];
    
    explain(options: any): string[];

}




export interface ConfigurableSetting {
    key: string;
    type: ConfigurableSettingType;
    defaultValue?: any;
    isRequired?: boolean;
    description: string;
    multi?: boolean;
    examples?: { [example: string]: string };
    allowZipTargetFolder?: boolean;

    /**
     * Never log this value
     */
    isSensitive?: boolean;

    /**
     * Used for the guide to ask the user for this value
     */
    prompt?: string;
}

export enum ConfigurableSettingType {
    String,
    MacroString,
    Int,
    FolderPath,
    FolderPathArray,
    FilePath,
    StringArray,
    IntArray,
    Float,
    FloatArray,
    Custom
}


// dlid-backup
// What do you want to backup?
// o Folder or file
// o Local MySQL Database
//   -> config
// Where yo do you want to back it up to?
// o Firestore
// o Local filesystem
// o (SFTP)
// o (FTP)
// o (OneDrive)
