import fs = require('fs');
import path = require('path');
import { logger, Logger } from '../../util';
import { FileManagerInterface } from './FileManagerInterface';


export class FileManager implements FileManagerInterface {

    private log: Logger;

    constructor() {
        this.log = logger.child(this.constructor.name);
    }

    resolvePath(val: string): string {
        try {
            return path.resolve(val);
        } catch (e) {
            this.log.debug(`Could not resolve path ${val}`, e);
        }
        return val;
    }

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

}
