/**
 * Core Converter
 * Main conversion logic for markdown to PDF/HTML.
 */

import { Browser } from 'puppeteer';
import { Config } from '../config';
import { createConverterService } from '../services/ConverterService';
import { ConfigService } from '../services/ConfigService';
import { getOutputFilePath } from '../utils/file';

type CliArgs = typeof import('../../cli').cliFlags;

/**
 * Convert markdown content or file to PDF or HTML.
 *
 * This is the core conversion function that uses the ConverterService.
 * It handles CLI argument merging and delegates to the service layer.
 *
 * @param input - Either a file path object `{ path: string }` or content object `{ content: string }`
 * @param config - Configuration object for PDF/HTML generation
 * @param options - Optional parameters including CLI args and browser instance
 * @param options.args - CLI arguments to merge into config
 * @param options.browser - Optional Puppeteer browser instance to reuse
 * @returns Promise resolving to output object with filename and content
 */
export const convertMdToPdf = async (
	input: { path: string } | { content: string },
	config: Config,
	{
		args = {} as CliArgs,
		browser,
	}: {
		args?: CliArgs;
		browser?: Browser;
	} = {},
) => {
	const configService = new ConfigService();

	// Merge CLI args into config
	let mergedConfig = configService.mergeCliArgs(config, args as any);

	// Handle md-file-encoding from CLI args
	if (args['--md-file-encoding']) {
		mergedConfig.md_file_encoding = args['--md-file-encoding'];
	}

	// Handle gray-matter-options from CLI args
	if (args['--gray-matter-options']) {
		try {
			mergedConfig.gray_matter_options = JSON.parse(args['--gray-matter-options']);
		} catch {
			// Ignore invalid JSON
		}
	}

	// Set output destination if not provided
	if (!mergedConfig.dest && 'path' in input) {
		mergedConfig.dest = getOutputFilePath(input.path, mergedConfig.as_html ? 'html' : 'pdf');
	}

	// Create converter service with default dependencies and convert
	const converter = createConverterService();
	return converter.convert(input, mergedConfig, browser);
};

