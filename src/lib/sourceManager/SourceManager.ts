import { autoInjectable, inject, container } from "tsyringe";
import { SourceManagerInterface } from './SourceManagerInterface';
import { CollectorBase } from "../../types";

/**
 * Responsible for the available sources that can collect data
*/
@autoInjectable()
export class SourceManager implements SourceManagerInterface {

    private sources: CollectorBase<any>[] = [];

    public constructor(
        // @inject("CommandManagerInterface") private commandManager: CommandManagerInterface,
        // @inject("FileManagerInterface") private fileManager: FileManagerInterface 
    ) {}

    public add(...injectionTokens: string[]): SourceManager {
        injectionTokens.forEach(newSource => {
            const instance = container.resolve(newSource);
            if (instance instanceof CollectorBase) {
                const i = instance as CollectorBase<any>;
                const existing = this.sources.findIndex(s => s.name === i.name);
                if (existing !== -1) {
                    this.sources.splice(existing, 1, i);
                } else {
                    this.sources.push(i);
                }
            }

        });
        return this;
    }

    public clear(): SourceManager {
        this.sources = [];
        return this;
    }

    public getByName(name: string): CollectorBase<any> {
        return this.sources.find(s => s.name === name);
    }

 }
