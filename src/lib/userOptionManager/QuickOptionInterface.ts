export interface QuickOptionInterface {
    /**
     * Title for documentation/help
     */
    name: string;

    /**
     * Name of parameter in help syntax
     */
    parameterName: string;

    /**
     * Longer description of parameter
     */
    description: string;

    examples?: string[];

    allowMultiple?: boolean;
}
