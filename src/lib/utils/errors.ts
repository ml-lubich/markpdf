/**
 * Custom Error Classes
 * Domain-specific error types for better error handling.
 */

/**
 * Validation error for input validation failures.
 */
export class ValidationError extends Error {
	constructor(message: string, public readonly cause?: Error) {
		super(message);
		this.name = 'ValidationError';
		Error.captureStackTrace(this, ValidationError);
	}
}

/**
 * Output generation error for PDF/HTML generation failures.
 */
export class OutputGenerationError extends Error {
	constructor(message: string, public readonly cause?: Error) {
		super(message);
		this.name = 'OutputGenerationError';
		Error.captureStackTrace(this, OutputGenerationError);
	}
}

