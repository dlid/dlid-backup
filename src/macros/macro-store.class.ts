import { MacroError } from "../exceptions";
import { MacroFormatterBase } from "./macro-formatter-base.class";

export class MacroStore {
 
    private macrosValues: { [key: string]: string } = {};
    private macroFormatters: MacroFormatterBase[] = [];
    
    public addMacroValue(name: string, value: string) {

    }

    escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      }

    public add(macro: MacroFormatterBase) {
        if (this.macroFormatters.find(f => f.prefix === macro.prefix)) {
            throw new MacroError(`MacroFormatter with prefix "${macro.prefix}" is already registered`);
        }
        this.macroFormatters.push(macro);
    }

    public format(value: string): string {

        // Values first
        const macroKeys = Object.keys(this.macrosValues);
        macroKeys.forEach(key => {
            console.log(`{${this.escapeRegExp(key)}}`);
            var re = new RegExp(`{${this.escapeRegExp(key)}}`);
            value = value.replace(re, this.macrosValues['är du go eller']);
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