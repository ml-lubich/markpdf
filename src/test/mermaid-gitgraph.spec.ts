/**
 * Tests for GitGraph Mermaid diagram processing
 *
 * Ensures gitGraph syntax (with capital G) works correctly with Mermaid 10.x
 * and that the behavior is preserved across versions.
 */

import { promises as fs } from 'node:fs';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('processCharts should process gitGraph diagram with capital G', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9000);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should process complex gitGraph with branches and merges', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Complex Git Graph\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n    commit id: "Dev Work 2"\n    checkout main\n    commit id: "Hotfix"\n    checkout develop\n    commit id: "Dev Work 3"\n    checkout main\n    merge develop\n    commit id: "Release"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9001);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should process gitGraph with commit id syntax', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph with IDs\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial Commit"\n    commit id: "Add Feature"\n    branch feature-branch\n    checkout feature-branch\n    commit id: "Work on Feature"\n    checkout main\n    merge feature-branch\n    commit id: "Release"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9002);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph in mixed content', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Mixed Content\n\nSome text.\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    branch develop\n    checkout develop\n    commit id: "Work"\n\`\`\`\n\nMore text.\n\n\`\`\`javascript\nconsole.log('test');\n\`\`\`\n\nAnother diagram:\n\n\`\`\`mermaid\nflowchart TD\n    A --> B\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9003);

	t.is(result.imageFiles.length, 2);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));
	t.true(result.processedMarkdown.includes('```javascript'));
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should preserve gitGraph syntax exactly', async (t) => {
	const processor = new MermaidProcessorService();
	const gitGraphCode = `gitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"`;
	const markdown = `# Test\n\n\`\`\`mermaid\n${gitGraphCode}\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9004);

	// Should have processed the diagram
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	
	// Should have replaced the mermaid block with image
	t.false(result.processedMarkdown.includes('```mermaid'));
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle multiple gitGraph diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Multiple Git Graphs\n\n\`\`\`mermaid\ngitGraph\n    commit id: "First"\n    commit id: "Second"\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Third"\n    branch feature\n    checkout feature\n    commit id: "Fourth"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9005);

	t.is(result.imageFiles.length, 2);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('Mermaid Chart 1'));
	t.true(result.processedMarkdown.includes('Mermaid Chart 2'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should generate valid image file for gitGraph', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph Image Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Test Commit"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9006);

	t.is(result.imageFiles.length, 1);
	
	// Verify image file exists and is readable
	const imageExists = await fs
		.access(result.imageFiles[0]!)
		.then(() => true)
		.catch(() => false);
	t.true(imageExists);

	// Verify it's a PNG file
	const stats = await fs.stat(result.imageFiles[0]!);
	t.true(stats.size > 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

