/**
 * Output Generation - Compatibility Export
 * 
 * @deprecated Import from './core/output-generator' or './services/OutputGeneratorService' instead
 * This file exists for backward compatibility with existing tests.
 */

export * from './core/output-generator';

// Legacy function exports for backward compatibility
import { OutputGeneratorService } from './services/OutputGeneratorService';
import type { Browser } from 'puppeteer';
import type { Config } from './config';
import type { Output } from './core/output-generator';

const generator = new OutputGeneratorService();

/**
 * @deprecated Use OutputGeneratorService.generate() instead
 */
export async function generateOutput(
	html: string,
	relativePath: string,
	config: Config,
	browserRef?: Browser,
): Promise<Output | undefined> {
	return generator.generate(html, relativePath, config, browserRef) as Promise<Output | undefined>;
}

/**
 * @deprecated Use OutputGeneratorService.closeBrowser() instead
 */
export async function closeBrowser(): Promise<void> {
	return generator.closeBrowser();
}
