import { TargetResultInterface } from './TargetResultInterface';
import { TargetBase } from "../../types";
import { UserOptionInterface } from "lib";
import { Archive } from "archive/Archive";

export interface TargetManagerInterface {
    getByName(name: string): TargetBase<any>;
    add(...injectionTokens: string[]): TargetManagerInterface;
    clear(): TargetManagerInterface;
    getAll(): TargetBase<any>[];
    runTarget(source: TargetBase<any>, options: UserOptionInterface[], archive: Archive): Promise<TargetResultInterface>;
}
