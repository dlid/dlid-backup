import { UserOptionType } from ".";

export interface UserOptionInterface {
    key: string;
    type: UserOptionType;
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
