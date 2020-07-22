import { autoInjectable, inject, container } from "tsyringe";
import { TargetManagerInterface } from './TargetManagerInterface';
import { CollectorBase, TargetBase } from "../../types";

/**
 * Responsible for the available sources that can collect data
*/
@autoInjectable()
export class TargetManager implements TargetManagerInterface {

    private targets: TargetBase<any>[] = [];

    public constructor(
        // @inject("CommandManagerInterface") private commandManager: CommandManagerInterface,
        // @inject("FileManagerInterface") private fileManager: FileManagerInterface 
    ) {}

    public add(...injectionTokens: string[]): TargetManager {
        injectionTokens.forEach(newSource => {
            const instance = container.resolve(newSource);
            if (instance instanceof TargetBase) {
                const i = instance as TargetBase<any>;
                const existing = this.targets.findIndex(s => s.name === i.name);
                if (existing !== -1) {
                    this.targets.splice(existing, 1, i);
                } else {
                    this.targets.push(i);
                }
            }

        });
        return this;
    }

    public clear(): TargetManager {
        this.targets = [];
        return this;
    }

    public getByName(name: string): TargetBase<any> {
        return this.targets.find(s => s.name === name);
    }

 }
