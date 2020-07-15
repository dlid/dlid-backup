import { TargetArguments } from "./TargetArguments.interface";

export abstract class TargetBase {
    abstract description: string;
    abstract async run(args: TargetArguments);
} 
 