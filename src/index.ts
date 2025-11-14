#!/usr/bin/env node

import getPort from 'get-port';
import puppeteer from 'puppeteer';
import { Config, defaultConfig, HtmlConfig, PdfConfig } from './lib/config';
import { HtmlOutput, Output, PdfOutput } from './lib/core/output-generator';
import { getDir } from './lib/utils/path';
import { convertMdToPdf } from './lib/core/converter';
import { ServerService } from './lib/services/ServerService';
import { OutputGeneratorService } from './lib/services/OutputGeneratorService';

type Input = ContentInput | PathInput;

interface ContentInput {
	content: string;
}

interface PathInput {
	path: string;
}

const hasContent = (input: Input): input is ContentInput => 'content' in input;
const hasPath = (input: Input): input is PathInput => 'path' in input;

/**
 * Convert a markdown file or content to PDF or HTML.
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
 * ```
 */
export async function mdToPdf(input: ContentInput | PathInput, config?: Partial<PdfConfig>): Promise<PdfOutput>;
export async function mdToPdf(input: ContentInput | PathInput, config?: Partial<HtmlConfig>): Promise<HtmlOutput>;
export async function mdToPdf(input: Input, config: Partial<Config> = {}): Promise<Output> {
	if (!hasContent(input) && !hasPath(input)) {
		throw new Error('The input is missing one of the properties "content" or "path".');
	}

	if (!config.port) {
		config.port = await getPort();
	}

	if (!config.basedir) {
		config.basedir = 'path' in input ? getDir(input.path) : process.cwd();
	}

	if (!config.dest) {
		config.dest = '';
	}

	const mergedConfig: Config = {
		...defaultConfig,
		...config,
		pdf_options: { ...defaultConfig.pdf_options, ...config.pdf_options },
	};

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

export interface PackageJson {
	engines: {
		node: string;
	};
	version: string;
}
