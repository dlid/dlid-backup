/**
 * Macro Manager will handle available macros that can be used
 * 
 * For example - the date formatter will replace "{date:yyyyMMdd}" with "20200726"
 */
import { autoInjectable, container } from "tsyringe";
import { MacroFormatterBase, IMacroManager } from ".";

@autoInjectable()
export class MacroManager implements IMacroManager {
 
    private macrosValues: { [key: string]: string } = {};
    private macroFormatters: MacroFormatterBase[] = [];
    
    public addMacroValue(name: string, value: string) {
        this.macrosValues[name] = value;
    }

    escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    help() {
        this.macroFormatters.forEach(f => {
            console.log( f.name);
            console.log(f.help());
        })
    }

    add(...injectionTokens: string[]): IMacroManager {
        injectionTokens.forEach(newSource => {
            const instance = container.resolve(newSource);
            if (instance instanceof MacroFormatterBase) {
                const i = instance as MacroFormatterBase;
                const existing = this.macroFormatters.findIndex(s => s.prefix === i.prefix);
                if (existing !== -1) {
                    this.macroFormatters.splice(existing, 1, i);
                } else {
                    this.macroFormatters.push(i);
                }
            }

        });
        return this;
    }

    public format(value: string): string {

        // Values first
        const macroKeys = Object.keys(this.macrosValues);
        macroKeys.forEach(key => {
            console.log(`{${this.escapeRegExp(key)}}`);
            var re = new RegExp(`{${this.escapeRegExp(key)}}`);
            value = value.replace(re, this.macrosValues[key]);
        });
        
        // Formatters
        this.macroFormatters.forEach(formatter => {
            const rex = new RegExp(`{${this.escapeRegExp(formatter.prefix)}:([^}]+?)}`, '');
            
            var result = rex.exec(value);
            while(result) {
                value = value.replace(result[0], formatter.format(result[1]));
                result = rex.exec(value);
            }
            
        });

        return value;

    }

} 