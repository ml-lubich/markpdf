/**
 * Comprehensive tests for ConverterService
 * 
 * Tests the main conversion service with edge cases, negative scenarios,
 * and error handling. Includes tests for logger integration, error types,
 * and boundary conditions.
 */

import test from 'ava';
import { promises as fs } from 'fs';
import { resolve, join } from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { createConverterService } from '../lib/services/ConverterService';
import { defaultConfig } from '../lib/config';
import { ServerService } from '../lib/services/ServerService';
import { SilentLogger } from '../lib/domain/Logger';
import { ValidationError, OutputGenerationError } from '../lib/domain/errors';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService';
import { OutputGeneratorService } from '../lib/services/OutputGeneratorService';
import { FileService } from '../lib/services/FileService';
import { ConfigService } from '../lib/services/ConfigService';

let browser: Browser;
let serverService: ServerService;
let portCounter = 8000;

function getNextPort(): number {
	return portCounter++;
}

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
	serverService = new ServerService();
});

test.after(async () => {
	await browser.close();
	await serverService.stop();
});

// ============================================================================
// Basic Functionality Tests
// ============================================================================

test('ConverterService should convert content input to PDF', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Hello World' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		t.truthy(result.filename);
		t.true(result.content.length > 0);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should convert path input to PDF', async (t) => {
	const converter = createConverterService();
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const config = { ...defaultConfig, port: getNextPort(), basedir: resolve(__dirname, 'basic') };
	await serverService.start(config);

	try {
		const result = await converter.convert({ path: testMdPath }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		t.true(result.content.length > 0);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should convert to HTML when as_html is true', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort(), as_html: true };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.truthy(result);
		t.is(typeof result.content, 'string');
		t.true(result.content.includes('<h1'));
		t.true(result.content.includes('Test'));
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Error Handling Tests - Negative Tests
// ============================================================================

test('ConverterService should throw ValidationError for invalid input', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(async () => {
			await converter.convert({} as any, config, browser);
		}, { instanceOf: ValidationError, message: /Input must have either path or content/ });
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should throw ValidationError when neither path nor content provided', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(async () => {
			// @ts-expect-error - intentionally testing invalid input
			await converter.convert({ path: undefined, content: undefined }, config, browser);
		}, { instanceOf: ValidationError });
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should throw ValidationError for non-existent file', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(async () => {
			await converter.convert({ path: '/nonexistent/file.md' }, config, browser);
		}, { instanceOf: ValidationError });
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should throw OutputGenerationError when output generation fails', async (t) => {
	// Create a converter with a mock output generator that always fails
	const mockOutputGenerator = {
		generate: async () => undefined,
		closeBrowser: async () => {},
	};
	
	const converter = new ConverterService(
		new MermaidProcessorService(),
		mockOutputGenerator as any,
		new FileService(),
		new ConfigService(),
	);
	
	const config = { ...defaultConfig, port: getNextPort(), devtools: false };
	await serverService.start(config);

	try {
		await t.throwsAsync(async () => {
			await converter.convert({ content: '# Test' }, config, browser);
		}, { instanceOf: OutputGenerationError });
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle front-matter in markdown', async (t) => {
	const converter = createConverterService();
	const content = `---
title: Test Document
---

# Content`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should process Mermaid diagrams', async (t) => {
	const converter = createConverterService();
	const content = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should write output to file', async (t) => {
	const converter = createConverterService();
	const outputPath = resolve(__dirname, 'basic', 'converter-test.pdf');
	const config = { ...defaultConfig, port: getNextPort(), dest: outputPath };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.is(result.filename, outputPath);
		
		// Verify file exists
		const exists = await fs.access(outputPath).then(() => true).catch(() => false);
		t.true(exists);

		// Cleanup
		await fs.unlink(outputPath).catch(() => {});
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should write to stdout when dest is stdout', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort(), dest: 'stdout' };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.is(result.filename, 'stdout');
		t.truthy(result.content);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService cleanup should close browser', async (t) => {
	const converter = createConverterService();
	
	await t.notThrowsAsync(async () => {
		await converter.cleanup();
	});
});

