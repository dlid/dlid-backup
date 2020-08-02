import { FileInformation } from "./FileInformation";

export interface FileManagerInterface {
    readTextSync(filename: string): string;
    exists(path: string): boolean;
    resolvePath(val: string): string;
    getFileParts(fullPath: string): { filename: string; directory: string };
    bytesToSize(bytes: number): string;
    join(...paths: string[]): string;
    mkdir(path: string);
    copy(source: string, target: string): void;
    delete(path: string): void;

    /**
     * Given a list of files and the number of files to keep, return the files to delete
     * @param files The list of affected files
     * @param keep The number of files to keep
     * @param keepPattern Only check files matching this pattern in the file list
     */
    getFilesToDelete(files: FileInformation[] | string, keep: number, keepPattern: string): Promise<FileInformation[]>;

    getFilesInFolder(path: string): Promise<FileInformation[]>;
    getBasename(value: string): string;
    getDirectoryName(value: string): string;
    glob(pattern: string): Promise<string[]>;
}