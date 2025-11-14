/**
 * Core Converter
 * Main conversion logic for markdown to PDF/HTML.
 */

import { type Browser } from 'puppeteer';
import { type Config } from '../config.js';
import { createConverterService } from '../services/ConverterService.js';
import { ConfigService } from '../services/ConfigService.js';
import { getOutputFilePath } from '../utils/file.js';

type CliArguments = typeof import('../../cli').cliFlags;

/**
 * Convert markdown content or file to PDF, HTML, or DOCX.
 *
 * This is the core conversion function that uses the ConverterService.
 * It handles CLI argument merging and delegates to the service layer.
 *
 * @param input - Either a file path object `{ path: string }` or content object `{ content: string }`
 * @param config - Configuration object for PDF/HTML/DOCX generation
 * @param options - Optional parameters including CLI args and browser instance
 * @param options.args - CLI arguments to merge into config
 * @param options.browser - Optional Puppeteer browser instance to reuse
 * @returns Promise resolving to output object with filename and content
 */
export const convertMdToPdf = async (
	input: { path: string } | { content: string },
	config: Config,
	{
		args: arguments_ = {} as CliArguments,
		browser,
	}: {
		args?: CliArguments;
		browser?: Browser;
	} = {},
) => {
	const configService = new ConfigService();

	// Merge CLI args into config
	const mergedConfig = configService.mergeCliArgs(config, arguments_ as any);

	// Handle md-file-encoding from CLI args
	if (arguments_['--md-file-encoding']) {
		mergedConfig.md_file_encoding = arguments_['--md-file-encoding'];
	}

	// Handle gray-matter-options from CLI args
	if (arguments_['--gray-matter-options']) {
		try {
			mergedConfig.gray_matter_options = JSON.parse(arguments_['--gray-matter-options']);
		} catch {
			// Ignore invalid JSON
		}
	}

	// Set output destination if not provided
	if (!mergedConfig.dest && 'path' in input) {
		const extension = mergedConfig.as_html ? 'html' : mergedConfig.as_docx ? 'docx' : 'pdf';
		mergedConfig.dest = getOutputFilePath(input.path, extension);
	}

	// Create converter service with default dependencies and convert
	const converter = createConverterService();
	return converter.convert(input, mergedConfig, browser);
};
