/**
 * MermaidProcessorService - Handles processing Mermaid diagrams.
 * Renders Mermaid code blocks to images and replaces them in markdown.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Browser, type Page } from 'puppeteer';
import { type IMermaidProcessor, type MermaidProcessResult } from '../interfaces.js';
import { MERMAID_CONSTANTS, IMAGE_CONSTANTS } from '../config/constants.js';
import { generateContentHash } from '../utils/hash.js';

export class MermaidProcessorService implements IMermaidProcessor {
	/**
	 * Process Mermaid charts in markdown by rendering them to images.
	 *
	 * @param markdown - The markdown content to process
	 * @param browser - Puppeteer browser instance for rendering
	 * @param baseDir - Base directory (unused, kept for compatibility)
	 * @param markdownDir - Markdown file directory (unused, kept for compatibility)
	 * @param _serverPort - HTTP server port (unused, images are embedded as data URIs)
	 * @returns Processed markdown with image references
	 */
	public async processCharts(
		markdown: string,
		browser: Browser,
		_baseDir: string,
		_markdownDir?: string,
		_serverPort?: number,
	): Promise<MermaidProcessResult> {
		const imageFiles: string[] = [];
		const warnings: string[] = [];
		let processedMarkdown = markdown;
		let matchIndex = 0;

		const imageDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
		const matches = [...markdown.matchAll(MERMAID_CONSTANTS.BLOCK_REGEX)];

		if (matches.length === 0) {
			return {
				processedMarkdown: markdown,
				imageFiles: [],
				warnings: [],
			};
		}

		await this.ensureImageDirectory(imageDir);

		for (const match of matches) {
			const mermaidCode = match[1]?.trim();
			const fullMatch = match[0];

			if (!mermaidCode) {
				warnings.push(`Skipping empty Mermaid chart at index ${matchIndex}`);
				matchIndex++;
				continue;
			}

			try {
				// Generate short 8-character hash for filename
				const contentHash = generateContentHash(mermaidCode, 8);
				const imagePath = await this.renderMermaidToImage(mermaidCode, browser, imageDir, contentHash, matchIndex);
				imageFiles.push(imagePath);

				// Read PNG and convert to base64 data URI for embedding in PDF
				const imageBuffer = await fs.readFile(imagePath);
				const imageBase64 = imageBuffer.toString('base64');
				const imageDataUri = `data:${IMAGE_CONSTANTS.MIME_TYPE};base64,${imageBase64}`;

				// Use HTML img tag directly - marked will pass it through
				const imageMarkdown = `<div class="${MERMAID_CONSTANTS.CONTAINER_CLASS}"><img src="${imageDataUri}" alt="Mermaid Chart ${matchIndex + 1}" style="max-width: 100%; height: auto;" /></div>`;

				processedMarkdown = processedMarkdown.replace(fullMatch, imageMarkdown);
				matchIndex++;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				warnings.push(`Failed to render Mermaid chart ${matchIndex + 1}: ${errorMessage}`);
				matchIndex++;
			}
		}

		return {
			processedMarkdown,
			imageFiles,
			warnings,
		};
	}

	/**
	 * Clean up temporary Mermaid image files.
	 *
	 * @param imageFiles - Array of image file paths to delete
	 */
	public async cleanup(imageFiles: string[]): Promise<void> {
		for (const imagePath of imageFiles) {
			try {
				await fs.unlink(imagePath);
			} catch {
				// Ignore errors - file might already be deleted
			}
		}

		try {
			const temporaryImageDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
			const files = await fs.readdir(temporaryImageDir);
			if (files.length === 0) {
				await fs.rmdir(temporaryImageDir);
			}
		} catch {
			// Ignore errors - directory might not exist
		}
	}

	/**
	 * Render a Mermaid chart to a PNG image.
	 *
	 * @param mermaidCode - The Mermaid diagram code
	 * @param browser - Puppeteer browser instance
	 * @param imageDir - Directory for saving images
	 * @param contentHash - Content-based hash for unique filename
	 * @param index - Index for ordering (used in filename)
	 * @returns Path to the generated image file
	 */
	private async renderMermaidToImage(
		mermaidCode: string,
		browser: Browser,
		imageDir: string,
		contentHash: string,
		index: number,
	): Promise<string> {
		const page = await browser.newPage();

		try {
			const html = this.createMermaidHtml(mermaidCode);
			await page.setContent(html, { waitUntil: 'networkidle0' });

			await this.waitForMermaidRender(page);

			const dimensions = await this.getSvgDimensions(page);
			if (!dimensions) {
				throw new Error('Could not find rendered Mermaid SVG element');
			}

			await page.setViewport({
				width: Math.ceil(dimensions.width) + MERMAID_CONSTANTS.CHART_PADDING_PX,
				height: Math.ceil(dimensions.height) + MERMAID_CONSTANTS.CHART_PADDING_PX,
			});

			// Use content hash for filename to ensure uniqueness across parallel processes
			// Format: mermaid-{hash}-{index}.png
			const imageFilename = `mermaid-${contentHash}-${index}${IMAGE_CONSTANTS.EXTENSION}`;
			const temporaryImagePath = join(imageDir, imageFilename);
			const mermaidElement = await page.$('.mermaid');
			if (!mermaidElement) {
				throw new Error('Mermaid element not found for screenshot');
			}

			await mermaidElement.screenshot({
				path: temporaryImagePath,
				type: 'png',
			} as any);

			return temporaryImagePath;
		} finally {
			await page.close();
		}
	}

	/**
	 * Create HTML page with Mermaid.js for rendering.
	 *
	 * Note: mermaidCode is inserted directly without escaping because:
	 * 1. Mermaid syntax requires special characters (<, >, etc.) to function
	 * 2. This processes the user's own markdown file (trusted input)
	 * 3. The code is executed in an isolated Puppeteer context
	 */
	private createMermaidHtml(mermaidCode: string): string {
		return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<script src="${MERMAID_CONSTANTS.CDN_URL}"></script>
	<style>
		body {
			margin: 0;
			padding: 20px;
			background: white;
		}
		.mermaid {
			display: flex;
			justify-content: center;
			align-items: center;
		}
	</style>
</head>
<body>
	<div class="mermaid">
${mermaidCode}
	</div>
	<script>
		mermaid.initialize({ startOnLoad: true, theme: 'default' });
	</script>
</body>
</html>`;
	}

	/**
	 * Wait for Mermaid to render the SVG.
	 */
	private async waitForMermaidRender(page: Page): Promise<void> {
		await page
			.waitForFunction(
				() => {
					const mermaidElement = document.querySelector('.mermaid svg');
					return mermaidElement !== null;
				},
				{ timeout: MERMAID_CONSTANTS.RENDER_TIMEOUT_MS },
			)
			.catch(() => {
				throw new Error('Mermaid chart did not render within timeout period');
			});
	}

	/**
	 * Get SVG element dimensions.
	 */
	private async getSvgDimensions(page: Page): Promise<{ width: number; height: number } | undefined> {
		return page.evaluate(() => {
			const svg = document.querySelector('.mermaid svg');
			if (!svg) {
				return undefined;
			}

			return {
				width: svg.getBoundingClientRect().width,
				height: svg.getBoundingClientRect().height,
			};
		});
	}

	/**
	 * Ensure image directory exists.
	 */
	private async ensureImageDirectory(imageDir: string): Promise<void> {
		await fs.mkdir(imageDir, { recursive: true });
	}
}
