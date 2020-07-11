import { TargetBase } from "../../types/TargetBase.type";
import { ConfigurableSettingType, ConfigurableSetting } from "../../types";

export class FireStoreTarget extends TargetBase {
    description: string = 'Save backup to Google FireStore';

    name: string = 'firebase';

    run(): Promise<any> {
      return new Promise((resolve, reject) => {
          resolve();
      });
    }

    explain(options: any): string[] {
      return [
        `Save in Google Firestore`,
        `the destination path is ${options['folder']}`
      ];
    }
    getOptions(): ConfigurableSetting[] {
        return [
            {
                key: 'path',
                type: ConfigurableSettingType.String,
                isRequired: false,
                description: 'Firestore file path where to save backups'
            },
            {
                key: 'filename',
                type: ConfigurableSettingType.String,
                isRequired: true,
                description: 'The filename to save'
            }
        ];
    }
}

