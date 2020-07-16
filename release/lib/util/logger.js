"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Verbose"] = 0] = "Verbose";
    LogLevel[LogLevel["Trace"] = 1] = "Trace";
    LogLevel[LogLevel["Debug"] = 2] = "Debug";
    LogLevel[LogLevel["Info"] = 3] = "Info";
    LogLevel[LogLevel["Warning"] = 4] = "Warning";
    LogLevel[LogLevel["Error"] = 5] = "Error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor(root = null, name = null) {
        this.root = root;
        this.name = name;
    }
    trySetLogLevelFromParameters(args) {
        const levels = ['verbose', 'trace', 'debug', 'info', 'warn', 'error']; // Must match the enum order
        const levelsFromParams = [];
        args.forEach(arg => {
            const m = arg.match(`^-l(og|)=(${levels.join('|')})`);
            if (m) {
                levelsFromParams.push(this.stringToLogLevel(m[2]));
            }
            else if (arg.indexOf('--') == 0) {
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
    stringToLogLevel(str) {
        switch (str) {
            case 'trace': return LogLevel.Trace;
            case 'info': return LogLevel.Info;
            case 'debug': return LogLevel.Debug;
            case 'trace': return LogLevel.Trace;
            case 'warn': return LogLevel.Warning;
        }
        return LogLevel.Verbose;
    }
    createLogMessage(level, param, customLevelColor = null) {
        let levelString = '';
        let levelColor = '';
        let textColor = '';
        switch (level) {
            case LogLevel.Debug:
                levelString = 'DEBUG';
                levelColor = '';
                break;
            case LogLevel.Info:
                levelString = 'INFO';
                levelColor = '\x1b[1m\x1b[37m';
                break;
            case LogLevel.Error:
                levelString = 'ERROR';
                levelColor = '\x1b[2m';
                break;
            case LogLevel.Warning:
                levelString = 'WARN';
                levelColor = '\x1b[1m\x1b[33m';
                textColor = levelColor;
                break;
            case LogLevel.Trace:
                levelString = 'TRACE';
                levelColor = '\x1b[2m';
                break;
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
    logLevelToString(level) {
        switch (level) {
            case LogLevel.Debug: return 'DEBUG';
            case LogLevel.Info: return 'INFO';
            case LogLevel.Error: return 'ERROR';
            case LogLevel.Trace: return 'TRACE';
            case LogLevel.Warning: return 'WARN';
        }
        return 'VERBOSE';
    }
    setLogLevel(level, parametersToParse = null) {
        if (parametersToParse) {
            if (this.trySetLogLevelFromParameters(parametersToParse)) {
                return;
            }
        }
        Logger.logLevel = level;
        this.debug(`LogLevel set to ${this.logLevelToString(level)}`);
    }
    getLogLevel() {
        return Logger.logLevel;
    }
    child(name) {
        return new Logger(this.root || this, name);
    }
    error(...param) {
        if (LogLevel.Error >= this.getLogLevel()) {
            console.error(this.createLogMessage(LogLevel.Error, param));
        }
    }
    /**
     * Use sparsly - this will normally be visible to the user if no log level is specified
     */
    info(...param) {
        if (LogLevel.Info >= this.getLogLevel()) {
            console.info(this.createLogMessage(LogLevel.Info, param));
        }
    }
    warn(...param) {
        if (LogLevel.Warning >= this.getLogLevel()) {
            console.info(this.createLogMessage(LogLevel.Warning, param));
        }
    }
    /**
     * Use sparsly - logged as "info", but with green color
     */
    success(...param) {
        if (LogLevel.Info >= this.getLogLevel()) {
            console.info(this.createLogMessage(LogLevel.Info, param, '\x1b[32m'));
        }
    }
    /**
     * Will log a lot of extra information about steps that occur
     */
    debug(...param) {
        if (LogLevel.Debug >= this.getLogLevel()) {
            console.info(this.createLogMessage(LogLevel.Debug, param));
        }
    }
    /**
     * Log very detailed information
     */
    trace(...param) {
        if (LogLevel.Trace >= this.getLogLevel()) {
            console.log(this.createLogMessage(LogLevel.Trace, param));
        }
    }
}
exports.Logger = Logger;
Logger.logLevel = LogLevel.Trace;
class Singleton {
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
exports.logger = logger;
