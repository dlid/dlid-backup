import { CollectorBase } from "../../types";

export interface SourceManagerInterface {
    getByName(name: string): CollectorBase<any>;
    add(...injectionTokens: string[]): SourceManagerInterface;
    clear(): SourceManagerInterface;
}
