/**
 * Logger interface for dependency inversion.
 *
 * Following Clean Architecture principles, services should not depend on
 * concrete implementations (like console). Instead, they depend on abstractions.
 * This allows us to swap implementations (console, file logger, structured logger, etc.)
 * without changing the business logic.
 */

/**
 * Log levels.
 */
export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
}

/**
 * Logger interface that all loggers must implement.
 */
export type ILogger = {
	/**
	 * Log a debug message.
	 */
	debug(message: string, ...arguments_: unknown[]): void;

	/**
	 * Log an info message.
	 */
	info(message: string, ...arguments_: unknown[]): void;

	/**
	 * Log a warning message.
	 */
	warn(message: string, ...arguments_: unknown[]): void;

	/**
	 * Log an error message.
	 */
	error(message: string, error?: Error, ...arguments_: unknown[]): void;

	/**
	 * Check if a log level is enabled.
	 */
	isLevelEnabled(level: LogLevel): boolean;
};

/**
 * Console logger implementation.
 * This is the default logger that writes to console.
 */
export class ConsoleLogger implements ILogger {
	constructor(private readonly minLevel: LogLevel = LogLevel.INFO) {}

	debug(message: string, ...arguments_: unknown[]): void {
		if (this.isLevelEnabled(LogLevel.DEBUG)) {
			console.debug(`[DEBUG] ${message}`, ...arguments_);
		}
	}

	info(message: string, ...arguments_: unknown[]): void {
		if (this.isLevelEnabled(LogLevel.INFO)) {
			console.info(`[INFO] ${message}`, ...arguments_);
		}
	}

	warn(message: string, ...arguments_: unknown[]): void {
		if (this.isLevelEnabled(LogLevel.WARN)) {
			console.warn(`[WARN] ${message}`, ...arguments_);
		}
	}

	error(message: string, error?: Error, ...arguments_: unknown[]): void {
		if (this.isLevelEnabled(LogLevel.ERROR)) {
			console.error(`[ERROR] ${message}`, error, ...arguments_);
		}
	}

	isLevelEnabled(level: LogLevel): boolean {
		const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
		const minLevelIndex = levels.indexOf(this.minLevel);
		const levelIndex = levels.indexOf(level);
		return levelIndex >= minLevelIndex;
	}
}

/**
 * Silent logger that discards all log messages.
 * Useful for testing or when logging is not needed.
 */
export class SilentLogger implements ILogger {
	debug(): void {
		// Silent
	}

	info(): void {
		// Silent
	}

	warn(): void {
		// Silent
	}

	error(): void {
		// Silent
	}

	isLevelEnabled(): boolean {
		return false;
	}
}

/**
 * Default logger instance.
 * Can be replaced for testing or different environments.
 */
export const defaultLogger: ILogger = new ConsoleLogger(LogLevel.INFO);
