// import { TargetBase } from "../../types/TargetBase.type";
// import { ConfigurableSettingType, ConfigurableSetting, TargetArguments } from "../../types";
// import  { stringify } from 'yaml'
// import * as admin from 'firebase-admin';
// import { TargetError } from "../../exceptions";
// // import { Bucket } from 'firebase_admin/node_modules/@google-cloud/storage';
// import path = require("path");
// import { FileInformation } from '../../types/FileInformation.type';
// import { getFilesToDelete } from '../../util/getFilesToDelete.function';


// export class FireStoreTarget extends TargetBase {
//     description: string = 'Save backup to Google FireStore';

//     name: string = 'firebase';

//     async run(args: TargetArguments): Promise<any> {
//       return new Promise(async (resolve, reject) => {
          
//             try {

  

//             var serviceAccountKey = args.options['key-filename'];
//             var databaseUrl = args.options['db-url'];
//             var bucketName = args.options['bucket'];
          

//             var serviceAccount = require(serviceAccountKey);
            
//             admin.initializeApp({
//               credential: admin.credential.cert(serviceAccount),
//               databaseURL: databaseUrl
//             });

//             var bucket = admin.storage().bucket(bucketName);

//             const bucketExists = await bucket.exists();

//             if (!bucketExists) {
//               throw new TargetError(this.constructor.name, 'Firestore bucket does not exist ' + bucketName);
//               // await admin.storage().bucket().create(bucketName);
//             }

//             let targetFilename = args.config.macros.format(args.options['filename']);
//             let targetFolder = args.config.macros.format(args.options['filename']);
//             if (!targetFilename.endsWith('.zip')) { targetFilename += '.zip'; }

//             let targetPath = args.config.macros.format(args.options['folder'] || '');

//             targetPath = targetPath.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
//             if (targetPath === '/' || targetPath === '') {
//               targetPath = '';
//             } else if (!targetPath.endsWith('/')) {
//               targetPath += '/';
//             }

//             console.log("SAVE TO", targetPath, targetFilename);
            
//             await this.uploadFile(bucket, args.archiveFilename, targetPath + targetFilename)
            
//             // Cleanup
//             let keep = parseInt(args.options['keep'], 10);
//             let keepPattern = args.options['keep-match'];
//             if (keep > 0) {
//               await this.cleanup(bucket, targetPath, keep, keepPattern)
//             }
           

//           } catch (e) {
//             reject(e);
//           }

//           resolve();
//       });
//     }

//     private async cleanup(bucket: any, directory: string, keep: number, keepPattern: string) {
//       return new Promise(async (resolve, reject) => {
//         try {
//           const files = await bucket.getFiles({
//             directory: directory
//           })

//           if (files.length > 0) {
//             const fileInformationList = files[0].map(fa => {
//               return {
//                 fullName: fa.name,
//                   created: new Date(fa?.metadata?.timeCreated),
//                   id: fa.id
//               } as FileInformation;
//             });
            
//             const filesToDelete = getFilesToDelete(fileInformationList, keep, keepPattern);
            
//             for( var i=0; i < filesToDelete.length; i++) {
//               const file = filesToDelete[i];
//               await bucket.file(file.fullName)
//               .delete().then(deletedFile => {
//                   console.log("[deleteHistory] deleted", file.fullName);
//               }).catch(er => {
//                   console.log("[deleteHistory] ERROR deleting file", file.fullName);
//               })
  
//             } 


//           }
//         } catch(e) {
//           reject(e);
//         }
//       });
//     }

//     async uploadFile(bucket: any, filename: string, destination: string) {
//       return new Promise((resolve, reject) => {
//           bucket.upload(filename, {
//               destination: destination,
//               // Support for HTTP requests made with `Accept-Encoding: gzip`
//               gzip: true,
//               metadata: {
//                   // Enable long-lived HTTP caching headers
//                   // Use only if the contents of the file will never change
//                   // (If the contents will change, use cacheControl: 'no-cache')
//                   cacheControl: 'public, max-age=31536000',
//               },
//           }).then(ok => {
//               console.log(`[upload] ${filename} uploaded to ${destination}`);
//               resolve();
//           }).catch(e => {
//               console.log(`[upload] ERROR ${filename} uploaded to ${destination}`);
//               console.error(e);
//               reject(e);
//           })
//       })
//   }


//     explain(options: any): string[] {
//       return [
//         `Save in Google Firestore`,
//         `the destination path is ${options['folder']}`
//       ];
//     }
//     getOptions(): ConfigurableSetting[] {
//         return [
//             {
//                 key: 'folder',
//                 type: ConfigurableSettingType.MacroString,
//                 isRequired: false,
//                 description: 'Firestore file path where to save backups'
//             },
//             {
//                 key: 'filename',
//                 type: ConfigurableSettingType.MacroString,
//                 isRequired: true,
//                 description: 'The filename to save'
//             },
//             {
//                 key: 'key-filename',
//                 type: ConfigurableSettingType.FilePath,
//                 isRequired: true,
//                 description: 'The path to the '
//             },
//             {
//               key: 'db-url',
//               type: ConfigurableSettingType.String,
//               isRequired: true,
//               description: 'The path to the '
//             },
//             {
//                 key: 'bucket',
//                 type: ConfigurableSettingType.String,
//                 isRequired: true,
//                 description: 'The Storage Bucket name '
//             },
//             {
//                 key: 'keep',
//                 type: ConfigurableSettingType.Int,
//                 isRequired: false,
//                 description: 'The number of files to keep in target location'
//             },
//             {
//                 key: 'keep-match',
//                 type: ConfigurableSettingType.String,
//                 isRequired: false,
//                 description: 'Only list files matching this pattern when deciding what to keep',
//                 examples: {
//                   "-t.keep-match=prefix_*": "Includes files starting with prefix_",
//                   "-t.keep-match=*_sufix": "Includes files ending with _sufix",
//                 }
//             }
//         ];
//     }
// }

