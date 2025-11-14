/**
 * MarkdownParserService - Handles parsing markdown to HTML.
 * Uses the Marked library with syntax highlighting support.
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import { type IMarkdownParser } from '../interfaces/index.js';
import { type MarkedOptions } from '../config.js';

export class MarkdownParserService implements IMarkdownParser {
	private readonly options: MarkedOptions;
	private readonly extensions: any[];

	constructor(options: MarkedOptions = {}, extensions: any[] = []) {
		this.options = options;
		this.extensions = extensions;
		this.configureMarked();
	}

	/**
	 * Configure the Marked parser with syntax highlighting.
	 */
	private configureMarked(): void {
		const highlightFunction = (code: string, languageName: string): string => {
			const language = hljs.getLanguage(languageName) ? languageName : 'plaintext';
			try {
				return hljs.highlight(code, { language }).value;
			} catch {
				return hljs.highlight(code, { language: 'plaintext' }).value;
			}
		};

		marked.setOptions({
			highlight: highlightFunction,
			langPrefix: 'hljs ',
			...this.options,
		});

		if (this.extensions.length > 0) {
			marked.use(...this.extensions);
		}
	}

	/**
	 * Parse markdown content to HTML.
	 *
	 * @param markdown - The markdown content to parse
	 * @returns HTML string
	 * @throws Error if parsing fails
	 */
	public parse(markdown: string): string {
		try {
			return marked(markdown);
		} catch (error) {
			throw new Error(`Failed to parse markdown: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
