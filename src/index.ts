#!/usr/bin/env node

import getPort from 'get-port';
import puppeteer from 'puppeteer';
import { type Config, defaultConfig, type HtmlConfig, type PdfConfig, type DocxConfig } from './lib/config.js';
import { type HtmlOutput, type Output, type PdfOutput, type DocxOutput } from './lib/core/output-generator.js';
import { getDir } from './lib/utils/path.js';
import { convertMdToPdf } from './lib/core/converter.js';
import { ServerService } from './lib/services/ServerService.js';
import { OutputGeneratorService } from './lib/services/OutputGeneratorService.js';

type Input = ContentInput | PathInput;

type ContentInput = {
	content: string;
};

type PathInput = {
	path: string;
};

const hasContent = (input: Input): input is ContentInput => 'content' in input;
const hasPath = (input: Input): input is PathInput => 'path' in input;

/**
 * Convert a markdown file or content to PDF, HTML, or DOCX.
 *
 * This is the main public API function. It handles server setup, browser management,
 * and cleanup automatically.
 *
 * @param input - Either `{ path: string }` for file input or `{ content: string }` for content input
 * @param config - Optional partial configuration that will be merged with defaults
 * @returns Promise resolving to output object with filename and content
 * @throws Error if input is invalid or conversion fails
 *
 * @example
 * ```typescript
 * // Convert from file
 * const pdf = await mdToPdf({ path: 'document.md' });
 *
 * // Convert from content
 * const pdf = await mdToPdf({ content: '# Hello' });
 *
 * // With custom config
 * const pdf = await mdToPdf(
 *   { path: 'document.md' },
 *   { pdf_options: { format: 'Letter' } }
 * );
 *
 * // Generate HTML instead
 * const html = await mdToPdf({ content: '# Hello' }, { as_html: true });
 *
 * // Generate DOCX instead
 * const docx = await mdToPdf({ content: '# Hello' }, { as_docx: true });
 * ```
 */
export async function mdToPdf(input: ContentInput | PathInput, config?: Partial<PdfConfig>): Promise<PdfOutput>;
export async function mdToPdf(input: ContentInput | PathInput, config?: Partial<HtmlConfig>): Promise<HtmlOutput>;
export async function mdToPdf(input: ContentInput | PathInput, config?: Partial<DocxConfig>): Promise<DocxOutput>;
export async function mdToPdf(input: Input, config: Partial<Config> = {}): Promise<Output> {
	if (!hasContent(input) && !hasPath(input)) {
		throw new Error('The input is missing one of the properties "content" or "path".');
	}

	config.port ||= await getPort();

	config.basedir ||= 'path' in input ? getDir(input.path) : process.cwd();

	config.dest ||= '';

	const mergedConfig: Config = {
		...defaultConfig,
		...config,
		pdf_options: { ...defaultConfig.pdf_options, ...config.pdf_options },
		as_html: config.as_html ?? false,
		as_docx: config.as_docx ?? false,
	} as Config;

	// Start server
	const serverService = new ServerService();
	await serverService.start(mergedConfig);

	// Create browser
	const outputGenerator = new OutputGeneratorService();
	const browser = await puppeteer.launch({
		headless: config.launch_options?.headless ?? 'new',
		devtools: config.devtools,
		...config.launch_options,
	} as any);

	try {
		const result = await convertMdToPdf(input, mergedConfig, { browser });
		// Convert to Output type for compatibility
		return result as Output;
	} finally {
		await browser.close();
		await outputGenerator.closeBrowser();
		await serverService.stop();
	}
}

export default mdToPdf;

export type PackageJson = {
	engines: {
		node: string;
	};
	version: string;
};
