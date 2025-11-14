/**
 * Edge Cases and Negative Testing
 * 
 * Comprehensive tests for error conditions, invalid inputs, and edge cases
 * that could cause failures in production. Tests actual behavior, not just code coverage.
 */

import test from 'ava';
import { promises as fs } from 'fs';
import { join } from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService';
import { ConfigService } from '../lib/services/ConfigService';
import { FileService } from '../lib/services/FileService';
import { ConverterService } from '../lib/services/ConverterService';
import { generateContentHash } from '../lib/utils/hash';
import { defaultConfig } from '../lib/config';
import { ServerService } from '../lib/services/ServerService';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

// ============================================================================
// Mermaid Processing Edge Cases
// ============================================================================

test('processCharts should handle invalid Mermaid syntax gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ninvalid syntax!!!\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10000);

	// Should not crash, but may have warnings
	t.truthy(result);
	t.truthy(result.processedMarkdown);
	// May or may not generate image depending on error handling
});

test('processCharts should handle extremely long Mermaid code', async (t) => {
	const processor = new MermaidProcessorService();
	const longCode = 'graph TD\n' + Array(1000).fill('    A --> B').join('\n');
	const markdown = `# Test\n\n\`\`\`mermaid\n${longCode}\n\`\`\`\n\nDone.`;
	
	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10001);
		t.truthy(result);
	});
});

test('processCharts should handle special characters in Mermaid code', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A["Node with <>&\"'special chars"] --> B\n\`\`\`\n\nDone.`;
	
	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10002);
		t.truthy(result);
	});
});

test('processCharts should handle empty markdown string', async (t) => {
	const processor = new MermaidProcessorService();
	const result = await processor.processCharts('', browser, process.cwd());

	t.is(result.processedMarkdown, '');
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should handle markdown with only whitespace', async (t) => {
	const processor = new MermaidProcessorService();
	const result = await processor.processCharts('   \n\t  \n  ', browser, process.cwd());

	t.truthy(result.processedMarkdown);
	t.is(result.imageFiles.length, 0);
});

test('processCharts should handle malformed code block syntax', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\n\nDone.`; // Missing closing backticks
	
	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10003);
		t.truthy(result);
	});
});

test('processCharts should handle nested code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\n\`\`\`\n\`\`\`\ngraph TD\n    A --> B\n\`\`\`\n\`\`\`\n\nDone.`;
	
	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10004);
		t.truthy(result);
	});
});

test('processCharts should handle unicode characters in Mermaid code', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A["节点 1 🎉"] --> B["Node 2 中文"]\n\`\`\`\n\nDone.`;
	
	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10005);
		t.truthy(result);
	});
});

// ============================================================================
// File Service Edge Cases
// ============================================================================

test('FileService should throw error for non-existent file', async (t) => {
	const fileService = new FileService();
	const nonExistentPath = join(__dirname, 'non-existent-file-12345.md');

	await t.throwsAsync(async () => {
		await fileService.readFile(nonExistentPath);
	}, { code: 'ENOENT' });
});

test('FileService should handle invalid encoding gracefully', async (t) => {
	const fileService = new FileService();
	const testMdPath = join(__dirname, 'basic', 'test.md');

	// Should not throw for invalid encoding, may return garbled text
	await t.notThrowsAsync(async () => {
		const content = await fileService.readFile(testMdPath, 'invalid-encoding-12345' as any);
		t.truthy(content);
	});
});

test('FileService should handle writing to non-existent directory', async (t) => {
	const fileService = new FileService();
	const nonExistentDir = join(__dirname, 'non-existent-dir-12345', 'test.txt');

	await t.throwsAsync(async () => {
		await fileService.writeFile(nonExistentDir, 'test content');
	}, { code: 'ENOENT' });
});

test('FileService should handle writing empty content', async (t) => {
	const fileService = new FileService();
	const testPath = join(__dirname, 'basic', 'empty-test.txt');

	try {
		await t.notThrowsAsync(async () => {
			await fileService.writeFile(testPath, '');
			const content = await fs.readFile(testPath, 'utf-8');
			t.is(content, '');
		});
	} finally {
		await fs.unlink(testPath).catch(() => {});
	}
});

test('FileService should handle writing very large content', async (t) => {
	const fileService = new FileService();
	const testPath = join(__dirname, 'basic', 'large-test.txt');
	const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB

	try {
		await t.notThrowsAsync(async () => {
			await fileService.writeFile(testPath, largeContent);
			const stats = await fs.stat(testPath);
			t.true(stats.size > 0);
		});
	} finally {
		await fs.unlink(testPath).catch(() => {});
	}
});

// ============================================================================
// Configuration Service Edge Cases
// ============================================================================

test('ConfigService should handle null/undefined values in merge', (t) => {
	const configService = new ConfigService();
	const config1 = { document_title: 'Title' };
	const config2 = { document_title: null as any, highlight_style: undefined as any };

	const merged = configService.mergeConfigs(config1, config2);

	t.is(merged.document_title, null);
	t.truthy(merged.highlight_style); // Should have default
});

test('ConfigService should handle deeply nested pdf_options', (t) => {
	const configService = new ConfigService();
	const config = {
		pdf_options: {
			margin: {
				top: '10mm',
				right: '20mm',
				bottom: '30mm',
				left: '40mm',
			},
		},
	};

	const merged = configService.mergeConfigs(config);

	t.is(merged.pdf_options.margin?.top, '10mm');
	t.is(merged.pdf_options.margin?.right, '20mm');
});

test('ConfigService should handle invalid port numbers', (t) => {
	const configService = new ConfigService();
	const config1 = { ...defaultConfig, port: -1 };
	const config2 = { ...defaultConfig, port: 70000 };

	t.throws(() => {
		configService.validateConfig(config1 as any);
	}, { message: /port must be between/ });

	t.throws(() => {
		configService.validateConfig(config2 as any);
	}, { message: /port must be between/ });
});

test('ConfigService should handle invalid margin string formats', (t) => {
	const configService = new ConfigService();
	const config = {
		pdf_options: {
			margin: '10mm 20mm 30mm 40mm 50mm', // Too many values
		},
	};

	t.throws(() => {
		configService.mergeConfigs(config);
	}, { message: /invalid margin input/ });
});

test('ConfigService should handle non-string margin', async (t) => {
	const configService = new ConfigService();
	const config = {
		pdf_options: {
			margin: 123 as any,
		},
	};

	// Should not throw, but margin should be handled
	await t.notThrowsAsync(async () => {
		const merged = configService.mergeConfigs(config);
		t.truthy(merged);
	});
});

// ============================================================================
// Hash Generation Edge Cases
// ============================================================================

test('generateContentHash should handle empty string', (t) => {
	const hash = generateContentHash('');
	t.truthy(hash);
	t.is(hash.length, 16);
	t.true(/^[a-f0-9]+$/.test(hash));
});

test('generateContentHash should handle very long strings', (t) => {
	const longString = 'x'.repeat(1000000); // 1MB string
	const hash = generateContentHash(longString);
	
	t.truthy(hash);
	t.is(hash.length, 16);
});

test('generateContentHash should handle null bytes', (t) => {
	const content = 'graph TD\n    A --> B\0null byte';
	const hash1 = generateContentHash(content);
	const hash2 = generateContentHash(content);
	
	t.is(hash1, hash2);
});

test('generateContentHash should handle only whitespace', (t) => {
	const hash1 = generateContentHash('   \n\t  ');
	const hash2 = generateContentHash('   \n\t  ');
	
	t.is(hash1, hash2);
});

test('generateContentHash should handle zero length parameter', (t) => {
	const content = 'graph TD\n    A --> B';
	const hash = generateContentHash(content, 0);
	
	t.is(hash.length, 0);
});

test('generateContentHash should handle negative length parameter', (t) => {
	const content = 'graph TD\n    A --> B';
	const hash = generateContentHash(content, -5);
	
	// Should handle gracefully (probably returns empty or default)
	t.truthy(hash);
});

// ============================================================================
// Converter Service Edge Cases
// ============================================================================

test('ConverterService should throw error for invalid input (no path or content)', async (t) => {
	const converter = new ConverterService();
	const config = { ...defaultConfig, port: 10010 };
	const serverService = new ServerService();
	await serverService.start(config);

	try {
		await t.throwsAsync(async () => {
			await converter.convert({} as any, config, browser);
		}, { message: /Input must have either path or content/ });
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle non-existent file path', async (t) => {
	const converter = new ConverterService();
	const config = { ...defaultConfig, port: 10011 };
	const serverService = new ServerService();
	await serverService.start(config);

	try {
		await t.throwsAsync(async () => {
			await converter.convert({ path: '/non/existent/file.md' }, config, browser);
		}, { code: 'ENOENT' });
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle empty content string', async (t) => {
	const converter = new ConverterService();
	const config = { ...defaultConfig, port: 10012 };
	const serverService = new ServerService();
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await converter.convert({ content: '' }, config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle content with only front-matter', async (t) => {
	const converter = new ConverterService();
	const config = { ...defaultConfig, port: 10013 };
	const serverService = new ServerService();
	await serverService.start(config);

	try {
		const content = `---
title: Test
---

`;
		await t.notThrowsAsync(async () => {
			const result = await converter.convert({ content }, config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle invalid front-matter gracefully', async (t) => {
	const converter = new ConverterService();
	const config = { ...defaultConfig, port: 10014 };
	const serverService = new ServerService();
	await serverService.start(config);

	try {
		const content = `---
invalid: yaml: [unclosed
---

# Content`;
		await t.notThrowsAsync(async () => {
			const result = await converter.convert({ content }, config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Server Service Edge Cases
// ============================================================================

test('ServerService should handle starting on already used port', async (t) => {
	const serverService1 = new ServerService();
	const serverService2 = new ServerService();
	const config = { ...defaultConfig, port: 10015 };

	await serverService1.start(config);

	// Second server should handle port conflict gracefully
	await t.notThrowsAsync(async () => {
		await serverService2.start({ ...config, port: 10015 });
	});

	await serverService1.stop();
	await serverService2.stop();
});

test('ServerService should handle stopping before starting', async (t) => {
	const serverService = new ServerService();

	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});
});

test('ServerService should handle multiple start calls', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 10016 };

	await serverService.start(config);
	
	// Second start should be idempotent
	await t.notThrowsAsync(async () => {
		await serverService.start(config);
	});

	await serverService.stop();
});

test('ServerService should handle multiple stop calls', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 10017 };

	await serverService.start(config);
	await serverService.stop();
	
	// Second stop should not throw
	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});
});

// ============================================================================
// Parallel Processing Edge Cases
// ============================================================================

test('parallel processes should handle same content hash collision gracefully', async (t) => {
	const processor1 = new MermaidProcessorService();
	const processor2 = new MermaidProcessorService();
	const mermaidCode = 'graph TD\n    A --> B';
	const markdown = `# Test\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nDone.`;

	// Simulate concurrent writes to same file
	const [result1, result2] = await Promise.all([
		processor1.processCharts(markdown, browser, process.cwd(), undefined, 10018),
		processor2.processCharts(markdown, browser, process.cwd(), undefined, 10019),
	]);

	// Both should succeed (last write wins, which is acceptable)
	t.is(result1.imageFiles.length, 1);
	t.is(result2.imageFiles.length, 1);

	// Cleanup
	for (const file of [...result1.imageFiles, ...result2.imageFiles]) {
		await fs.unlink(file).catch(() => {});
	}
});

test('parallel processes should handle different temp directories', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;

	// Process same content multiple times concurrently
	const results = await Promise.all([
		processor.processCharts(markdown, browser, process.cwd(), undefined, 10020),
		processor.processCharts(markdown, browser, process.cwd(), undefined, 10021),
		processor.processCharts(markdown, browser, process.cwd(), undefined, 10022),
	]);

	// All should succeed
	for (const result of results) {
		t.is(result.imageFiles.length, 1);
	}

	// Cleanup
	for (const result of results) {
		for (const file of result.imageFiles) {
			await fs.unlink(file).catch(() => {});
		}
	}
});

// ============================================================================
// Browser/Page Edge Cases
// ============================================================================

test('should handle browser close during processing', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;

	// Create a browser and close it immediately
	const tempBrowser = await puppeteer.launch({ headless: true });
	await tempBrowser.close();

	await t.throwsAsync(async () => {
		await processor.processCharts(markdown, tempBrowser, process.cwd(), undefined, 10023);
	});
});

// ============================================================================
// Markdown Content Edge Cases
// ============================================================================

test('should handle markdown with no content between code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\`\`\`mermaid\ngraph LR\n    A --> B\n\`\`\``;

	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10024);
		t.is(result.imageFiles.length, 2);
		
		// Cleanup
		for (const file of result.imageFiles) {
			await fs.unlink(file).catch(() => {});
		}
	});
});

test('should handle markdown with only Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\``;

	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10025);
		t.is(result.imageFiles.length, 1);
		
		// Cleanup
		for (const file of result.imageFiles) {
			await fs.unlink(file).catch(() => {});
		}
	});
});

test('should handle markdown with code blocks that look like Mermaid but are not', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\nnot actually mermaid code\n\`\`\`\n\nDone.`;

	await t.notThrowsAsync(async () => {
		const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 10026);
		t.truthy(result);
	});
});

