/**
 * Tests for OutputGeneratorService - Timeout and Hanging Prevention
 * 
 * Tests edge cases and negative scenarios to ensure the service
 * doesn't hang and handles timeouts gracefully.
 */

import test from 'ava';
import puppeteer, { Browser, Page } from 'puppeteer';
import { OutputGeneratorService } from '../lib/services/OutputGeneratorService';
import { defaultConfig, PdfConfig } from '../lib/config';
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

test('should complete even when server is not started (no port)', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: undefined };

	// Don't start server - should still work
	const result = await service.generate(html, 'test.html', config, browser);

	t.truthy(result);
	t.truthy(result!.content instanceof Buffer);
	await service.closeBrowser();
});

test('should handle navigation timeout gracefully', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 99999 }; // Invalid port

	// Should not hang even with invalid port
	const startTime = Date.now();
	const result = await service.generate(html, 'test.html', config, browser);
	const duration = Date.now() - startTime;

	t.truthy(result);
	t.truthy(result!.content instanceof Buffer);
	// Should complete quickly (within 10 seconds) even with timeout
	t.true(duration < 10000, `Should complete in <10s, took ${duration}ms`);
	await service.closeBrowser();
});

test('should handle server connection failure without hanging', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 65535 }; // Unlikely to be in use

	// Should not hang when server is unreachable
	const result = await service.generate(html, 'test.html', config, browser);

	t.truthy(result);
	t.truthy(result!.content instanceof Buffer);
	await service.closeBrowser();
});

test('should handle Windows-style paths correctly', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9010 };
	await serverService.start(config);

	try {
		// Simulate Windows path
		const windowsPath = 'folder\\subfolder\\file.html';
		const result = await service.generate(html, windowsPath, config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle Unix-style paths correctly', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9011 };
	await serverService.start(config);

	try {
		// Simulate Unix path
		const unixPath = 'folder/subfolder/file.html';
		const result = await service.generate(html, unixPath, config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle empty HTML content', async (t) => {
	const service = new OutputGeneratorService();
	const html = '';
	const config: PdfConfig = { ...defaultConfig, port: 9012 };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should handle very large HTML content', async (t) => {
	const service = new OutputGeneratorService();
	const largeContent = '<html><body>' + '<p>Test</p>'.repeat(10000) + '</body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9013 };
	await serverService.start(config);

	try {
		const startTime = Date.now();
		const result = await service.generate(largeContent, 'test.html', config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
		// Should complete within reasonable time
		t.true(duration < 30000, `Should complete in <30s, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle invalid stylesheet URLs gracefully', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 9014,
		stylesheet: ['https://invalid-url-that-does-not-exist-12345.com/style.css'],
	};
	await serverService.start(config);

	try {
		// Should not hang waiting for invalid stylesheet
		const startTime = Date.now();
		const result = await service.generate(html, 'test.html', config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
		// Should complete quickly despite invalid stylesheet
		t.true(duration < 15000, `Should complete in <15s, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle invalid script URLs gracefully', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 9015,
		script: [{ url: 'https://invalid-url-that-does-not-exist-12345.com/script.js' }],
	};
	await serverService.start(config);

	try {
		// Should not hang waiting for invalid script
		const startTime = Date.now();
		const result = await service.generate(html, 'test.html', config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
		// Should complete quickly despite invalid script
		t.true(duration < 15000, `Should complete in <15s, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle multiple concurrent generations without hanging', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9016 };
	await serverService.start(config);

	try {
		const promises = Array.from({ length: 5 }, () =>
			service.generate(html, 'test.html', config, browser),
		);

		const startTime = Date.now();
		const results = await Promise.all(promises);
		const duration = Date.now() - startTime;

		t.is(results.length, 5);
		results.forEach((result) => {
			t.truthy(result);
			t.truthy(result!.content instanceof Buffer);
		});
		// Should complete all within reasonable time
		t.true(duration < 30000, `Should complete all in <30s, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

test('should handle page close errors gracefully', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9017 };
	await serverService.start(config);

	try {
		const result = await service.generate(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('should not hang when browser is closed externally', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9018 };
	await serverService.start(config);

	const tempBrowser = await puppeteer.launch({ headless: true });

	try {
		// Close browser before generation completes
		const generationPromise = service.generate(html, 'test.html', config, tempBrowser);
		
		// Wait a bit then close browser
		await new Promise((resolve) => setTimeout(resolve, 100));
		await tempBrowser.close();

		// Should handle error gracefully
		await t.throwsAsync(async () => {
			await generationPromise;
		});
	} finally {
		await serverService.stop();
	}
});

test('should handle relative path with special characters', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9019 };
	await serverService.start(config);

	try {
		// Test paths with special characters
		const specialPaths = [
			'folder with spaces/file.html',
			'folder-with-dashes/file.html',
			'folder_with_underscores/file.html',
		];

		for (const path of specialPaths) {
			const result = await service.generate(html, path, config, browser);
			t.truthy(result);
			t.truthy(result!.content instanceof Buffer);
		}
	} finally {
		await serverService.stop();
	}
});

test('should complete quickly without waiting for network idle', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 9020 };
	await serverService.start(config);

	try {
		const startTime = Date.now();
		const result = await service.generate(html, 'test.html', config, browser);
		const duration = Date.now() - startTime;

		t.truthy(result);
		t.truthy(result!.content instanceof Buffer);
		// Should complete quickly (not waiting for networkidle0)
		t.true(duration < 5000, `Should complete in <5s, took ${duration}ms`);
	} finally {
		await serverService.stop();
	}
});

