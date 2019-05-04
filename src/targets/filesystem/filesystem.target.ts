import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { TargetBase } from "../../types/TargetBase.type";

export class FileSystemTarget extends TargetBase implements Configurable {
    name: string = 'filesystem';
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
                type: ConfigurableSettingType.FilePath,
                isRequired: true,
                description: 'Path to Mysql executable (Windows only)'
            }
        ];
    }
}