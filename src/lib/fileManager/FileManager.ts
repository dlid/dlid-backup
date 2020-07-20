import fs = require('fs');
import { logger, Logger } from '../../util';
import { FileManagerInterface } from './FileManagerInterface';


export class FileManager implements FileManagerInterface {

    private log: Logger;

    constructor() {
        this.log = logger.child(this.constructor.name);
    }

    readTextSync(filename: string): string {
        this.log.debug(`Reading file ${filename}`);
        try {
            fs.readFileSync
        } catch (e) {
            // Let's just return undefined in case of error
            this.log.debug(`Error reading file`, e);
        }
        return undefined;
    }
}