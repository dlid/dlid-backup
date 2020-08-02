import { FileInformation } from './FileInformation';
import fs = require('fs');
import path = require('path');
import { logger, Logger, isSimpleMatch } from '../../util';
import { FileManagerInterface } from './FileManagerInterface';
import globby = require("globby");


export class FileManager implements FileManagerInterface {

    private log: Logger;

    constructor() {
        this.log = logger.child(this.constructor.name);
    }

    mkdir(path: string) {
        fs.mkdirSync(path, { recursive: true});
    }

    resolvePath(val: string): string {
        try {
            return path.resolve(val);
        } catch (e) {
            this.log.debug(`Could not resolve path ${val}`, e);
        }
        return val;
    }

    join(...paths: string[]): string {
        return path.join.apply(path, paths);
    }

    copy(source: string, target: string): void {
        fs.copyFileSync(source, target);
    }
    
    bytesToSize(bytes: number): string {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        const v = Math.floor(Math.log(bytes) / Math.log(1024))
        var i = parseInt( v.toString()  );
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
     };

    readTextSync(filename: string): string {
        this.log.debug(`Reading file ${filename}`);
        try {
            
            return fs.readFileSync(filename).toString();
        } catch (e) {
            // Let's just return undefined in case of error
            this.log.debug(`Error reading file`, e);
        }
        return undefined;
    }

    exists(path: string): boolean {
        try {
            return fs.existsSync(path);
        } catch (e) {
            // Let's just return false in case of error
            this.log.debug(`Could not check if path exists`, e);
        }
        return false;
    }

    getFileParts(fullPath: string): { filename: string; directory: string } {
        let filename: string = null;
        let directory: string = null;

        if (fullPath) {
            filename = path.basename(fullPath);
            directory = path.dirname(fullPath);
        }

        return {filename, directory};
    }

    async getFilesToDelete(files: FileInformation[] | string, keep: number, keepPattern: string): Promise<FileInformation[]> {

        return new Promise(async resolve => {

            let allFiles = Array.isArray(files) ? files.slice(0) : await this.getFilesInFolder(files);
            allFiles = keepPattern ? allFiles.filter(f => f).filter(f => isSimpleMatch( path.basename(f.fullName), keepPattern )) : allFiles.slice(0);

            allFiles.sort((a, b) => {
                if (a.created.getTime() !== b.created.getTime()) {
                    return a.created.getTime() < b.created.getTime() ? 1 : -1;
                }
                return 0;
            });
        
            resolve(allFiles.slice(keep));
        });
    }

    async getFilesInFolder(path: string): Promise<FileInformation[]> {
        const self = this;
        return new Promise(resolve => {
            const files: FileInformation[] = [];

            fs.readdir(path, function(err, items) {
                for (var i=0; i<items.length; i++) {
                    const fullpath = self.join(path, items[i]);
                    const { birthtime } = fs.statSync(fullpath); 
                    files.push({
                      fullName: fullpath,
                      created: new Date(birthtime)
                    });
                }
                resolve(files);
            });
        });
    }

    delete(filename: string): void {
        fs.unlinkSync(filename);
    }

    getBasename(value: string): string {
        return path.basename(value);
    }

    getDirectoryName(value: string): string {
        return path.dirname(value);
    }

    async glob(pattern: string): Promise<string[]> {
        return await globby(pattern);
    }

}
