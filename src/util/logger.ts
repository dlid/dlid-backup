import { info } from "console";

export enum LogLevel {
    Verbose = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5,
}

export class Logger {

    private static logLevel: LogLevel = LogLevel.Trace;

    constructor(private root: Logger = null, private name: string = null) {}

    private trySetLogLevelFromParameters(args: string[]): boolean {
        const levels = ['verbose', 'trace', 'debug', 'info', 'warn', 'error']; // Must match the enum order
        const levelsFromParams: LogLevel[] = [];
        args.forEach(arg => {
            const m = arg.match(`^-l(og|)=(${levels.join('|')})`)
            if (m) {
                levelsFromParams.push(this.stringToLogLevel(m[2]));
            } else if (arg.indexOf('--') == 0) {
                var lvl = arg.substr(2);
                const ix = levels.indexOf(lvl);
                if (ix !== -1) {
                    levelsFromParams.push(this.stringToLogLevel(levels[ix]));
                }
            }
        });
        if (levelsFromParams.length > 0) {
            this.setLogLevel(levelsFromParams.pop());
            return true;
        }
        return false;
    }

    private stringToLogLevel(str: string): LogLevel {
        switch(str) {
            case 'trace': return LogLevel.Trace;
            case 'info': return LogLevel.Info;
            case 'debug': return LogLevel.Debug;
            case 'trace': return LogLevel.Trace;
            case 'warn': return LogLevel.Warning;
        }
        return LogLevel.Verbose;
    }


    private createLogMessage(level: LogLevel, param: any[], customLevelColor: string = null) {

        let levelString = '';
        let levelColor = '';
        let textColor = '';
        switch(level) {
            case  LogLevel.Debug: levelString = 'DEBUG'; levelColor = ''; break;
            case  LogLevel.Info: levelString = 'INFO'; levelColor = '\x1b[1m\x1b[37m'; break;
            case  LogLevel.Error: levelString = 'ERROR'; levelColor = '\x1b[2m'; break;
            case  LogLevel.Warning: levelString = 'WARN'; levelColor = '\x1b[1m\x1b[33m'; textColor = levelColor; break;
            case  LogLevel.Trace: levelString = 'TRACE'; levelColor = '\x1b[2m'; break;
        }

        if (customLevelColor) {
            levelColor = customLevelColor;
        }


        levelString = levelString.padEnd(5, ' ');
        let name = '';
        if (this.name) {
            name = `[\x1b[1m\x1b[36m${this.name}\x1b[0m] `;
        }

        const timestamp = new Date().toISOString();
        return `[${levelColor}${levelString}\x1b[0m] ${process.pid} ${timestamp} ${name}${textColor}${param.join(', ')}\x1b[0m`;
    }

    private logLevelToString(level: LogLevel): string {
        switch(level) {
            case  LogLevel.Debug: return 'DEBUG';
            case  LogLevel.Info: return 'INFO'; 
            case  LogLevel.Error: return 'ERROR';
            case  LogLevel.Trace: return 'TRACE';
            case  LogLevel.Warning: return 'WARN';
        }
        return 'VERBOSE';
    }

    setLogLevel(level: LogLevel, parametersToParse: string[] = null) {
        if (parametersToParse) {
            if (this.trySetLogLevelFromParameters(parametersToParse)) {
                return;
            }
        }
        Logger.logLevel = level;
        this.debug(`LogLevel set to ${this.logLevelToString(level)}`);
    }

    getLogLevel(): LogLevel {
        return Logger.logLevel;
    }

    child(name: string) {
        return new Logger(this.root || this, name);
    }

    error(...param: any[]) {
        if (LogLevel.Error >= this.getLogLevel()) {
            console.error( this.createLogMessage(LogLevel.Error, param));
        }
    }

    /**
     * Use sparsly - this will normally be visible to the user if no log level is specified
     */
    info(...param: any[]) {
        if (LogLevel.Info >= this.getLogLevel()) {
            console.info( this.createLogMessage(LogLevel.Info, param));
        }
    }

    warn(...param: any[]) {
        if (LogLevel.Warning >= this.getLogLevel()) {
            console.info( this.createLogMessage(LogLevel.Warning, param));
        }
    }

    /**
     * Use sparsly - logged as "info", but with green color
     */
    success(...param: any[]) {
        if (LogLevel.Info >= this.getLogLevel()) {
            console.info( this.createLogMessage(LogLevel.Info, param, '\x1b[32m'));
        }
    }

    /**
     * Will log a lot of extra information about steps that occur
     */
    debug(...param: any[]) {
        if (LogLevel.Debug >= this.getLogLevel()) {
            console.info( this.createLogMessage(LogLevel.Debug, param));
        }

    }

    /**
     * Log very detailed information 
     */
    trace(...param: any[]) {
        if (LogLevel.Trace >= this.getLogLevel()) {
            console.log( this.createLogMessage(LogLevel.Trace, param));
        }
    }

}

class Singleton {

  private static instance: Logger;

  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new Logger();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}

const logger = (new Singleton).getInstance();

export { logger };
 