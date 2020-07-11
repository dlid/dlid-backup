import * as fs from 'fs';
var path = require('path');
import { create } from 'archiver';
import { WriteStream } from 'tty';

export class Archive {

  zip: any;
  output: fs.WriteStream;

  closed: boolean = false;
  ended: boolean = false;
  finished: boolean = false;
  
  constructor(private filename: string) {
    const self = this;
    console.log(this.filename);
    this.output = fs.createWriteStream(this.filename);
    this.zip = create('zip', {
      zlib: { level: 9 }
    });

    this.output.on('close', function() {
      // console.log(self.bytesToSize(self.zip.pointer()) + ' total bytes');
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

  addString(filenameInArchive: string, fileContent: string, comment: string = null) {
    this.zip.append(fileContent, { name: filenameInArchive });
  }

  addLocalFile(localFilePath: string, zipDirectory: string = null) {
   this.zip.file(localFilePath, { name: path.basename(localFilePath) });
  }

  addLocalFolder(localFilePath: string, zipDirectory: string = null) {
    this.zip.directory(localFilePath, 'logs');
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
    const self = this;
    return new Promise((resolve, reject) => {
      // this.zip.writeZip(filename);
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
    const self = this;
    return new Promise((resolve, reject) => {
      this.zip.finalize();
      const inter = setInterval(() => {
        if (self.closed) {
          clearInterval(inter);
          if (fs.existsSync(this.filename)) {
            try {
              fs.unlinkSync(this.filename);
            } catch(e) {}
          }
          resolve();
        }
      }, 500);
    });
  }



}