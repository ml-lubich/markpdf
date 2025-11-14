/**
 * Result type for functional error handling.
 *
 * Following Clean Code principles, this eliminates exception-based error handling
 * in favor of explicit, type-safe error handling. This makes errors part of the
 * type system and forces callers to handle them explicitly.
 *
 * Inspired by Rust's Result type and functional programming best practices.
 */

/**
 * Result type that represents either success (Ok) or failure (Err).
 *
 * @template T - The type of the success value
 * @template E - The type of the error value (defaults to Error)
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Success variant of Result.
 */
export class Ok<T> {
	readonly success = true as const;

	constructor(readonly value: T) {}

	/**
	 * Check if this is an Ok result.
	 */
	isOk(): this is Ok<T> {
		return true;
	}

	/**
	 * Check if this is an Err result.
	 */
	isErr(): this is Err<never> {
		return false;
	}

	/**
	 * Map the value if this is Ok, otherwise return unchanged.
	 */
	map<U>(function_: (value: T) => U): Result<U, never> {
		return ok(function_(this.value));
	}

	/**
	 * Map the error if this is Err, otherwise return unchanged.
	 */
	mapErr<F>(): Result<T, F> {
		return this as unknown as Result<T, F>;
	}

	/**
	 * Unwrap the value, throwing if this is Err.
	 */
	unwrap(): T {
		return this.value;
	}

	/**
	 * Unwrap the value or return a default.
	 */
	unwrapOr(): T {
		return this.value;
	}

	/**
	 * Unwrap the value or compute a default.
	 */
	unwrapOrElse(): T {
		return this.value;
	}
}

/**
 * Error variant of Result.
 */
export class Err<E> {
	readonly success = false as const;

	constructor(readonly error: E) {}

	/**
	 * Check if this is an Ok result.
	 */
	isOk(): this is Ok<never> {
		return false;
	}

	/**
	 * Check if this is an Err result.
	 */
	isErr(): this is Err<E> {
		return true;
	}

	/**
	 * Map the value if this is Ok, otherwise return unchanged.
	 */
	map<U>(): Result<U, E> {
		return this as unknown as Result<U, E>;
	}

	/**
	 * Map the error if this is Err, otherwise return unchanged.
	 */
	mapErr<F>(function_: (error: E) => F): Result<never, F> {
		return err(function_(this.error));
	}

	/**
	 * Unwrap the value, throwing if this is Err.
	 */
	unwrap(): never {
		throw this.error;
	}

	/**
	 * Unwrap the value or return a default.
	 */
	unwrapOr<U>(defaultValue: U): U {
		return defaultValue;
	}

	/**
	 * Unwrap the value or compute a default.
	 */
	unwrapOrElse<U>(function_: (error: E) => U): U {
		return function_(this.error);
	}
}

/**
 * Create an Ok result.
 */
export function ok<T>(value: T): Ok<T> {
	return new Ok(value);
}

/**
 * Create an Err result.
 */
export function err<E>(error: E): Err<E> {
	return new Err(error);
}

/**
 * Check if a Result is Ok.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result.isOk();
}

/**
 * Check if a Result is Err.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return result.isErr();
}

/**
 * Unwrap a Result or throw an error.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (result.isOk()) {
		return result.value;
	}

	throw result.error;
}

/**
 * Unwrap a Result or return a default value.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
	if (result.isOk()) {
		return result.value;
	}

	return defaultValue;
}

/**
 * Unwrap a Result or compute a default value.
 */
export function unwrapOrElse<T, E>(result: Result<T, E>, function_: (error: E) => T): T {
	if (result.isOk()) {
		return result.value;
	}

	return function_(result.error);
}
