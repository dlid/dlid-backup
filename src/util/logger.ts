import { TableManager } from './../lib/tableManager/TableManager';
import { info } from "console";

export enum LogLevel {
    Verbose = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5,

    None = 10
}

export class Logger {

    private static logLevel: LogLevel = LogLevel.Trace;
    private fullPath: string[] = [];
    private tableManager: TableManager;

    constructor(private root: Logger = null, private name: string = null, parents: string[] = []) {
        this.fullPath = this.name ? (parents ? parents : []).concat([this.name]) : [];
        // TODO: Fix this as an injectable.. Logger should be...
        this.tableManager = new TableManager();
    }

    private trySetLogLevelFromParameters(args: string[]): string[] {
        const levels = ['verbose', 'trace', 'debug', 'info', 'warn', 'error']; // Must match the enum order
        const levelsFromParams: LogLevel[] = [];
        args = args.slice(0);

        for (var i=0; i < args.length; i++) {
            const arg = args[i];
            if (arg.indexOf('--') == 0) {
                var lvl = arg.substr(2);
                const ix = levels.indexOf(lvl);
                if (ix !== -1) {
                    this.setLogLevel(this.stringToLogLevel(levels[ix]));
                    levelsFromParams.push(this.stringToLogLevel(levels[ix]));
                    args.splice(i, 1);
                    return args;
                }
            }
        };

        return undefined;
        
    }

    private stringToLogLevel(str: string): LogLevel {
        switch(str) {
            case 'trace': return LogLevel.Trace;
            case 'info': return LogLevel.Info;
            case 'debug': return LogLevel.Debug;
            case 'trace': return LogLevel.Trace;
            case 'warn': return LogLevel.Warning;
            case 'error': return LogLevel.Error;
            case 'none': return LogLevel.None;
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
        let name = this.fullPath[0] || '';
        if (name) {
            let cc = '';
            if (this.fullPath.length > 1) {
                cc = `:${this.tableManager.fgYellow(this.fullPath[1])}`;
            }
            name = `[\x1b[1m\x1b[36m${name}\x1b[0m]${cc}`;
            
            name += ' ';
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

    setLogLevel(level: LogLevel, parametersToParse: string[] = null): string[] {
        const log = this.child('Logger');
        if (parametersToParse) {
            const newParameters = this.trySetLogLevelFromParameters(parametersToParse);
            if (newParameters) {
                return newParameters;
            }
        }
        Logger.logLevel = level;
        log.debug(`LogLevel set to ${this.logLevelToString(level)}`);
        return parametersToParse;
    }

    getLogLevel(): LogLevel {
        return Logger.logLevel;
    }

    child(name: string) {
        return new Logger(this.root || this, name, this.fullPath);
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
 