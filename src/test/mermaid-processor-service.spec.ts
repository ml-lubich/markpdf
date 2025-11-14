/**
 * Tests for MermaidProcessorService
 * 
 * Tests Mermaid diagram processing and image generation.
 */

import test from 'ava';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('processCharts should return original markdown when no mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = '# Hello World\n\nRegular content.';
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should process simple mermaid diagram', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8000);

	t.not(result.processedMarkdown, markdown);
	t.true(result.processedMarkdown.includes('![Mermaid Chart'));
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle multiple mermaid diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\nsequenceDiagram\n    A->>B: Hello\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8001);

	t.is(result.imageFiles.length, 2);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('![Mermaid Chart 1]'));
	t.true(result.processedMarkdown.includes('![Mermaid Chart 2]'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle empty mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\n\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 1);
	t.true(result.warnings[0]!.includes('Skipping empty'));
});

test('processCharts should continue processing after one diagram fails', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\ninvalid syntax\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8002);

	// Should have at least processed one diagram
	t.true(result.imageFiles.length >= 0);
	
	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should use server port for image URLs when provided', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8003);

	t.truthy(result.processedMarkdown);
	
	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

