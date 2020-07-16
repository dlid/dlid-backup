"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MacroError = exports.ParameterException = exports.TargetError = exports.CollectorError = exports.DlidBackupError = void 0;
class DlidBackupError extends Error {
    constructor(category, message, details) {
        super(message);
        this.category = category;
        this.details = details;
        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;
        // This clips the constructor invocation from the stack trace.
        // It's not absolutely essential, but it does make the stack trace a little nicer.
        //  @see Node.js reference (bottom)
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.DlidBackupError = DlidBackupError;
class CollectorError extends DlidBackupError {
    constructor(collectorName, message, errorDetails = null) {
        super(`${collectorName} (Collector)`, message, errorDetails);
        this.collectorName = collectorName;
        this.errorDetails = errorDetails;
    }
}
exports.CollectorError = CollectorError;
class TargetError extends DlidBackupError {
    constructor(targetName, message, errorDetails = null) {
        super(`${targetName} (Target)`, message, errorDetails);
        this.targetName = targetName;
        this.errorDetails = errorDetails;
    }
}
exports.TargetError = TargetError;
class ParameterException extends DlidBackupError {
    constructor(propertyName, propertyValue, message, configurableName, isCollector) {
        super(`${typeof isCollector !== 'undefined' ? (isCollector == true ? '-s.' : '-t.') : ''}${propertyName}`, message, '');
        this.propertyName = propertyName;
        this.propertyValue = propertyValue;
        this.configurableName = configurableName;
    }
}
exports.ParameterException = ParameterException;
class MacroError extends DlidBackupError {
    constructor(message) {
        super('macros', message, '');
    }
}
exports.MacroError = MacroError;
