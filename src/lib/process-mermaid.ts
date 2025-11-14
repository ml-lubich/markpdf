/**
 * Mermaid Processing - Compatibility Export
 * 
 * @deprecated Import from './services/MermaidProcessorService' instead
 * This file exists for backward compatibility with existing tests.
 */

export { MermaidProcessorService } from './services/MermaidProcessorService';
export type { MermaidProcessResult } from './interfaces';

// Legacy function exports for backward compatibility
import { MermaidProcessorService } from './services/MermaidProcessorService';
import type { Browser } from 'puppeteer';
import type { MermaidProcessResult } from './interfaces';

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
