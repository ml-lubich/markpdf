/**
 * Domain entities and value objects.
 *
 * Following Clean Architecture principles, these represent the core business
 * concepts of the application. They are independent of frameworks and contain
 * business logic.
 */

import { ValidationError } from './errors.js';

/**
 * Input source for markdown conversion.
 *
 * This is a value object that represents where markdown comes from.
 * It encapsulates validation logic for the input.
 */
export class InputSource {
	private constructor(
		public readonly path?: string,
		public readonly content?: string,
	) {
		// Validation: must have either path or content, but not both
		if (!path && !content) {
			throw new ValidationError('InputSource must have either path or content');
		}

		if (path && content) {
			throw new ValidationError('InputSource cannot have both path and content');
		}

		if (path && typeof path !== 'string') {
			throw new ValidationError('InputSource path must be a string');
		}

		if (content && typeof content !== 'string') {
			throw new ValidationError('InputSource content must be a string');
		}
	}

	/**
	 * Create an InputSource from a file path.
	 */
	static fromPath(path: string): InputSource {
		return new InputSource(path, undefined);
	}

	/**
	 * Create an InputSource from content.
	 */
	static fromContent(content: string): InputSource {
		return new InputSource(undefined, content);
	}

	/**
	 * Create an InputSource from a path or content object.
	 */
	static from(input: { path?: string; content?: string }): InputSource {
		if (input.path) {
			return InputSource.fromPath(input.path);
		}

		if (input.content) {
			return InputSource.fromContent(input.content);
		}

		throw new ValidationError('Input must have either path or content');
	}

	/**
	 * Check if this is a file path input.
	 */
	isPath(): boolean {
		return this.path !== undefined;
	}

	/**
	 * Check if this is a content input.
	 */
	isContent(): boolean {
		return this.content !== undefined;
	}
}

/**
 * Output destination for conversion results.
 *
 * This is a value object that represents where output should go.
 */
export class OutputDestination {
	private readonly _isStdout: boolean;

	private constructor(
		public readonly path?: string,
		isStdout = false,
	) {
		this._isStdout = isStdout;
	}

	/**
	 * Create an OutputDestination for a file path.
	 */
	static toFile(path: string): OutputDestination {
		return new OutputDestination(path, false);
	}

	/**
	 * Create an OutputDestination for stdout.
	 */
	static toStdout(): OutputDestination {
		return new OutputDestination(undefined, true);
	}

	/**
	 * Create an OutputDestination from a path or 'stdout' string.
	 */
	static from(path: string | 'stdout' | undefined): OutputDestination {
		if (!path || path === 'stdout') {
			return OutputDestination.toStdout();
		}

		return OutputDestination.toFile(path);
	}

	/**
	 * Check if this is stdout destination.
	 */
	isStdout(): boolean {
		return this._isStdout;
	}

	/**
	 * Check if this is a file destination.
	 */
	isFile(): boolean {
		return !this._isStdout && this.path !== undefined;
	}
}

/**
 * Conversion request.
 *
 * This is an entity that represents a request to convert markdown.
 * It encapsulates all the information needed for conversion.
 */
export class ConversionRequest {
	constructor(
		public readonly input: InputSource,
		public readonly output: OutputDestination,
		public readonly format: 'pdf' | 'html',
	) {}

	/**
	 * Check if this is a PDF conversion request.
	 */
	isPdf(): boolean {
		return this.format === 'pdf';
	}

	/**
	 * Check if this is an HTML conversion request.
	 */
	isHtml(): boolean {
		return this.format === 'html';
	}
}
