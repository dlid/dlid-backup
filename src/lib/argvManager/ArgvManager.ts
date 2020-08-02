import { Logger, logger } from './../../util/logger';
import { FileManagerInterface } from "../fileManager";
import { ParameterException } from "../../exceptions";
import { autoInjectable, inject } from "tsyringe";
import { ArgvManagerInterface } from './ArgvManagerInterface';
import { ArgvParameterArray } from "./ArgvParameterArray";
import { CommandManagerInterface } from "../commandManager";
import { TableManagerInterface } from 'lib';

/**
 * Responsible for translating the various ways to input parameters into
 * a well known style 
*/
@autoInjectable()
 export class ArgvManager implements ArgvManagerInterface {

    private log: Logger;

    public constructor(
        @inject("CommandManagerInterface") private commandManager: CommandManagerInterface,
        @inject("FileManagerInterface") private fileManager: FileManagerInterface,
        @inject("TableManagerInterface") private tableManager: TableManagerInterface 
    ) {
        this.log = logger.child('ArvgManager');
    }

    /**
     * 
     * @param parameters List of parameters
     */
    public parseArguments(parameters: string[]): ArgvParameterArray {
        this.log.debug(`Parsing arguments`, parameters.map(a => this.tableManager.fgGreen(a)).join(','));

        let args = parameters.slice(0); 
        const action = args.shift();

        let argsFromFiles: string[] = [];

        let foundFileArg = -1;
        for (var i=0; i < args.length; i++) {
            if (args[i].startsWith("file:///")) {
                this.log.debug(`Found file argument at position ${i}`);
                const filename = args[i].substring(8);
                try {
                    const fileContent = this.fileManager.readTextSync(filename);
                    const args2 = fileContent.toString().split(/[\r\n]/);
                    this.log.debug(`Adding ${args.length} lines from file`);
                    args2.forEach(line => {
                        if (line) {
                            var t = line.split(/\t+/);
                            t.forEach(ti => argsFromFiles.push(ti));
                        }
                    });
                    foundFileArg = i;
                } catch (e) {
                    throw new ParameterException('file:/// parameter', null, `Could not find file ${filename}`);
                }
            } else {
                break;
            }
        }

        if (foundFileArg !== -1) {
            args.splice(0, foundFileArg + 1);   
            args = argsFromFiles.concat(args);
        }

         return this.normalizeArguments(args);
    }

    

    /**
     * Attempt to normalize the arguments so we always get the long names.
     * Also split arguments so 
     *   ["-s:host=localhost"] becomes ["--source.host", "localhost"]
     *   ["/s=mysql"] becomes ["--source", "mysql"]
     *   ["/s", "mysql"] becomes ["--source", "mysql"]
     * @param args 
     * @param commands 
     */
    private normalizeArguments(args: string[]) {
        
        this.log.debug(`Normalizing arguments`, args.map(a => this.tableManager.fgYellow(a)).join(','));

        const shortNames = this.commandManager.getAll().filter(c => c.shortName).map(c => `${c.shortName}`  ).join('|');
        const longNames = this.commandManager.getAll().filter(c => c.longName).map(c => c.longName).join('|');

        let newargs: string[] = [];

        args.forEach((f, ix) => {
            let cmdName = "";
            let optionName = "";
            let optionValue = "";

            const shrt = f.match(`^(?:-|\/)([${shortNames}])(\\.([a-zA-Z-0-9]+?)[=:]|[=:])(.*)$`);
            if (shrt) {
                cmdName = `-${shrt[1]}`;
                optionName = shrt[3];
                optionValue = shrt[4];
            } else {
                const lng = f.match(`^(?:--|\/)(${longNames})(\\.([a-zA-Z-0-9]+?)[=:]|[=:])(.*)$`);
                if (lng) {
                    cmdName = `--${lng[1]}`;
                    optionName = lng[3];
                    optionValue = lng[4];
                }
            }

            if (cmdName) {
                let cmd = this.commandManager.find(cmdName);
                const command = '--' + cmd.longName;
                newargs.push(command + (optionName ? `.${optionName}` : ''));
                newargs.push(optionValue);
            } else {
                 const shrt = f.match(`^(?:-|\/)([${shortNames}])(?:\\.(.+)|)$`);
                 let cmdName = "";
                 let optionName = "";
                 if (shrt)  {
                     cmdName = `-${shrt[1]}`;
                     optionName = shrt[2];
                 } else {
                    const lng = f.match(`^(?:--|\/)(${longNames})(?:\\.(.+)|)$`);
                    if (lng) {
                        cmdName = `--${lng[1]}`;
                        optionName = lng[2];
                    }
                 }
                const cmd = this.commandManager.find(cmdName);
                if (cmd) {
                    newargs.push(`--${cmd.longName}` + (optionName ? `.${optionName}` : ''));
                } else {
                    newargs.push(f);
                }

            }
        });
        this.log.debug(`Normalized arguments`, newargs.map(a => this.tableManager.fgGreen(a)).join(','));
        return newargs;
    }


 }