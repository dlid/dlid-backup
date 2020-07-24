import * as fs from 'fs';
var path = require('path');
import { create } from 'archiver';
import { WriteStream } from 'tty';
import { logger, Logger } from '../util';

export class Archive {

  zip: any;
  output: fs.WriteStream;

  closed: boolean = false;
  ended: boolean = false;
  finished: boolean = false;

  log: Logger;

  private zipFilename: string;
  
  constructor(filename: string) {
    this.zipFilename = filename;
    this.log = logger.child(this.constructor.name);
    const self = this;
    this.log.debug(`Initializing archive ${this.zipFilename}`);
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
  }


  public get filename(): String {
    return this.zipFilename;
  }

  addString(filenameInArchive: string, fileContent: string, comment: string = null) {
    this.zip.append(fileContent, { name: filenameInArchive });
  }

  addLocalFile(localFilePath: string, zipFilename: string = null) {
    if (!zipFilename) {
      zipFilename = path.basename(localFilePath);
    }
    this.zip.file(localFilePath, { name: zipFilename });
  }

  addLocalFolder(localFilePath: string, targetDirName: string = null) {
    this.zip.directory(localFilePath, targetDirName);
   // this.zip.addLocalFolder(localFilePath, zipDirectory);
  }

  bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    const v = Math.floor(Math.log(bytes) / Math.log(1024))
    var i = parseInt( v.toString()  );
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
 };

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

  private discarded = false;

  async discard() {
    this.discarded = true;
    const self = this;
    return new Promise((resolve, reject) => {
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