type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  jobId?: string;
  error?: Error;
  details?: any;
}

interface OperationInfo {
  jobId?: string;
  details?: any;
}

class Logger {
  private logLevel: LogLevel = 'info';

  constructor() {
    // Set log level from environment variable
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    if (envLogLevel && ['debug', 'info', 'warn', 'error'].includes(envLogLevel)) {
      this.logLevel = envLogLevel;
    }
  }

  private formatMessage(entry: LogEntry): string {
    const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const jobInfo = entry.jobId ? ` [Job: ${entry.jobId}]` : '';
    const errorInfo = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : '';
    const details = entry.details ? `\nDetails: ${JSON.stringify(entry.details, null, 2)}` : '';
    
    return `${base}${jobInfo}${errorInfo}${details}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    jobId?: string,
    error?: Error,
    details?: any
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      jobId,
      error,
      details
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = this.formatMessage(entry);
    
    // Console output with colors
    switch (entry.level) {
      case 'debug':
        console.debug('\x1b[90m%s\x1b[0m', formattedMessage); // Gray
        break;
      case 'info':
        console.info('\x1b[36m%s\x1b[0m', formattedMessage); // Cyan
        break;
      case 'warn':
        console.warn('\x1b[33m%s\x1b[0m', formattedMessage); // Yellow
        break;
      case 'error':
        console.error('\x1b[31m%s\x1b[0m', formattedMessage); // Red
        break;
    }
  }

  debug(message: string, jobId?: string, details?: any): void {
    this.log(this.createLogEntry('debug', message, jobId, undefined, details));
  }

  info(message: string, jobId?: string, details?: any): void {
    this.log(this.createLogEntry('info', message, jobId, undefined, details));
  }

  warn(message: string, jobId?: string, error?: Error, details?: any): void {
    this.log(this.createLogEntry('warn', message, jobId, error, details));
  }

  error(message: string, jobId?: string, error?: Error, details?: any): void {
    this.log(this.createLogEntry('error', message, jobId, error, details));
  }

  startOperation(operationName: string, info?: OperationInfo): void {
    this.info(`Starting operation: ${operationName}`, info?.jobId, info?.details);
  }

  endOperation(operationName: string, info?: OperationInfo): void {
    this.info(`Completed operation: ${operationName}`, info?.jobId, info?.details);
  }

  failOperation(operationName: string, error: Error, info?: OperationInfo): void {
    this.error(`Failed operation: ${operationName}`, info?.jobId, error, info?.details);
  }
}

export const logger = new Logger();
