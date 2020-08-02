import { logger, Logger } from '../../util';
import { RunJobOptionsInterface } from "./RunJobOptionsInterface";
import { JobManagerInterface } from ".";
import { intervalToDuration, formatDuration } from "date-fns";
import { autoInjectable, } from "tsyringe";

/**
 * Resonsible for running an async function and make sure the user gets information that it's still running
 */
@autoInjectable()
export class JobManager implements JobManagerInterface {

    private log: Logger;

    constructor() {
        this.log = logger.child('JobManager');
    }

    public async startJob<T>(asyncFunction: () => Promise<T>, options?: RunJobOptionsInterface): Promise<T> {
        let timeout;
        let notificationMs = 60000;
        let startTime = new Date();
        const name = options?.jobName || 'Job';
        const tick = () => { 
            const d = intervalToDuration({start: startTime, end: new Date()});
            this.log.info(`${name} - Still running (${formatDuration(d)})`);
            timeout = setTimeout(tick, notificationMs); // First notification a bit sooner
        };
        this.log.info(`${name} - Started`);
        return new Promise(async (resolve, reject) => {
            timeout = setTimeout(tick, notificationMs / 2);
            try {
                const result = await asyncFunction();
                const d = intervalToDuration({start: startTime, end: new Date()});
                clearTimeout(timeout);
                this.log.info(`${name} - Completed` + (d.seconds > 1 ? ` after ${formatDuration(d)}` : ''));
                resolve(result);
            } catch (e) {
                clearTimeout(timeout);
                reject(e);
            }
        });
    }

}