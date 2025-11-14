/**
 * HTML Renderer
 * Generates HTML documents from markdown content.
 */

import { type Config } from '../config.js';
import { MarkdownParserService } from '../services/MarkdownParserService.js';

/**
 * Generates a HTML document from a markdown string and returns it as a string.
 *
 * @param md - Markdown content to convert
 * @param config - Configuration object
 * @returns HTML document as string
 */
export const getHtml = (md: string, config: Config): string => {
	const parser = new MarkdownParserService(config.marked_options, config.marked_extensions);
	const htmlContent = parser.parse(md);

	return `<!DOCTYPE html>
<html>
	<head><title>${config.document_title}</title><meta charset="utf-8"></head>
	<body class="${config.body_class.join(' ')}">
		${htmlContent}
	</body>
</html>`;
};
