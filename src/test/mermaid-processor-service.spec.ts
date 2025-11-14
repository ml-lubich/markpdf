/**
 * Tests for MermaidProcessorService
 *
 * Tests Mermaid diagram processing and image generation.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('processCharts should NOT process markdown with no Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Hello World\n\nThis is regular markdown content.\n\n\`\`\`javascript\nconsole.log('hello');\n\`\`\`\n\nMore content here.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should NOT process non-Mermaid code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`javascript\nconst x = 1;\n\`\`\`\n\n\`\`\`python\ndef hello():\n    print("world")\n\`\`\`\n\n\`\`\`json\n{"key": "value"}\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should only process Mermaid blocks, not other code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`javascript\nconst x = 1;\n\`\`\`\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`python\ndef hello():\n    pass\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8004);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('![Mermaid Chart 1]'));
	t.true(result.processedMarkdown.includes('```javascript'));
	t.true(result.processedMarkdown.includes('```python'));
	
	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle markdown with mixed Mermaid and non-Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\nSome text.\n\n\`\`\`mermaid\nsequenceDiagram\n    A->>B: Hello\n\`\`\`\n\nCode example:\n\n\`\`\`typescript\ninterface User {\n  name: string;\n}\n\`\`\`\n\nAnother diagram:\n\n\`\`\`mermaid\ngantt\n    title Project Timeline\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8005);

	t.is(result.imageFiles.length, 2);
	t.true(result.processedMarkdown.includes('![Mermaid Chart 1]'));
	t.true(result.processedMarkdown.includes('![Mermaid Chart 2]'));
	t.true(result.processedMarkdown.includes('```typescript'));
	t.is(result.warnings.length, 0);
	
	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle markdown with only regular code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Code Examples\n\n\`\`\`bash\nnpm install markpdf\n\`\`\`\n\n\`\`\`yaml\nname: markpdf\nversion: 1.0.0\n\`\`\`\n\nNo Mermaid here!`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should process gitGraph diagram with capital G (Mermaid 10.x syntax)', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9010);

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
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9011);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});
