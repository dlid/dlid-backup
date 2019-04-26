import { FolderCollector, MySqlCollector }  from "./src/collectors";
import { FileSystemTarget, FireStoreTarget } from './src/targets';
import { Collector } from "./src/types";



class DlidBackup {
        constructor(collectors: Collector[]) {}

        /**
         * 
         * @param configFilePath 
         */
        load(configFilePath: string) {
                return new Promise((reolve, reject) => {

                });
        }

}

var bak = new DlidBackup([new FolderCollector(), new MySqlCollector()]);


bak.load('')
        .then()
        .catch(err => err)
 



