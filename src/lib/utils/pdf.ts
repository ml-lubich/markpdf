/**
 * PDF Utilities
 * Pure utility functions for PDF-related operations.
 */

import { PDFOptions } from 'puppeteer';

/**
 * Get a margin object from a CSS-like margin string.
 *
 * Converts CSS margin shorthand notation to a Puppeteer margin object.
 * Supports 1-4 value syntax (same as CSS).
 *
 * @param margin - CSS margin string (e.g., '10mm', '10mm 20mm', '10mm 20mm 30mm', '10mm 20mm 30mm 40mm')
 * @returns Margin object with top, right, bottom, left properties
 * @throws TypeError if margin is not a string
 * @throws Error if margin has more than 4 values
 */
export const getMarginObject = (margin: string): PDFOptions['margin'] => {
	if (typeof margin !== 'string') {
		throw new TypeError('margin needs to be a string.');
	}

	const [top, right, bottom, left, ...remaining] = margin.split(' ');

	if (remaining.length > 0) {
		throw new Error(`invalid margin input "${margin}": can have max 4 values.`);
	}

	return left
		? { top, right, bottom, left }
		: bottom
		? { top, right, bottom, left: right }
		: right
		? { top, right, bottom: top, left: right }
		: top
		? { top, right: top, bottom: top, left: top }
		: undefined;
};

