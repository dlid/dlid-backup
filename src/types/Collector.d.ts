export interface Collector {
    getOptions(): Collectorsetting[];
}


export interface Collectorsetting {
    key: string;
    type: CollectorSettingType;
    defaultValue?: any;
    isRequired?: boolean;
    description: string;

    /**
     * Used for the guide to ask the user for this value
     */
    prompt?: string;
}

export enum CollectorSettingType {
    String,
    FolderPath,
    FilePath,
    StringArray,
    NumericArray,
    Custom
}

