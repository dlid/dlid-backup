import { RunJobOptionsInterface } from ".";

export interface JobManagerInterface {
    startJob<T>(asyncFunction: () => Promise<T>, options?: RunJobOptionsInterface): Promise<T>;
}