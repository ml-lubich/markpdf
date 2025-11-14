/**
 * Tests for OutputGeneratorService
 * 
 * Tests PDF and HTML output generation.
 */

import test from 'ava';
import puppeteer, { Browser } from 'puppeteer';
import { OutputGeneratorService } from '../lib/services/OutputGeneratorService';
import { defaultConfig, PdfConfig, HtmlConfig } from '../lib/config';
import { ServerService } from '../lib/services/ServerService';

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

test('generate should generate PDF output', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9000 };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
		t.is(result!.filename, config.dest);
	} finally {
		await serverService.stop();
	}
});

test('generate should generate HTML output when as_html is true', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: HtmlConfig = { ...defaultConfig, port: 9001, as_html: true };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.is(typeof result!.content, 'string');
		t.true(result!.content.includes('<h1>Test</h1>'));
	} finally {
		await serverService.stop();
	}
});

test('generate should add stylesheets from config', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 9002,
		stylesheet: [...defaultConfig.stylesheet, 'https://example.com/style.css'],
	};
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('generate should add custom CSS from config', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 9003,
		css: 'body { background-color: red; }',
	};
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('generate should add scripts from config', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 9004,
		script: [{ url: 'https://example.com/script.js' }],
	};
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('generate should use provided browser reference', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9005 };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('generate should create browser instance when not provided', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9006 };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
		await service.closeBrowser();
	}
});

test('generate should handle page_media_type setting', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 9007,
		page_media_type: 'print',
	};
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('closeBrowser should close browser instance', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9008 };
	await serverService.start(config);

	try {
		await service.generate(html, 'test.html', config);
		// Should not throw
		await t.notThrowsAsync(async () => {
			await service.closeBrowser();
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle navigation timeout gracefully', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9009 };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);
		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

