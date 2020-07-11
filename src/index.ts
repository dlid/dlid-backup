import { GlobCollector, MySqlCollector }  from "./collectors";
import { FileSystemTarget, FireStoreTarget } from './targets';
import { DlidBackup } from "./dlid-backup.class";
import { DlidBackupError } from "./exceptions/collector.error";
import {logger, LogLevel} from './util/logger'
import { argv } from "process";


/// Include all the collectors and targets we want to support
const targetsAndCollectors = [
    new GlobCollector(),
    new MySqlCollector(),
    new FileSystemTarget(),
    new FireStoreTarget()
];

logger.setLogLevel(LogLevel.Info, argv);

var bak = new DlidBackup(targetsAndCollectors, argv);

bak.run().then(() => {
    logger.success(`No errors detected`);
    // All is well
}).catch(err => {
    if (err instanceof DlidBackupError) {
        const derr = err as DlidBackupError;
        console.log(`\n\x1b[1m\x1b[31mERROR\x1b[0m\t\x1b[41m\x1b[37m${derr.name}\x1b[0m\t\x1b[36m\x1b[1m${err.category}\x1b[0m\t\x1b[37m${err.message}\x1b[0m\t${derr.details}`);
    } else if (err instanceof Error) {
        console.log(`\n\n\x1b[1m\x1b[31mUNHANDLED ERROR\x1b[0m\t${err.message}\x1b[0m\t${err.stack}`);
    }
})



// bak.parseArguments().then(async (context) => {
    
//     if (context.action.indexOf('help') === 0) {
//         bak.help(context.action.replace(/^help\s?/, ''));
//         return;
//     }
    
//     const tempFilename = tmp.tmpNameSync() + '.zip';
//     const outputFile = new Archive(tempFilename);
//     const source = <any>context.source as CollectorBase;
//     let isCollected = false;
    
//     try {
//         isCollected = await source.collect(outputFile, context.sourceOptions);
//     } catch (e) {
//         throw e;
//     }
    
//     if (isCollected) {
//         console.log("data was collected");
//         outputFile.discard();
//     }
    
    
    // (<any>settings.source as CollectorBase).collect(outputFile, settings.sourceOptions).then(notEmpty => {
    //     if (notEmpty) {
    //         outputFile.save().then(f => {
    //             console.log(`${tempFilename} created. Send using Target`);
    //         })
    //     } else {
    //         console.log(`Collector did not collect any data`);       
    //     }
    // }, function(err) {
    //     console.log("ERROR Collector failed", err);
    // });
    
// }).catch(err => {
//     if (err instanceof DlidBackupError) {
//         const derr = err as DlidBackupError;
//         console.log(`\n\x1b[1m\x1b[31mERROR\x1b[0m\t\x1b[41m\x1b[37m${derr.name}\x1b[0m\t\x1b[36m\x1b[1m${err.category}\x1b[0m\t\x1b[37m${err.message}\x1b[0m\t${derr.details}`);
//     } else if (err instanceof Error) {
//         console.log(`\n\n\x1b[1m\x1b[31mUNHANDLED ERROR\x1b[0m\t${err.message}\x1b[0m\t${err.stack}`);
//         console.log(format("[error] TypeError" + err.message), err.stack);
//     }
// })
// .then()
// .catch(err => err)


// function format(val: string) {
    
//     const tags = {
//         em: '\x1b[35m',
//         code: '\x1b[33m'
//     };
    
//     let keys = Object.keys(tags);
    
    
//     val = val.replace('[error]', '\x1b[41m\x1b[37m error \x1b[0m ');
    
//     keys.forEach(tagName => {
//         let re = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`);
//         let arrMatch;
//         while (arrMatch = re.exec(val)) {
//             val = val.replace( arrMatch[0], `${tags[tagName]}${arrMatch[1]}\x1b[0m`);
//         }
//     })
    
//     return val;
    
    
    
// }
