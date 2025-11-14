/**
 * Marked Parser - Compatibility Export
 *
 * @deprecated Import from './services/MarkdownParserService' instead
 * This file exists for backward compatibility with existing tests.
 */

import type { marked } from 'marked';

// Legacy function exports for backward compatibility
import { MarkdownParserService } from './services/MarkdownParserService.js';

export { MarkdownParserService } from './services/MarkdownParserService.js';

/**
 * @deprecated Use MarkdownParserService directly instead
 */
export function createMarkedRenderer(options: marked.MarkedOptions, extensions: any[]): MarkedParser {
	const service = new MarkdownParserService(options, extensions);
	return {
		parse: (markdown: string) => service.parse(markdown),
	};
}

type MarkedParser = {
	parse(markdown: string): string;
};

/**
 * @deprecated Use MarkdownParserService directly instead
 */
export function getMarked(options: marked.MarkedOptions, extensions: any[]): (markdown: string) => string {
	const service = new MarkdownParserService(options, extensions);
	return (markdown: string) => service.parse(markdown);
}
