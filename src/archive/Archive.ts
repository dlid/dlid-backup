import * as fs from 'fs';
var path = require('path');
import { create } from 'archiver';
import { WriteStream } from 'tty';
import { logger, Logger } from '../util';
import { DlidBackupError } from '../exceptions';

export class Archive {

  private zip: any;
  private output: fs.WriteStream;

  private closed: boolean = false;
  private ended: boolean = false;
  private finished: boolean = false;
  private initialized = false;
  private log: Logger;

  private zipFilename: string;
  
  constructor(filename: string) {
    this.zipFilename = filename;
    this.log = logger.child(this.constructor.name);
    
  }

  public get isInitialized(): boolean {
    return this.initialized;
  }

  private initializeArchive() {
    if (this.initialized) {
      return;
    }
    const self = this;
    this.log.debug(`Opening archive ${this.zipFilename}`);
    this.output = fs.createWriteStream(this.zipFilename);
    this.zip = create('zip', {
      zlib: { level: 9 }
    });

    this.output.on('close', function() {
      if (self.discarded) {
        self.log.debug('Closing empty archive stream');
      } else {
        self.log.info('Archive saved (' + self.bytesToSize(self.zip.pointer()) + ')');
      }
      self.closed = true;
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    this.output.on('end', function() {
      console.log('end Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    this.zip.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.log("WARNING", err);
        // log warning
      } else {
        self.log.trace(`Archive error`, err);
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    this.zip.on('error', function(err) {
      throw err;
    });

    this.zip.pipe(this.output);
    this.initialized = true;
  }


  public get filename(): string {
    return this.zipFilename;
  }

  addString(filenameInArchive: string, fileContent: string, zipPath: string = null, comment: string = null) {
    this.initializeArchive();
    this.zip.append(fileContent, { name: filenameInArchive, prefix: zipPath });
  }

  addLocalFile(localFilePath: string, targetFileAndPath: string = null) {
    this.initializeArchive();
    this.zip.file(localFilePath, { prefix: targetFileAndPath });
  }

  addLocalFolder(localFilePath: string, targetDirName: string = null) {
    this.initializeArchive();
    this.log.debug(`addLocalFolder`, localFilePath, targetDirName);
    this.zip.directory(localFilePath, targetDirName);
   // this.zip.addLocalFolder(localFilePath, zipDirectory);
  }

  private bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    const v = Math.floor(Math.log(bytes) / Math.log(1024))
    var i = parseInt( v.toString()  );
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
 };

  async save() {
    const self = this;
    return new Promise((resolve, reject) => {
      if (this.initialized) {
        this.log.info(`Creating ${this.filename}...`);
        this.zip.finalize();
        const inter = setInterval(() => {
          if (self.closed) {
            clearInterval(inter);
            resolve();
          }
        }, 500);
      } else {
        reject(new DlidBackupError('archive', 'Attempting to save non-initialized archive', ''));
      }
    });
  }

  private discarded = false;

  async discard() {
    this.discarded = true;
    const self = this;
    return new Promise((resolve, reject) => {
      if (!this.initialized) {
        return resolve();
      }
      this.zip.finalize();
      const inter = setInterval(() => {
        if (self.closed) {
          clearInterval(inter);
          if (fs.existsSync(this.zipFilename)) {
            try {
              fs.unlinkSync(this.zipFilename);
              self.log.debug('Temporary file was deleted');
            } catch(e) {
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