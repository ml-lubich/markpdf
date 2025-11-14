/**
 * URL Utilities
 * Pure utility functions for URL validation and manipulation.
 */

/**
 * Check whether the input string is a valid HTTP or HTTPS URL.
 *
 * Validates that the string can be parsed as a URL and uses HTTP/HTTPS protocol.
 * Returns false for file://, ftp://, or other protocols.
 *
 * @param input - String to check
 * @returns `true` if input is a valid HTTP/HTTPS URL, `false` otherwise
 */
export const isHttpUrl = (input: string): boolean => {
	try {
		return new URL(input).protocol.startsWith('http');
	} catch {
		return false;
	}
};
