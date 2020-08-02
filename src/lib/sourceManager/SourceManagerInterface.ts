import { CollectorBase } from "../../types";
import { UserOptionInterface } from "lib";
import { Archive } from "archive/Archive";
import { SourceResultInterface } from "./SourceResultInterface";

export interface SourceManagerInterface {
    getByName(name: string): CollectorBase<any>;
    add(...injectionTokens: string[]): SourceManagerInterface;
    clear(): SourceManagerInterface;
    getAll(): CollectorBase<any>[];

    runSource(source: CollectorBase<any>, options: UserOptionInterface[], archive: Archive): Promise<SourceResultInterface>;
}
 