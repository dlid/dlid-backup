import { Collector, Collectorsetting, CollectorSettingType } from "../../types";

export class MySqlCollector implements Collector {
    getOptions(): Collectorsetting[] {
        return [
            {
                key: 'mysql-path',
                type: CollectorSettingType.FilePath,
                isRequired: false
            }
        ];
    }
}