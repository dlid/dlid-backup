"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Archive = void 0;
const fs = require("fs");
var path = require('path');
const archiver_1 = require("archiver");
const util_1 = require("../util");
class Archive {
    constructor(filename) {
        this.filename = filename;
        this.closed = false;
        this.ended = false;
        this.finished = false;
        this.discarded = false;
        this.log = util_1.logger.child(this.constructor.name);
        const self = this;
        this.log.debug(`Initializing archive ${this.filename}`);
        this.output = fs.createWriteStream(this.filename);
        this.zip = archiver_1.create('zip', {
            zlib: { level: 9 }
        });
        this.output.on('close', function () {
            if (self.discarded) {
                self.log.debug('Closing empty archive stream');
            }
            else {
                self.log.info('Archive saved (' + self.bytesToSize(self.zip.pointer()) + ')');
            }
            self.closed = true;
        });
        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        this.output.on('end', function () {
            console.log('end Data has been drained');
        });
        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        this.zip.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                console.log("WARNING", err);
                // log warning
            }
            else {
                self.log.trace(`Archive error`, err);
                // throw error
                throw err;
            }
        });
        // good practice to catch this error explicitly
        this.zip.on('error', function (err) {
            throw err;
        });
        this.zip.pipe(this.output);
    }
    addString(filenameInArchive, fileContent, comment = null) {
        this.zip.append(fileContent, { name: filenameInArchive });
    }
    addLocalFile(localFilePath, zipFilename = null) {
        if (!zipFilename) {
            zipFilename = path.basename(localFilePath);
        }
        this.zip.file(localFilePath, { name: zipFilename });
    }
    addLocalFolder(localFilePath, targetDirName = null) {
        this.zip.directory(localFilePath, targetDirName);
        // this.zip.addLocalFolder(localFilePath, zipDirectory);
    }
    bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0)
            return '0 Byte';
        const v = Math.floor(Math.log(bytes) / Math.log(1024));
        var i = parseInt(v.toString());
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    }
    ;
    async save() {
        this.log.info(`Finalizing ${this.filename}...`);
        const self = this;
        return new Promise((resolve, reject) => {
            this.zip.finalize();
            const inter = setInterval(() => {
                if (self.closed) {
                    clearInterval(inter);
                    resolve();
                }
            }, 500);
        });
    }
    async discard() {
        this.discarded = true;
        const self = this;
        return new Promise((resolve, reject) => {
            this.zip.finalize();
            const inter = setInterval(() => {
                if (self.closed) {
                    clearInterval(inter);
                    if (fs.existsSync(this.filename)) {
                        try {
                            fs.unlinkSync(this.filename);
                            self.log.debug('Temporary file was deleted');
                        }
                        catch (e) {
                            self.log.info(`Error deleting temporary file`, e);
                        }
                    }
                    self.log.debug(`Archive file discarded`);
                    resolve();
                }
            }, 500);
        });
    }
}
exports.Archive = Archive;
