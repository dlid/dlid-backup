import { IMacroManager } from '../../lib';

import { TargetManagerInterface, SourceManagerInterface, UserOptionManagerInterface, UserOptionInterface } from '..';
import { autoInjectable, inject } from "tsyringe";
import { TableManagerInterface } from "lib";
import { joinWithOr } from '../../util';


@autoInjectable()
export class HelpManager {


    constructor(
        @inject("TableManagerInterface") private tableManager: TableManagerInterface,
        @inject("TargetManagerInterface") private targetManager: TargetManagerInterface,
        @inject("SourceManagerInterface") private sourceManager: SourceManagerInterface,
        @inject("UserOptionManagerInterface") private userOptionManager: UserOptionManagerInterface,
        @inject("IMacroManager") private macroManager: IMacroManager,
        ) {}
    
    public showHelp(params: string[]): void {
        
        if (params[0]?.startsWith('target') || params[0]?.startsWith('source')) {
            const isTarget = params[0]?.startsWith('target');
            if (params.length > 1) {
                const items = params.slice(1);

                if (isTarget) {
                    this.showTargetHelp(items[0]);
                } else {
                    this.showSourceHelp(items[0]);
                }

                return;
            } else {
                console.log("ALL TARGETS OR SOURCES")
                return;
            }
        } else if (params[0].startsWith("macro")) {
            this.showMacros(params.slice(1));
        }


        
        if (params.length === 0) {
            this.basics();
        }

    }

    showMacros(params: string[]) {

        console.log("\n")
        params?.forEach(p => {
            console.log(p, '=>', this.tableManager.fgYellow(this.macroManager.format(p)));
        })
        console.log("\n")

        this.macroManager.help();



    }

    private showOptions(options: UserOptionInterface[]) {
        const optionsTable: string[] = [];

        options?.map(o => {
            optionsTable.push(` -t.${o.key}\t${this.userOptionManager.typeToString(o.type)}\t${o.isRequired ? 'Required. ' : ''}${o.description}${o.defaultValue ? `<br>Default: ${o.defaultValue}` : ``} `);
        });

        console.log("Options:");
        console.log(this.tableManager.tabsToTable(optionsTable, 3));
    }

    public showTargetHelp(name: string) {
        const target = this.targetManager.getByName(name);

        console.log(`\n${this.tableManager.fgGreen(`${target.name}`)}  Target - ${target.description}\n`);

        let parameterOptions: string[] = [];;
        let argumentSyntax = ``;
        let parameterHelp = '';

        const quickOptions = target.getQuickOptions();
        if (quickOptions) {
            parameterOptions.push('Arguments:');
            parameterOptions.push('');
            quickOptions.forEach(opt => {

                let more = '';

                if (opt.examples) {
                    more = '<br><br>Examples:<br>' + opt.examples.map(e => `${e}`).join('<br>');
                }

                parameterOptions.push(` ${opt.name}\t${opt.description}${more}`);

                argumentSyntax += ` [${this.tableManager.fgMagenta(opt.name)}`;

                if (opt.allowMultiple) {
                    argumentSyntax += ` [, ${this.tableManager.fgMagenta(opt.name)} ... ]`;
                }
                argumentSyntax += `]`;

                parameterHelp += `${opt.name}:\n`;
                parameterHelp += ` ${opt.description}\n`;
                if (opt.examples) {
                    parameterHelp += `\n Examples:\n`;
                    opt.examples?.forEach(ex => {
                        parameterHelp += `  --target ${target.name} ${ex}\n`;
                    });
                }

            })
        }

        console.log(`Syntax: dlid-backup (--target | -t | /t | /target) ${target.name}${argumentSyntax} [ ${this.tableManager.fgCyan("OPTION")} [, ${this.tableManager.fgCyan("OPTION")}] ... ]`);
        
        console.log("");
        if (parameterOptions) {
            console.log(this.tableManager.tabsToTable(parameterOptions, 2));
        }
        
        if (parameterHelp) {
            console.log(`\nNote: ${joinWithOr(quickOptions.map(f => this.tableManager.fgMagenta(f.name)), 'and')} ${quickOptions.length == 1 ? 'argument above' : 'arguments above'} is just an alternate way to set ${this.tableManager.fgCyan("OPTION")}s.\n\n`);
        }

        // if (parameterOption && target.parametersDescription) {
        //     console.log(`${target.parametersName}:`);
        //     console.log(target.parametersDescription);
        // }

        this.showOptions(target.options);
        
        console.log();
    }

    public showSourceHelp(name: string) {
        const target = this.sourceManager.getByName(name);

        console.log(`\n${this.tableManager.fgGreen(`${target.name}`)}  Source - ${target.description}\n`);

        console.log(`Syntax: dlid-backup [ --source | -s | /s | /source ] ${target.name} [${this.tableManager.fgBlue("PARAMETERS")}] [ ${this.tableManager.fgCyan("OPTION")} [, ${this.tableManager.fgCyan("OPTION")}] ... ]`);
        console.log("");

        this.showOptions(target.options);
        
        console.log();
    }




    private basics() {
        
        console.log(`Usage: dlid-backup ` + this.tableManager.fgGreen('<command>') + ` ` + this.tableManager.fgMagenta("<source>") + ' [, '+ this.tableManager.fgMagenta("<source>") + ' ...] \x1b[34m<target>\x1b[0m [, \x1b[34m<target>\x1b[0m ...] [--' + this.tableManager.fgYellow('<loglevel>') + ']\n');
        console.log("About: Data is collected by "+this.tableManager.fgMagenta("source") +"(s), zipped, and then sent to \x1b[34mtarget\x1b[0m(s)\n");

        console.log(`Commands:`);
        console.log(this.tableManager.tabsToTable([
            `${this.tableManager.fgGreen('  run')}\t-\tRun the backup with your specified options.`,
            `${this.tableManager.fgGreen('  explain')}\t-\tExplains the options you have specified in a human readable format`,
            `${this.tableManager.fgGreen('  help')}\t-\tLearn how to use dlid-backup`
        ], 2));

        console.log("Sources:")
        console.log(this.tableManager.tabsToTable(this.sourceManager.getAll().map(o => {
            return `${this.tableManager.fgMagenta(`  ${o.name}`)}\t-\t${o.description}`;
        }), 2));

        console.log("Targets:")
        console.log(this.tableManager.tabsToTable(this.targetManager.getAll().map(o => {
            return `${this.tableManager.fgBlue(`  ${o.name}`)}\t-\t${o.description}`;
        }), 2));

        console.log(`Log levels:`);
        console.log(this.tableManager.tabsToTable([
            `${this.tableManager.fgYellow('  trace')} or ${this.tableManager.fgYellow('verbose')}, ${this.tableManager.fgYellow('debug')}, ${this.tableManager.fgYellow('info')}, ${this.tableManager.fgYellow('warn')}, ${this.tableManager.fgYellow('error')}\t-\tDefault is ${this.tableManager.fgYellow('info')}`,
        ], 2));



        console.log("Examples:")
        console.log(`  dlid-backup ` + this.tableManager.fgGreen('run ') + this.tableManager.fgMagenta('-s mysql -s.host localhost -s.username root -s.password 123') + this.tableManager.fgBlue(` -t filesystem -t.folder E:\\backup -t.filename "db_backup_{date:yyyy-MM-dd}.zip"`));
        console.log(`  dlid-backup run -s mysql root:123@localhost -t filesystem E:\\backup\\db_backup_{date:yyyy-MM-dd}.zip`);
        console.log(`  dlid-backup run -s folder -s.folder E:\\data -t filesystem E:\\backup\\data_backup{date:yyyy-MM-dd'T'HHmmss}.zip`);

    }

}
