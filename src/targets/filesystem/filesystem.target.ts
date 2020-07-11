import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { TargetBase } from "../../types/TargetBase.type";

export class FileSystemTarget extends TargetBase implements Configurable {
    description: string = 'Save backup to filesystem';
    name: string = 'filesystem';

    run(): Promise<any> {
      return new Promise((resolve, reject) => {
          resolve();
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
                type: ConfigurableSettingType.FolderPath,
                isRequired: true,
                description: 'Directory where to save backups'
            }
        ];
    }
}