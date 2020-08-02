import { DlidBackupError } from './../../exceptions/collector.error';
import { SourceResultInterface } from './SourceResultInterface';
import { Archive } from './../../archive/Archive';
import { UserOptionInterface } from './../userOptionManager/UserOptionInterface';
import { autoInjectable, container } from "tsyringe";
import { SourceManagerInterface } from './SourceManagerInterface';
import { CollectorBase } from "../../types";
import { Logger, logger } from '../../util';

/**
 * Responsible for the available sources that can collect data
*/
@autoInjectable()
export class SourceManager implements SourceManagerInterface {

    private sources: CollectorBase<any>[] = [];
    private log: Logger;

    public constructor(
        // @inject("CommandManagerInterface") private commandManager: CommandManagerInterface,
        // @inject("FileManagerInterface") private fileManager: FileManagerInterface 
    ) {
        
        this.log = logger.child('SourceManager');
    }

    /**
     * Add Injectable tokens for available sources
     */
    public add(...injectionTokens: string[]): SourceManager {
        injectionTokens.forEach(newSource => {
            try {
                const instance = container.resolve(newSource);
                const i = instance as CollectorBase<any>;
                if (i.name.trim().length === 0) {
                    throw new DlidBackupError('SourceManager', `Source "${newSource}" has no name`, null);
                }
                const existing = this.sources.findIndex(s => s.name === i.name);
                if (existing !== -1) {
                    this.sources.splice(existing, 1, i);
                } else {
                    this.sources.push(i);
                }
            } catch (e) {
                throw new DlidBackupError('SourceManager', `InjectionToken not found "${newSource}"`, e);
            }

        });
        return this;
    }

    /**
     * Get all sources
     */
    public getAll(): CollectorBase<any>[] {
        return this.sources.slice(0);
    }

    /**
     * Clear all registered sources
     */
    public clear(): SourceManager {
        this.sources = [];
        return this;
    }

    /**
     * Get a source by name
     */
    public getByName(name: string): CollectorBase<any> {
        return this.sources.find(s => s.name === name);
    }

    /**
     * Invoke data collection for a given source 
     */
    public async runSource(source: CollectorBase<any>, options: UserOptionInterface[], archive: Archive): Promise<SourceResultInterface> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await source.collect(options, {
                    archive: archive
                });
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }

 }
