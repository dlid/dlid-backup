import { TargetArguments } from "./TargetArguments.interface";
import { ParsedCommand, UserOptionInterface } from "../lib";

export abstract class TargetBase<T> {
    abstract name: string;
    abstract description: string;
    abstract async run(config: T, args: TargetArguments);
    public abstract options?: UserOptionInterface[];

    /**
     * Before options are parsed - thhe target can modify
     */
    public prepareParsedCommand(command: ParsedCommand): void {}
} 
