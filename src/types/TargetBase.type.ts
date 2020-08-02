import { TargetArguments } from "./TargetArguments.interface";
import { ParsedCommand, UserOptionInterface, TargetResultInterface, QuickOptionInterface } from "../lib";

export abstract class TargetBase<T> {
    abstract name: string;
    abstract description: string;
    abstract async run(config: T, args: TargetArguments): Promise<TargetResultInterface>;
    public abstract options?: UserOptionInterface[];

    public getQuickOptions(): QuickOptionInterface[] {
        return undefined;
    }

    /**
     * Before options are parsed - the target can modify
     */
    public prepareParsedCommand(command: ParsedCommand): void {}
} 
