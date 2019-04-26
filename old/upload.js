
const firebase = require('firebase');
const  { Storage } = require('@google-cloud/storage');
const Multer = require('multer');
const moment = require('moment');
const os = require('os');


const storage = new Storage({
    projectId: "dlid-backup", //<Firebase Project ID",
    keyFilename: `${__dirname}/dlid-backup-firebase-adminsdk-rnbg4-8dd874e54e.json`
});

const bucket = storage.bucket("dlid-backup.appspot.com");

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // no larger than 20mb, you can change as needed.
    }
});


async function uploadFile(filename, destination) {
    return new Promise((resolve, reject) => {
        bucket.upload(filename, {
            destination: destination,
            // Support for HTTP requests made with `Accept-Encoding: gzip`
            gzip: true,
            metadata: {
                // Enable long-lived HTTP caching headers
                // Use only if the contents of the file will never change
                // (If the contents will change, use cacheControl: 'no-cache')
                cacheControl: 'public, max-age=31536000',
            },
        }).then(ok => {
            console.log(`[upload] ${filename} uploaded to ${destination}`);
            resolve();
        }).catch(e => {
            console.log(`[upload] ERROR ${filename} uploaded to ${destination}`);
            console.error(e);
            reject(e);
        })
    })
}

/**
* Delete files from the target path
* Keep at most 'filesToKeep' files
* Oldest files will be deleted first
*/
async function deleteHistory(destination, filesToKeep) {
    filesToKeep = parseInt(filesToKeep, 10);

    if (filesToKeep < 1) throw "filesToKeep must be 1 or larger";
    console.log(`[deleteHistory] Enumerating existing files`);

    await listFiles(destination).then(fileList => {

        const orderedFiles = fileList.sort((a,b) => {
            var ad = new Date(a.created);
            var bd = new Date(b.created);
            if (ad.getTime() < bd.getTime()) return -1;
            else if (ad.getTime() > bd.getTime()) return 1;
            return 0;
        })
        let filesToDelete = [];

        if (orderedFiles.length > filesToKeep) {
            filesToDelete = orderedFiles.slice(0, orderedFiles.length - filesToKeep );
        }

        filesToDelete.forEach(async file => {
            await bucket.file(file.name)
                .delete().then(deletedFile => {
                    console.log("[deleteHistory] deleted", destination, file.name);
                }).catch(er => {
                    console.log("[deleteHistory] ERROR deleting file", destination,file.name);
                })
        })

        console.log(`[deleteHistory] Cleanup complete`);


    }).catch(e => {
        console.log("[deleteHistory] error listing files");
    })
    
}


async function listFiles(destination) {
    
    return new Promise((resolve, reject) => {
        bucket.getFiles({
            directory: destination
        }).then(files => {
            
            storage.r
            var fileList = files[0].map((f) => {
                return {
                    name: f.name,
                    created: f.metadata.timeCreated,
                    id: f.id
                }
            });
            
            resolve(fileList)
            
        }).catch(e => {
            console.log("[listFiles] error", e);
            reject(e);
        })
    })
}

listFiles();

module.exports = {
    
    uploadFile: uploadFile,
    deleteHistory: deleteHistory
    
    
}