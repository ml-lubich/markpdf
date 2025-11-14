/**
 * Tests for Mermaid Image Generation
 *
 * Verifies that Mermaid charts are actually rendered to image files
 * with valid content, not just that the code executes.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService.js';
import { processMermaidCharts } from '../lib/process-mermaid.js';
import { MERMAID_CONSTANTS } from '../lib/config/constants.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('processCharts should generate actual image files', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9000);

	t.is(result.imageFiles.length, 1);
	t.truthy(result.imageFiles[0]);

	// Verify file actually exists
	const filePath = result.imageFiles[0]!;
	const exists = await fs
		.access(filePath)
		.then(() => true)
		.catch(() => false);
	t.true(exists, 'Image file should exist');

	// Verify file has content (not empty)
	const stats = await fs.stat(filePath);
	t.true(stats.size > 0, 'Image file should not be empty');
	t.true(stats.size > 100, 'Image file should be substantial (at least 100 bytes)');

	// Verify file is a PNG by checking magic bytes
	const buffer = await fs.readFile(filePath);
	const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const isPng = buffer.subarray(0, 8).equals(pngMagicBytes);
	t.true(isPng, 'File should be a valid PNG image');

	// Cleanup
	await fs.unlink(filePath).catch(() => {});
});

test('processCharts should generate multiple image files for multiple charts', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram
    A->>B: Hello
\`\`\`

Done.`;

	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9001);

	t.is(result.imageFiles.length, 2);

	// Verify all files exist and are valid
	for (const filePath of result.imageFiles) {
		const exists = await fs
			.access(filePath)
			.then(() => true)
			.catch(() => false);
		t.true(exists, `Image file should exist: ${filePath}`);

		const stats = await fs.stat(filePath);
		t.true(stats.size > 0, `Image file should not be empty: ${filePath}`);

		// Verify PNG format
		const buffer = await fs.readFile(filePath);
		const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const isPng = buffer.subarray(0, 8).equals(pngMagicBytes);
		t.true(isPng, `File should be a valid PNG: ${filePath}`);
	}

	// Cleanup
	for (const filePath of result.imageFiles) {
		await fs.unlink(filePath).catch(() => {});
	}
});

test('processMermaidCharts function should generate actual image files', async (t) => {
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph LR\n    A --> B\n    B --> C\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd(), undefined, 9002);

	t.is(result.imageFiles.length, 1);
	t.truthy(result.imageFiles[0]);

	// Verify file exists and is valid
	const filePath = result.imageFiles[0]!;
	const exists = await fs
		.access(filePath)
		.then(() => true)
		.catch(() => false);
	t.true(exists);

	const stats = await fs.stat(filePath);
	t.true(stats.size > 0);

	// Verify PNG format
	const buffer = await fs.readFile(filePath);
	const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const isPng = buffer.subarray(0, 8).equals(pngMagicBytes);
	t.true(isPng);

	// Cleanup
	await fs.unlink(filePath).catch(() => {});
});

test('generated images should have different content for different charts', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown1 = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const markdown2 = `# Test\n\n\`\`\`mermaid\ngraph LR\n    A --> B\n    B --> C\n\`\`\`\n\nDone.`;

	const [result1, result2] = await Promise.all([
		processor.processCharts(markdown1, browser, process.cwd(), undefined, 9003),
		processor.processCharts(markdown2, browser, process.cwd(), undefined, 9004),
	]);

	t.is(result1.imageFiles.length, 1);
	t.is(result2.imageFiles.length, 1);

	// Read both image files
	const image1 = await fs.readFile(result1.imageFiles[0]!);
	const image2 = await fs.readFile(result2.imageFiles[0]!);

	// Images should be different (different charts = different content)
	t.not(image1.length, image2.length, 'Different charts should produce different sized images');

	// Both should be valid PNGs
	const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	t.true(image1.subarray(0, 8).equals(pngMagicBytes));
	t.true(image2.subarray(0, 8).equals(pngMagicBytes));

	// Cleanup
	for (const filePath of [...result1.imageFiles, ...result2.imageFiles]) {
		await fs.unlink(filePath).catch(() => {});
	}
});

test('generated images should be readable and have reasonable dimensions', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n    B --> C\n    C --> D\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9005);

	t.is(result.imageFiles.length, 1);

	const filePath = result.imageFiles[0]!;
	const buffer = await fs.readFile(filePath);

	// Verify PNG structure - should have IHDR chunk
	const ihdrIndex = buffer.indexOf('IHDR');
	t.true(ihdrIndex > 0, 'PNG should contain IHDR chunk');

	// Extract width and height from IHDR chunk (bytes 16-23 after IHDR)
	// PNG format: [signature][IHDR][width:4bytes][height:4bytes]...
	const ihdrOffset = ihdrIndex + 4; // Skip "IHDR" string
	const width = buffer.readUInt32BE(ihdrOffset);
	const height = buffer.readUInt32BE(ihdrOffset + 4);

	t.true(width > 0, 'Image should have positive width');
	t.true(height > 0, 'Image should have positive height');
	t.true(width < 10_000, 'Image width should be reasonable');
	t.true(height < 10_000, 'Image height should be reasonable');

	// Cleanup
	await fs.unlink(filePath).catch(() => {});
});

test('images should be saved to temp directory', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9006);

	t.is(result.imageFiles.length, 1);

	const filePath = result.imageFiles[0]!;
	const expectedDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);

	// File should be in the temp directory
	t.true(filePath.startsWith(expectedDir), `File should be in temp directory: ${filePath}`);

	// Cleanup
	await fs.unlink(filePath).catch(() => {});
});

test('same content should generate same filename but different file instances', async (t) => {
	const processor1 = new MermaidProcessorService();
	const processor2 = new MermaidProcessorService();
	const mermaidCode = 'graph TD\n    A --> B';
	const markdown = `# Test\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nDone.`;

	const [result1, result2] = await Promise.all([
		processor1.processCharts(markdown, browser, process.cwd(), undefined, 9007),
		processor2.processCharts(markdown, browser, process.cwd(), undefined, 9008),
	]);

	t.is(result1.imageFiles.length, 1);
	t.is(result2.imageFiles.length, 1);

	const filename1 = result1.imageFiles[0]!.split(/[/\\]/).pop();
	const filename2 = result2.imageFiles[0]!.split(/[/\\]/).pop();

	// Filenames should be identical (same content = same hash)
	t.is(filename1, filename2);

	// But files might be in different temp directories or be separate instances
	// Both should be valid images
	const image1 = await fs.readFile(result1.imageFiles[0]!);
	const image2 = await fs.readFile(result2.imageFiles[0]!);

	const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	t.true(image1.subarray(0, 8).equals(pngMagicBytes));
	t.true(image2.subarray(0, 8).equals(pngMagicBytes));

	// Cleanup
	for (const filePath of [...result1.imageFiles, ...result2.imageFiles]) {
		await fs.unlink(filePath).catch(() => {});
	}
});
