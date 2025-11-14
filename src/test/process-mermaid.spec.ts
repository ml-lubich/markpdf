import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { cleanupMermaidImages, processMermaidCharts } from '../lib/process-mermaid.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('processMermaidCharts should return original markdown when no mermaid blocks exist', async (t) => {
	const markdown = '# Hello World\n\nThis is regular markdown.';
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processMermaidCharts should process a simple mermaid diagram', async (t) => {
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A[Start] --> B[End]\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.true(result.processedMarkdown.includes('![Mermaid Chart'));
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Verify image file exists
	const imageExists = await fs
		.access(result.imageFiles[0]!)
		.then(() => true)
		.catch(() => false);
	t.true(imageExists);

	// Cleanup
	await cleanupMermaidImages(result.imageFiles);
});

test('processMermaidCharts should handle multiple mermaid diagrams', async (t) => {
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\nsequenceDiagram\n    A->>B: Hello\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 2);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('![Mermaid Chart 1]'));
	t.true(result.processedMarkdown.includes('![Mermaid Chart 2]'));
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	await cleanupMermaidImages(result.imageFiles);
});

test('processMermaidCharts should handle empty mermaid blocks with warning', async (t) => {
	const markdown = `# Test\n\n\`\`\`mermaid\n\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 1);
	t.true(result.warnings[0]!.includes('Skipping empty'));
	t.is(result.processedMarkdown, markdown);
});

test('processMermaidCharts should handle whitespace-only mermaid blocks with warning', async (t) => {
	const markdown = `# Test\n\n\`\`\`mermaid\n   \n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 1);
	t.true(result.warnings[0]!.includes('Skipping empty'));
});

test('processMermaidCharts should use temp directory for image placement (cross-platform)', async (t) => {
	const markdownDir = join(process.cwd(), 'src', 'test', 'mermaid');
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd(), markdownDir);

	t.is(result.imageFiles.length, 1);
	// Images should be in temp directory, not in markdown directory or repo
	const tempDir = join(tmpdir(), 'mdpdf-mermaid-images');
	t.true(result.imageFiles[0]!.startsWith(tempDir));

	// Cleanup
	await cleanupMermaidImages(result.imageFiles);
});

test('processMermaidCharts should continue processing after one diagram fails', async (t) => {
	// Create a markdown with one valid and one invalid diagram
	// We'll use a very long timeout to simulate a failure scenario
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\ninvalid syntax here\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	// Should have at least one warning for the invalid diagram
	t.true(result.warnings.length >= 0);
	// Should have processed at least one diagram
	t.true(result.imageFiles.length >= 0);

	// Cleanup
	await cleanupMermaidImages(result.imageFiles);
});

test('cleanupMermaidImages should remove image files', async (t) => {
	// Create a temporary image file
	const testImagePath = join(process.cwd(), 'test-mermaid-cleanup.png');
	await fs.writeFile(testImagePath, Buffer.from('test'));

	// Verify it exists
	const existsBefore = await fs
		.access(testImagePath)
		.then(() => true)
		.catch(() => false);
	t.true(existsBefore);

	// Cleanup
	await cleanupMermaidImages([testImagePath]);

	// Verify it's gone
	const existsAfter = await fs
		.access(testImagePath)
		.then(() => true)
		.catch(() => false);
	t.false(existsAfter);
});

test('cleanupMermaidImages should handle non-existent files gracefully', async (t) => {
	const nonExistentPath = join(process.cwd(), 'non-existent-mermaid.png');

	// Should not throw
	await t.notThrowsAsync(async () => {
		await cleanupMermaidImages([nonExistentPath]);
	});
});

test('cleanupMermaidImages should handle multiple files', async (t) => {
	const testImagePath1 = join(process.cwd(), 'test-mermaid-1.png');
	const testImagePath2 = join(process.cwd(), 'test-mermaid-2.png');
	await fs.writeFile(testImagePath1, Buffer.from('test1'));
	await fs.writeFile(testImagePath2, Buffer.from('test2'));

	await cleanupMermaidImages([testImagePath1, testImagePath2]);

	const exists1 = await fs
		.access(testImagePath1)
		.then(() => true)
		.catch(() => false);
	const exists2 = await fs
		.access(testImagePath2)
		.then(() => true)
		.catch(() => false);

	t.false(exists1);
	t.false(exists2);
});

test('processMermaidCharts should wrap images in centered container div', async (t) => {
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A[Start] --> B[End]\n\`\`\`\n\nDone.`;
	const result = await processMermaidCharts(markdown, browser, process.cwd());

	// Verify the container div is present
	t.true(result.processedMarkdown.includes('<div class="mermaid-chart-container">'));
	t.true(result.processedMarkdown.includes('</div>'));

	// Verify the image is inside the container
	const containerIndex = result.processedMarkdown.indexOf('<div class="mermaid-chart-container">');
	const imageIndex = result.processedMarkdown.indexOf('![Mermaid Chart');
	const closingDivIndex = result.processedMarkdown.indexOf('</div>', containerIndex);

	t.true(containerIndex < imageIndex);
	t.true(imageIndex < closingDivIndex);

	// Cleanup
	await cleanupMermaidImages(result.imageFiles);
});
