/**
 * Domain-specific error types.
 * 
 * Following Clean Code principles, we use specific error types instead of
 * generic Error objects. This makes error handling more explicit and allows
 * for better error recovery strategies.
 */

/**
 * Base class for all domain errors.
 */
export abstract class DomainError extends Error {
	abstract readonly code: string;
	readonly timestamp: Date;
	
	constructor(message: string, readonly cause?: Error) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date();
		Error.captureStackTrace?.(this, this.constructor);
	}
}

/**
 * Error when input validation fails.
 */
export class ValidationError extends DomainError {
	readonly code = 'VALIDATION_ERROR';
	
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}

/**
 * Error when file operations fail.
 */
export class FileError extends DomainError {
	readonly code = 'FILE_ERROR';
	
	constructor(message: string, readonly path?: string, cause?: Error) {
		super(message, cause);
	}
}

/**
 * Error when configuration is invalid.
 */
export class ConfigurationError extends DomainError {
	readonly code = 'CONFIGURATION_ERROR';
	
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}

/**
 * Error when markdown parsing fails.
 */
export class MarkdownParseError extends DomainError {
	readonly code = 'MARKDOWN_PARSE_ERROR';
	
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}

/**
 * Error when Mermaid diagram processing fails.
 */
export class MermaidProcessError extends DomainError {
	readonly code = 'MERMAID_PROCESS_ERROR';
	
	constructor(message: string, readonly chartIndex?: number, cause?: Error) {
		super(message, cause);
	}
}

/**
 * Error when PDF/HTML generation fails.
 */
export class OutputGenerationError extends DomainError {
	readonly code = 'OUTPUT_GENERATION_ERROR';
	
	constructor(message: string, cause?: Error) {
		super(message, cause);
	}
}

/**
 * Error when server operations fail.
 */
export class ServerError extends DomainError {
	readonly code = 'SERVER_ERROR';
	
	constructor(message: string, readonly port?: number, cause?: Error) {
		super(message, cause);
	}
}

