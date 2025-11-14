/**
 * Marked Renderer
 * Configures and provides Marked markdown parser with syntax highlighting.
 */

import hljs from 'highlight.js';
import { marked } from 'marked';
import type { MarkedOptions } from '../config.js';

/**
 * Creates a configured Marked instance with syntax highlighting support.
 * Uses modern Marked v15 API with proper configuration and error handling.
 *
 * @param options - Marked parser options
 * @param extensions - Marked extensions to apply
 * @returns Configured Marked instance
 */
export const createMarkedRenderer = (options: MarkedOptions, extensions: any[]) => {
	// Configure highlight.js integration
	const highlightFunction = (code: string, languageName: string) => {
		const language = hljs.getLanguage(languageName) ? languageName : 'plaintext';
		try {
			return hljs.highlight(code, { language }).value;
		} catch {
			// Fallback to plaintext if highlighting fails
			return hljs.highlight(code, { language: 'plaintext' }).value;
		}
	};

	// Configure marked with options and highlight function
	marked.setOptions({
		highlight: highlightFunction,
		langPrefix: 'hljs ',
		...options,
	});

	// Apply extensions if provided
	if (extensions.length > 0) {
		marked.use(...extensions);
	}

	return marked;
};

/**
 * Returns a function that renders markdown to HTML.
 * This maintains backward compatibility with the existing API.
 *
 * @param options - Marked parser options
 * @param extensions - Marked extensions to apply
 * @returns Function that takes markdown and returns HTML
 */
export const getMarked = (options: MarkedOptions, extensions: any[]) => {
	createMarkedRenderer(options, extensions);
	return (markdown: string) => {
		try {
			return marked(markdown);
		} catch (error) {
			throw new Error(`Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`);
		}
	};
};
