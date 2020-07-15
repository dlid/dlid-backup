export abstract class MacroFormatterBase  {

    public abstract readonly prefix: string;

    public abstract format(value: string): string;

}
