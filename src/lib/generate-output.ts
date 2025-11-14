/**
 * Output Generation - Compatibility Export
 *
 * @deprecated Import from './core/output-generator' or './services/OutputGeneratorService' instead
 * This file exists for backward compatibility with existing tests.
 */

// Legacy function exports for backward compatibility
import type { Browser } from 'puppeteer';
import { OutputGeneratorService } from './services/OutputGeneratorService.js';
import type { Config } from './config.js';
import type { Output } from './core/output-generator.js';

export * from './core/output-generator.js';

const generator = new OutputGeneratorService();

/**
 * @deprecated Use OutputGeneratorService.generate() instead
 */
export async function generateOutput(
	html: string,
	relativePath: string,
	config: Config,
	browserReference?: Browser,
): Promise<Output | undefined> {
	return generator.generate(html, relativePath, config, browserReference) as Promise<Output | undefined>;
}

/**
 * @deprecated Use OutputGeneratorService.closeBrowser() instead
 */
export async function closeBrowser(): Promise<void> {
	return generator.closeBrowser();
}
