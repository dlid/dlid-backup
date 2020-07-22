export interface FileManagerInterface {
    readTextSync(filename: string): string;
    exists(path: string): boolean;
    resolvePath(val: string): string;
    getFileParts(fullPath: string): { filename: string; directory: string };
}