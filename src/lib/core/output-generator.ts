/**
 * Output Generator
 * Generates PDF or HTML output from HTML content using Puppeteer.
 */

import { join, posix, sep } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import { type Config } from '../config.js';
import { isHttpUrl } from '../utils/url.js';

export type Output = PdfOutput | HtmlOutput;

export type PdfOutput = {
	content: Buffer;
} & BasicOutput;

export type HtmlOutput = {
	content: string;
} & BasicOutput;

type BasicOutput = {
	filename: string | undefined;
};

/**
 * Store a single browser instance reference so that we can re-use it.
 */
let browserPromise: Promise<Browser> | undefined;

/**
 * Close the browser instance.
 */
export const closeBrowser = async (): Promise<void> => (await browserPromise)?.close();

/**
 * Generate PDF or HTML output from HTML content.
 *
 * This function creates a Puppeteer page, loads the HTML content, applies
 * stylesheets and scripts, and generates either a PDF or HTML output based
 * on the configuration.
 *
 * @param html - The HTML content to convert
 * @param relativePath - Relative path for the HTML file (used for serving)
 * @param config - Configuration object (PdfConfig or HtmlConfig)
 * @param browserRef - Optional browser instance to reuse (otherwise creates new one)
 * @returns Promise resolving to output object with filename and content
 */
export async function generateOutput(
	html: string,
	relativePath: string,
	config: Config,
	browserReference?: Browser,
): Promise<Output> {
	async function getBrowser() {
		if (browserReference) {
			return browserReference;
		}

		browserPromise ||= puppeteer.launch({
			headless: config.launch_options?.headless ?? 'new',
			devtools: config.devtools,
			...config.launch_options,
		} as any);

		return browserPromise;
	}

	const browser = await getBrowser();

	const page = await browser.newPage();

	// Windows-compatible path conversion
	const urlPathname = join(relativePath, 'index.html').split(sep).join(posix.sep);

	// Try to navigate with timeout, but don't fail if it doesn't work
	// The setContent below will overwrite anyway
	if (config.port) {
		try {
			await page
				.goto(`http://localhost:${config.port}/${urlPathname}`, {
					waitUntil: 'domcontentloaded',
					timeout: 5000,
				})
				.catch(() => {
					// Ignore navigation errors - we'll set content directly
				});
		} catch {
			// Navigation failed, continue with setContent
		}
	}

	await page.setContent(html); // overwrite the page content with what was generated from the markdown

	for (const stylesheet of config.stylesheet) {
		await page.addStyleTag(isHttpUrl(stylesheet) ? { url: stylesheet } : { path: stylesheet });
	}

	if (config.css) {
		await page.addStyleTag({ content: config.css });
	}

	for (const scriptTagOptions of config.script) {
		await page.addScriptTag(scriptTagOptions);
	}

	// Wait for all resources to load - ensure images and other resources are fully loaded
	// Since we use data URIs for Mermaid images (instant), we only need a small fixed delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	let outputFileContent: string | Buffer = '';

	if (config.devtools) {
		await new Promise<void>((resolve) => {
			page.on('close', resolve);
		});
	} else if (config.as_html) {
		outputFileContent = await page.content();
	} else {
		const pdfBuffer = await page.pdf(config.pdf_options);
		outputFileContent = Buffer.from(pdfBuffer);
	}

	await page.close();

	return {
		filename: config.dest,
		content: outputFileContent,
	} as Output;
}
