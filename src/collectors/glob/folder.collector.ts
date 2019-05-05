import { Configurable, ConfigurableSetting, ConfigurableSettingType } from "../../types/Configurable.type";
import { CollectorBase } from "../../types/CollectorBase.type";
import { Archive } from "../../archive/Archive";

export class GlobCollector extends CollectorBase implements Configurable {
    name: string = 'globs';
    options;
    explain(options: any): string[] {
        return [];
    }
    getOptions(): ConfigurableSetting[] {
        return [
            {
                key: 'patterns',
                type: ConfigurableSettingType.StringArray,
                isRequired: true,
                multi: true,
                description: 'List of glob patterns'
            },
        ];
    }
    async collect(archive: Archive, options: any): Promise<any> {
        this.options = options;

        //const result = await this.mysql('SHOW DATABASES') as string[];

        // for(var i = 0; i < result.length; i++) {
        //     if (this.testShouldDumpDatabase(result[i])) {
        //         const dump = await this.dumpDatabase(result[i]);
        //         archive.addString(`${result[i]}.sql`, dump);
        //     }
        // }
            
        
    }
} 
