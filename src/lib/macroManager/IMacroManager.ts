
export interface IMacroManager {
    addMacroValue(name: string, value: string): void;
    add(...injectionTokens: string[]): IMacroManager;
    format(value: string): string;
    help();
} 