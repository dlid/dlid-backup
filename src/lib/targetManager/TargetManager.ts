import { TargetResultInterface } from './TargetResultInterface';
import { autoInjectable, inject, container } from "tsyringe";
import { TargetManagerInterface } from './TargetManagerInterface';
import { CollectorBase, TargetBase } from "../../types";
import { UserOptionInterface } from "lib";
import { Archive } from "archive/Archive";
import { DlidBackupError } from '../../exceptions';

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
            try {
                const instance = container.resolve(newSource);
                const i = instance as TargetBase<any>;
                if (i.name.trim().length === 0) {
                    throw new DlidBackupError('TargetManager', `Source "${newSource}" has no name`, null);
                }
                const existing = this.targets.findIndex(s => s.name === i.name);
                if (existing !== -1) {
                    this.targets.splice(existing, 1, i);
                } else {
                    this.targets.push(i);
                }
            } catch (e) {
                throw new DlidBackupError('TargetManager', `InjectionToken not found "${newSource}"`, e);
            }
            

        });
        return this;
    }

    public clear(): TargetManagerInterface {
        this.targets = [];
        return this;
    }

    public getByName(name: string): TargetBase<any> {
        return this.targets.find(s => s.name === name);
    }

    public getAll(): TargetBase<any>[] {
        return this.targets.slice(0);
    }

    public async runTarget(target: TargetBase<any>, options: UserOptionInterface[], archive: Archive): Promise<TargetResultInterface> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await target.run(options, {
                    archiveFilename: archive.filename
                });
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

 }
