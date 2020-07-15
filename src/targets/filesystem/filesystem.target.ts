import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { TargetBase } from "../../types/TargetBase.type";
import { TargetArguments } from "../../types";
import * as fs from "fs";
import path = require("path");
import { TargetError } from "../../exceptions";
import { Logger, logger } from "../../util";
import { isSimpleMatch } from './../../util/isSimpleMatch.function'

export class FileSystemTarget extends TargetBase implements Configurable {
    description: string = 'Save backup to filesystem';
    name: string = 'filesystem';
    log: Logger;

    constructor() {
      super();
      this.log = logger.child(this.constructor.name);
    }
  
    async run(args: TargetArguments): Promise<any> {

  console.log("TARGET BABY");

      return new Promise(async (resolve, reject) => {
          
          let targetFolder = args.config.macros.format(args.options['folder']);
          let targetFilename = args.config.macros.format(args.options['filename']);

          targetFolder = targetFolder.replace(/\\/g, '/');

          if (!targetFilename.endsWith('.zip')) {
            targetFilename+= '.zip';
          }

          try {
            if (!fs.existsSync(targetFolder)) {
              fs.mkdirSync(targetFolder, { recursive: true});
            }
          } catch(e) {
            return reject(new TargetError(this.constructor.name, 'Could not create destination folder', e.toString()));
          }


          let finalDestination = path.join(targetFolder, targetFilename);

          try {
            fs.copyFileSync(args.archiveFilename, finalDestination);
          } catch(e) {
            return reject(new TargetError(this.constructor.name, 'Could not copy file to destination', e.toString()));

          }

          const keep = parseInt(args.options['keep'], 10);
          const keepPattern = args.options['keep-match'];
          if (keep > 0) {
            await this.cleanup(targetFolder, keep, keepPattern);
          }


        

          resolve();
      });
    }

    private async cleanup(folder: string, keep: number, keepPattern: string): Promise<void> {
      const self = this;

      return new Promise((resolve, reject) => {
        const files: {filename: string, created: Date}[] = [];

        fs.readdir(folder, function(err, items) { 

            for (var i=0; i<items.length; i++) {

              if (keepPattern && !isSimpleMatch(items[i], keepPattern)) {
                continue;
              }

              const fullpath = path.join(folder, items[i]);
                const { birthtime } = fs.statSync(fullpath); 
                files.push({
                  filename: fullpath,
                  created: new Date(birthtime)
                });
            }
 
            files.sort((a, b) => {
              if (a.created.getTime() !== b.created.getTime()) {
                return a.created.getTime() < b.created.getTime() ? 1 : -1;
              }
              return 0;
            });


            files.slice(keep).forEach(f => {
              try {
                fs.unlinkSync(f.filename);
              } catch (e) {
                self.log.debug('Could not delete file ' + f.filename);
              }

            });


            resolve();
        });
      });
 
    }
 
    explain(options: any): string[] {
      return [
        `Targeting local file system`,
        `the destination path is ${options['folder']}`
      ];
    }
    getOptions(): ConfigurableSetting[] {
        return [
            {
              key: 'folder',
              type: ConfigurableSettingType.MacroString,
              isRequired: true,
              description: 'Directory where to save backups'
            },
            {
              key: 'filename',
              type: ConfigurableSettingType.MacroString,
              isRequired: true,
              description: 'Filename of the backup file'
          },
            {
              key: 'keep',
              type: ConfigurableSettingType.Int,
              isRequired: false,
              description: 'Number of maximum files to keep at the target location'
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