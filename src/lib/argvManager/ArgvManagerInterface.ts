import { ArgvParameterArray } from "./ArgvParameterArray";

export interface ArgvManagerInterface {
    parseArguments(parameters: string[], trimArgv?: boolean): ArgvParameterArray;
}
