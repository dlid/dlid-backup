export abstract class MacroFormatterBase  {

    public abstract readonly name: string;

    public abstract readonly prefix: string;

    public abstract format(value: string): string;

    public help(): string {
        return null;
    }

}
