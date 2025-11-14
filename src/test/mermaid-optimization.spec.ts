/**
 * Tests for Mermaid Processing Optimization
 * 
 * Tests that Mermaid processing only occurs when Mermaid blocks are present,
 * and handles edge cases and negative scenarios.
 */

import test from 'ava';
import puppeteer, { Browser } from 'puppeteer';
import { ConverterService } from '../lib/services/ConverterService';
import { defaultConfig } from '../lib/config';
import { ServerService } from '../lib/services/ServerService';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService';

let browser: Browser;
let serverService: ServerService;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
	serverService = new ServerService();
});

test.after(async () => {
	await browser.close();
	await serverService.stop();
});

test('should skip Mermaid processing when no Mermaid blocks exist', async (t) => {
	const converter = new ConverterService();
	const content = '# Regular Markdown\n\nNo Mermaid here.';
	const config = { ...defaultConfig, port: 8000 };
	await serverService.start(config);

	try {
		const startTime = Date.now();
		const result = await converter.convert({ content }, config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		// Should be fast since no Mermaid processing
		t.true(duration < 5000, `Should complete quickly without Mermaid, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should process Mermaid when Mermaid blocks exist', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```mermaid\ngraph TD\n    A --> B\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8001 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle empty Mermaid block', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```mermaid\n\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8002 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle multiple Mermaid blocks', async (t) => {
	const converter = new ConverterService();
	const content = `# Test

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

Some text.

\`\`\`mermaid
sequenceDiagram
    A->>B: Hello
\`\`\`

Done.`;
	const config = { ...defaultConfig, port: 8003 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle Mermaid block with only whitespace', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```mermaid\n   \n\t\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8004 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle invalid Mermaid syntax gracefully', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```mermaid\ninvalid mermaid syntax !@#$%\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8005 };
	await serverService.start(config);

	try {
		// Should not throw, but may log warnings
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle Mermaid block at start of document', async (t) => {
	const converter = new ConverterService();
	const content = '```mermaid\ngraph TD\n    A --> B\n```\n\n# Title\n\nContent.';
	const config = { ...defaultConfig, port: 8006 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle Mermaid block at end of document', async (t) => {
	const converter = new ConverterService();
	const content = '# Title\n\nContent.\n\n```mermaid\ngraph TD\n    A --> B\n```';
	const config = { ...defaultConfig, port: 8007 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle code block that looks like Mermaid but is not', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```javascript\nconst mermaid = "not mermaid";\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8008 };
	await serverService.start(config);

	try {
		const startTime = Date.now();
		const result = await converter.convert({ content }, config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		// Should skip Mermaid processing
		t.true(duration < 5000, `Should skip Mermaid processing, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle very large Mermaid diagram', async (t) => {
	const converter = new ConverterService();
	const largeMermaid = 'graph TD\n' + Array.from({ length: 100 }, (_, i) => `    Node${i} --> Node${i + 1}`).join('\n');
	const content = `# Test\n\n\`\`\`mermaid\n${largeMermaid}\n\`\`\`\n\nDone.`;
	const config = { ...defaultConfig, port: 8009 };
	await serverService.start(config);

	try {
		const startTime = Date.now();
		const result = await converter.convert({ content }, config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		// Should complete within reasonable time
		t.true(duration < 30000, `Should complete in <30s, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle Mermaid processing timeout gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = '# Test\n\n```mermaid\ngraph TD\n    A --> B\n```';
	const config = { ...defaultConfig, port: 8010 };
	await serverService.start(config);

	try {
		// Should complete even if Mermaid takes time
		const result = await processor.processCharts(
			markdown,
			browser,
			config.basedir,
			undefined,
			config.port,
		);

		t.truthy(result);
		t.truthy(result.processedMarkdown);
	} finally {
		await serverService.stop();
	}
});

test('should not process Mermaid when regex does not match', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```\nnot mermaid\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8011 };
	await serverService.start(config);

	try {
		const startTime = Date.now();
		const result = await converter.convert({ content }, config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		// Should be fast (no Mermaid processing)
		t.true(duration < 5000, `Should skip Mermaid, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle Mermaid block with special characters', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```mermaid\ngraph TD\n    A["Node with <special> chars"] --> B\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8012 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle Mermaid block with unicode characters', async (t) => {
	const converter = new ConverterService();
	const content = '# Test\n\n```mermaid\ngraph TD\n    A["中文节点"] --> B["日本語ノード"]\n```\n\nDone.';
	const config = { ...defaultConfig, port: 8013 };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle case-insensitive Mermaid detection edge cases', async (t) => {
	const converter = new ConverterService();
	// Test that only exact "mermaid" works, not variations
	const testCases = [
		{ content: '# Test\n\n```mermaid\ngraph TD\n    A --> B\n```', shouldProcess: true },
		{ content: '# Test\n\n```MERMAID\ngraph TD\n    A --> B\n```', shouldProcess: false },
		{ content: '# Test\n\n```Mermaid\ngraph TD\n    A --> B\n```', shouldProcess: false },
	];
	const config = { ...defaultConfig, port: 8014 };
	await serverService.start(config);

	try {
		for (const testCase of testCases) {
			const startTime = Date.now();
			const result = await converter.convert({ content: testCase.content }, config, browser);
			const duration = Date.now() - startTime;

			t.truthy(result);
			t.truthy(result.content instanceof Buffer);
			
			if (testCase.shouldProcess) {
				// Mermaid processing takes longer
				t.true(duration > 1000, `Should take time for Mermaid processing, took ${duration}ms`);
			} else {
				// No Mermaid processing should be fast
				t.true(duration < 5000, `Should skip Mermaid, took ${duration}ms`);
			}
		}
	} finally {
		await serverService.stop();
	}
});

