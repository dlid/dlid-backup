/*
  
    https://global.download.synology.com/download/Document/Software/DeveloperGuide/Package/FileStation/All/enu/Synology_File_Station_API_Guide.pdf#page=9&zoom=auto,-278,769

*/
import { TargetBase } from "../../types/TargetBase.type";
import { ConfigurableSettingType, ConfigurableSetting, TargetArguments } from "../../types";
import { TargetError, ParameterException } from "../../exceptions";
import path = require("path");
import { FileInformation } from '../../types/FileInformation.type';
import { getFilesToDelete } from '../../util/getFilesToDelete.function';
import axios = require('axios')
import { Logger, logger } from "../../util";
import { create } from "archiver";
import fs = require('fs');
import FormData = require('form-data');




export class SynologyFilestationTarget extends TargetBase {
    description: string = 'Save backup to a Synology NAS Filestation';
    name: string = 'filestation';

    private baseUri: string;
    private sid: string;

    private username: string;
    private password: string;
    private log: Logger;

    constructor() {
        super();
        this.log = logger.child(this.constructor.name);
    }


    async run(args: TargetArguments): Promise<any> {
        
      return new Promise(async (resolve, reject) => {
          
            try {
    
                let host = (args.options['host'] || '') as string;
                this.username = (args.options['username'] || '') as string;
                this.password = (args.options['password'] || '') as string;
                let filename = (args.config.macros.format(args.options['filename']) || '') as string;
                let folder = (args.config.macros.format(args.options['folder']) || '') as string;
                folder = '/' + folder.replace(/\\/g, '\/').replace(/\/{2, }/, '/').replace(/^\//, '').replace(/\/$/, '');

                host = host.replace(/\/+$/, '');

                this.log.info(`Preparing to send to Synology NAS server`);
                this.log.debug(`Target folder is "${folder}" at "${host}"`);

                if (!host.match(/^https?:\/\//)) {
                    throw new ParameterException('-t.host', host, 'Must start with http:// or https://')
                }

                this.baseUri = `${host}/webapi/`;

                const share = folder.substr(1).split('/')[0];

                const auth = await this.login();
    
              //   const sharedFolders = await this.getSharedFolders();
  
                const xa = await this.getPathInfo(folder);
                const targetFolderInfo = xa.data.files.find(f => f.path === folder);

                if (targetFolderInfo && targetFolderInfo.exists) {
                    this.log.debug(`Found target folder on NAS: ${targetFolderInfo.real_path}`);
                } else {
                    this.log.debug(`Folder "${folder}" was not found`);
                    await this.ensureFolder(targetFolderInfo.path);
               }

               await this.uploadFile(folder, args.archiveFilename, filename);

                // const rootShare = sharedFolders.data.shares.find(s => s.name === share && s.isdir);

                // if (!rootShare) {
                //     throw new TargetError(this.constructor.name, `Could not find shared folder "${share}"`, '');
                // }

                // console.log("SHARE", share);
                



            // var serviceAccountKey = args.options['key-filename'];
            // var databaseUrl = args.options['db-url'];
            // var bucketName = args.options['bucket'];
          

            // var serviceAccount = require(serviceAccountKey);
            
            // admin.initializeApp({
            //   credential: admin.credential.cert(serviceAccount),
            //   databaseURL: databaseUrl
            // });

            // var bucket = admin.storage().bucket(bucketName);

            // const bucketExists = await bucket.exists();

            // if (!bucketExists) {
            //   throw new TargetError(this.constructor.name, 'Firestore bucket does not exist ' + bucketName);
            //   // await admin.storage().bucket().create(bucketName);
            // }

            // let targetFilename = args.config.macros.format(args.options['filename']);
            // let targetFolder = args.config.macros.format(args.options['filename']);
            // if (!targetFilename.endsWith('.zip')) { targetFilename += '.zip'; }

            // let targetPath = args.config.macros.format(args.options['folder'] || '');

            // targetPath = targetPath.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
            // if (targetPath === '/' || targetPath === '') {
            //   targetPath = '';
            // } else if (!targetPath.endsWith('/')) {
            //   targetPath += '/';
            // }

            // console.log("SAVE TO", targetPath, targetFilename);
            
            // await this.uploadFile(bucket, args.archiveFilename, targetPath + targetFilename)
            
            // // Cleanup
            // let keep = parseInt(args.options['keep'], 10);
            // let keepPattern = args.options['keep-match'];
            // if (keep > 0) {
            //   await this.cleanup(bucket, targetPath, keep, keepPattern)
            // }
           

          } catch (e) {
            return reject(e);
          }

          resolve();
      });
    }

    private getBaseUrl(path: string, params: any, options?: { noSid: boolean }) {
        params = params || {};

        if (params._sid) {
            delete params._sid;
        }

        if (this.sid && !options?.noSid) {
            params._sid = this.sid;
        }

        

        path = path.replace(/^\/+/, '');

        let querystringArray: string[] = [];
        Object.keys(params).forEach(paramName => {
            querystringArray.push(`${encodeURIComponent(paramName)}=${encodeURIComponent(params[paramName])}`);
        });

        let querystring = querystringArray.length > 0 ? `?${querystringArray.join('&')}` : '';
        
        return `${this.baseUri}${path}${querystring}`;

    }

    private async login(): Promise<SynologyAuthResponse> {

        this.log.debug(`Logging in to Synology NAS Server...`);
        return new Promise((resolve, reject) => {

            const url = this.getBaseUrl('/auth.cgi', { 
                api: 'SYNO.API.Auth',
                'version': 3,
                'method': 'login',
                'account': this.username,
                'passwd': this.password,
                'session': 'FileStation',
                'format': 'cookie'
             });

            axios.default.get<SynologyAuthResponse>(url).then(result => {
                this.sid = result.data?.data?.sid;
                if (this.sid) {
                    this.log.info(`Successfully logged in`);
                    resolve(result.data);
                } else {
                    reject(new TargetError(this.constructor.name, 'Login did not return a SID value', JSON.stringify(result.data)));
                }
            }, err => {
                if (err.response?.status === 403) {
                    reject(new TargetError(this.constructor.name, 'Login request responsed with 403 Forbidden'));
                } else {
                    reject(new TargetError(this.constructor.name, 'Error when logging in to NAS server', err));
                }
                reject(err);
            });
        });
    }

    private async getApis() {
        return new Promise((resolve, reject) => {
            console.log("getApis...");
        });
    }

    private async ensureFolder(path: string): Promise<SynologyGetInfoItem> {
        const parts = path.split('/').filter(f => f);
        const name = parts[parts.length - 1];

        let folder_path = '/' + parts.slice(0, parts.length -1).join('/').replace(/\/$/, '').replace(/^\//, '');

        this.log.debug(`Creating folder "${name}" in path "${folder_path}"...`);

        return new Promise((resolve, reject) => {
            const url = this.getBaseUrl('/entry.cgi', { 
                api: 'SYNO.FileStation.CreateFolder',
                'version': 1,
                'method': 'create',
                folder_path: `"${folder_path}"`,
                force_parent: true,
                name: `"${name}"`
             });

             this.log.debug(`Invoking URL ${url}`);

             axios.default.get(url).then(result => {
                
                if (result.data.success === true) {
                    this.log.debug(`Success`, JSON.stringify(result?.data));
                    return resolve({ 
                        isdir: result.data?.data?.folders[0].isdir,
                        name: result.data?.data?.folders[0].name,
                        path: result.data?.data?.folders[0].name
                    } as SynologyGetInfoItem);
                } else {
                    this.log.debug(`Request failed`, result.data);
                    return reject(result.data);
                }
            }, err => {
                reject(err);
            });
        });
    }

    private async getPathInfo(path: string): Promise<SynologyGetInfoResponse> {
        return new Promise((resolve, reject) => {
            const url = this.getBaseUrl('/entry.cgi', { 
                api: 'SYNO.FileStation.List',
                'version': 1,
                'method': 'getinfo',
                path: path,
                'additional': ['real_path', 'size', 'type', 'ctime', 'mtime', 'crtime', 'atime'].join(',')
             });

             axios.default.get<{ error?: { code: string  }, success: boolean, data: { files: {
                 code?: number;
                 isdir: boolean;
                 name?: string;
                 path: string,
                 type?: string,
                 additional?: {
                     real_path: string;
                     size: number;
                     time: {
                         atime: number;
                         mtime: number;
                         ctime: number;
                         crtime: number;
                     }

                 }
             }[] }  }>(url).then(result => {
                if (result.data.success) {

                    let data: SynologyGetInfoResponse = {
                        success: true,
                        data: {
                            files: result.data.data.files.map(m => {
                                return {
                                    size: m.additional?.size,
                                    accessed: m.additional?.time ? new Date(m.additional.time.atime * 1000) : null,
                                    created: m.additional?.time ? new Date(m.additional.time.crtime * 1000) : null,
                                    modified: m.additional?.time ? new Date(m.additional.time.mtime * 1000) : null,
                                    changed: m.additional?.time ? new Date(m.additional.time.ctime * 1000) : null,
                                    isdir: m.isdir,
                                    name: m.name,
                                    path: m.path,
                                    real_path: m.additional?.real_path,
                                    type: m.type,
                                    code: m.code,
                                    exists: m.code === 418 || m.code === 408 ? false : true
                                } as SynologyGetInfoItem;
                            })                     
                        }
                    };
                    resolve(data);
                }


                resolve(result.data);
            }, err => {
                if (err.response?.status === 403) {
                    reject(new TargetError(this.constructor.name, 'Login request responsed with 403 Forbidden'));
                } else {
                    reject(new TargetError(this.constructor.name, 'Error when logging in to NAS server', err));
                }
                reject(err);
            });

        });
    }

    private async cleanup(bucket: any, directory: string, keep: number, keepPattern: string) {
    //   return new Promise(async (resolve, reject) => {
    //     try {
    //       const files = await bucket.getFiles({
    //         directory: directory
    //       })

    //       if (files.length > 0) {
    //         const fileInformationList = files[0].map(fa => {
    //           return {
    //             fullName: fa.name,
    //               created: new Date(fa?.metadata?.timeCreated),
    //               id: fa.id
    //           } as FileInformation;
    //         });
            
    //         const filesToDelete = getFilesToDelete(fileInformationList, keep, keepPattern);
            
    //         for( var i=0; i < filesToDelete.length; i++) {
    //           const file = filesToDelete[i];
    //           await bucket.file(file.fullName)
    //           .delete().then(deletedFile => {
    //               console.log("[deleteHistory] deleted", file.fullName);
    //           }).catch(er => {
    //               console.log("[deleteHistory] ERROR deleting file", file.fullName);
    //           })
  
    //         } 


    //       }
    //     } catch(e) {
    //       reject(e);
    //     }
    //   });
    }

    async uploadFile(folder: string, pathToFile: string, targetFilename: string) {
      return new Promise(async (resolve, reject) => {
            
        
        const url = this.getBaseUrl('/entry.cgi', { 
            // api: 'SYNO.FileStation.Upload',
            // version: 1,
            // method: 'upload'
         }, {noSid: true});

        var stream = fs.createReadStream(pathToFile);
        
        const form_data = new FormData();
        form_data.append('api', 'SYNO.FileStation.Upload');
        form_data.append('version', '1');
        form_data.append('method', 'upload');
        form_data.append('path', folder);
        form_data.append('create_parents', "true");
        form_data.append('_sid', this.sid);

        // const writeStream = fs.createWriteStream('./file.txt');
        //var x = new Blob([fs.readFileSync(pathToFile)]);
//        form_data.append('file', <any>stream, targetFilename);
form_data.append('file', fs.readFileSync(pathToFile), targetFilename);

        let headers = form_data.getHeaders();
        
        const request_config = {
          headers: headers
        };

        this.log.info(`Uploading to ${folder}/${targetFilename}`);

        // form_data.pipe(writeStream);
this.log.info('url', url);
        await axios.default.post(url, form_data, request_config).then(ok => {
            console.log("OK", ok);
        }, err => {
            console.log("ERR", err.code, err.message);
        });

      })
  }


    explain(options: any): string[] {
      return [
      ];
    }
    getOptions(): ConfigurableSetting[] {
        return [
            {
                key: 'folder',
                type: ConfigurableSettingType.MacroString,
                isRequired: true,
                description: 'Firestore file path where to save backups'
            },
            {
                key: 'filename',
                type: ConfigurableSettingType.MacroString,
                isRequired: true,
                description: 'The filename to save'
            },
            {
                key: 'host',
                type: ConfigurableSettingType.String,
                isRequired: true,
                description: 'The host and port to Synology NAS'
            },
            {
                key: 'username',
                type: ConfigurableSettingType.MacroString,
                isRequired: true,
                description: 'The username'
            },
            {
                key: 'password',
                type: ConfigurableSettingType.MacroString,
                isRequired: true,
                description: 'The password'
            },
            {
                key: 'keep',
                type: ConfigurableSettingType.Int,
                isRequired: false,
                description: 'The number of files to keep in target location'
            },
            {
                key: 'keep-match',
                type: ConfigurableSettingType.String,
                isRequired: false,
                description: 'Only list files matching this pattern when deciding what to keep',
                examples: {
                  "-t.keep-match=prefix_*": "Includes files starting with prefix_",
                  "-t.keep-match=*_sufix": "Includes files ending with _sufix",
                }
            }
        ];
    }
}



export interface SynologyAuthResponse {
    data: {
        sid: string;
    },
    success: boolean;
}

export interface SynologyListShareResponse {
    data: {
        shares: {
            isdir: boolean;
            name: string;
            path: string;
        }[]
    },
    success: boolean;
}

export interface SynologyGetInfoResponse {
    data: {
        files: SynologyGetInfoItem[];
    },
    success: boolean;
}

export interface SynologyGetInfoItem {
    isdir: boolean;
    name?: string;
    path?: string;
    real_path?: string;
    size?: number;
    type?: string;
    accessed?: Date; // additional.atime * 1000 
    created?: Date;  // additional.crtime * 1000 
    changed?: Date;  // additional.ctime * 1000 
    modified?: Date; // additional.mtime * 1000 
    exists?: boolean;
    code?: number;
}