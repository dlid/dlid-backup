import { TargetBase } from "../../types";

export interface TargetManagerInterface {
    getByName(name: string): TargetBase<any>;
    add(...injectionTokens: string[]): TargetManagerInterface;
    clear(): TargetManagerInterface;
    getAll(): TargetBase<any>[];
}
