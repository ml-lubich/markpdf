/**
 * Mermaid Processing - Compatibility Export
 *
 * @deprecated Import from './services/MermaidProcessorService' instead
 * This file exists for backward compatibility with existing tests.
 */

// Legacy function exports for backward compatibility
import type { Browser } from 'puppeteer';
import { MermaidProcessorService } from './services/MermaidProcessorService.js';
import type { MermaidProcessResult } from './interfaces.js';

export { MermaidProcessorService } from './services/MermaidProcessorService.js';
export type { MermaidProcessResult } from './interfaces.js';

const processor = new MermaidProcessorService();

/**
 * @deprecated Use MermaidProcessorService.processCharts() instead
 */
export async function processMermaidCharts(
	markdown: string,
	browser: Browser,
	baseDir: string,
	markdownDir?: string,
	serverPort?: number,
): Promise<MermaidProcessResult> {
	return processor.processCharts(markdown, browser, baseDir, markdownDir, serverPort);
}

/**
 * @deprecated Use MermaidProcessorService.cleanup() instead
 */
export async function cleanupMermaidImages(imageFiles: string[]): Promise<void> {
	return processor.cleanup(imageFiles);
}
