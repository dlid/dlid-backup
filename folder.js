// https://medium.com/@stardusteric/nodejs-with-firebase-storage-c6ddcf131ceb
const express = require('express');
const app = express();
const fs = require('fs');
const moment = require('moment');
var AdmZip = require('adm-zip');
const upload = require('./upload');
const zlib = require('zlib');
const path = require('path');
const os = require('os');

// backup files daily. Keep 5 days of history
// node .\folder.js --folder="C:\Users\david\Documents\GitHub\dlid.se\files" --dateformat="YYYY-MM-DD" -z="dlid-files" -p="files/dlid-files" -keep 5


// creating archives
var zip = new AdmZip();
    
var paramDef = {'dateformat': true, 'zipname' : true, 'path' : true, 'keep': true, 'folder': true},
    paramAliases = {'d': 'dateformat', 'z' : 'zipname', 'p':'path', 'k' : 'keep', 'f':'folder'},
    params = process.argv.slice(2).reduce((px, p) => {
        p = p.indexOf('--') === 0 ? p = p.substr(2) : p;
        p = p.indexOf('-') === 0 ? p = p.substr(1) : p;
        
        var d = p.split('=', 2),
            paramName = d[0],
            value = d.length > 1 ? d[1] : true;
        if (paramAliases[paramName]) paramName = paramAliases[paramName];
        px[paramName] = value;
        return px;

    }, {});

if (!params.dateformat) {
    params.dateformat = `YYYY-MM-DD`;
}

if (!params.zipname) params.zipname = null;
if(params.path) {
    if (params.path[params.path.length-1] !== '/')
        params.path+='/';
} else {
    params.path = "";
}

params.keep = parseInt(params.keep, 10);
if(isNaN(params.keep)) params.keep = 1;

var walkSync = function(dir, filelist, root = null) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    root = root || dir;
    files.forEach(function(file) {
      if (fs.statSync(dir + path.sep + file).isDirectory()) {
        filelist = walkSync(dir + path.sep + file, filelist, root);
      }
      else {
          var name = (dir + path.sep + file).replace(root, '');

          if (name.indexOf('\\')===0) name = name.substr(1);
        filelist.push( {
            filename: dir + path.sep + file,
            name: name
        });
      }
    });
    return filelist;
  };


var zip = new AdmZip();

console.log("[folder] Backing up folder " + params.folder);
const zipName = `${moment().format(params.dateformat)}_${params.zipname}.zip`;
var zipFilename = os.tmpdir + path.sep + zipName;
console.log("[folder] zipping to " + zipFilename);
zip.addLocalFolder(params.folder);
zip.writeZip(zipFilename);
const stats = fs.statSync(zipFilename)
const fileSizeInBytes = stats.size;
console.log(`[folder] OK ${fileSizeInBytes} bytes (${bytesToSize(fileSizeInBytes)})`);
console.log(`[folder] Uploading to ${params.path}${zipName}`);

upload.uploadFile(zipFilename, params.path).then(async () => {


    console.log(`[db] Cleaning up history in ${params.path}. Keeping ${params.keep} file(s)`)
    await upload.deleteHistory(params.path, params.keep).then(() => {
        }).catch(e => {
            console.log(`Error cleaning up history`,e)
        });

    fs.unlinkSync(zipFilename);
    console.log(`[folder] Deleting local zip file`);

}).catch(fe => {
    console.log("[db] error uploading file", fe);
})



function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};