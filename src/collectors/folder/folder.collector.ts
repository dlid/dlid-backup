import { Configurable, ConfigurableSetting } from "../../types/Configurable.type";
import { CollectorBase } from "../../types/CollectorBase.type";

export class FolderCollector extends CollectorBase implements Configurable {
    name: string = 'folder';
    explain(options: any): string[] {
        return [];
    }
    getOptions(): ConfigurableSetting[] {
        return [];
    }
} 
