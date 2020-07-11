export class DlidBackupError extends Error {

    constructor(public category: string, message: string, public details: string) {
      super(message);
      
     // Ensure the name of this error is the same as the class name
      this.name = this.constructor.name;
     // This clips the constructor invocation from the stack trace.
     // It's not absolutely essential, but it does make the stack trace a little nicer.
     //  @see Node.js reference (bottom)
      Error.captureStackTrace(this, this.constructor);
    }
  }

export class CollectorError extends DlidBackupError {
    constructor(public collectorName: string, message: string, public errorDetails: string = null) {
        super(`${collectorName} (Collector)`, message, errorDetails);
    }
}

export class ParameterException extends DlidBackupError {
    constructor(public propertyName: string, public propertyValue: string, message: string, public configurableName?: string, isCollector?: boolean) {
        super(`${ typeof isCollector !== 'undefined' ? (isCollector == true ? '-s.' : '-t.') : '' }${propertyName}`, message, '');
    }
}

