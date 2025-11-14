/**
 * Output Generator Edge Cases and Negative Testing
 * 
 * Tests for PDF/HTML generation error conditions and edge cases.
 */

import test from 'ava';
import puppeteer, { Browser } from 'puppeteer';
import { OutputGeneratorService } from '../lib/services/OutputGeneratorService';
import { defaultConfig } from '../lib/config';
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

test('generate should handle empty HTML content', async (t) => {
	const service = new OutputGeneratorService();
	const html = '';
	const config = { ...defaultConfig, port: 11000 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle HTML with invalid syntax', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><div><p>Unclosed tags</div></body></html>';
	const config = { ...defaultConfig, port: 11001 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle very large HTML content', async (t) => {
	const service = new OutputGeneratorService();
	const largeHtml = '<html><body>' + '<p>Content</p>'.repeat(10000) + '</body></html>';
	const config = { ...defaultConfig, port: 11002 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(largeHtml, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle HTML with external resources that fail to load', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><head><link rel="stylesheet" href="https://nonexistent-domain-12345.com/style.css"></head><body><h1>Test</h1></body></html>';
	const config = { ...defaultConfig, port: 11003 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle invalid stylesheet paths', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config = {
		...defaultConfig,
		port: 11004,
		stylesheet: ['/non/existent/stylesheet.css'],
	};
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle invalid script URLs', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config = {
		...defaultConfig,
		port: 11005,
		script: [{ url: 'https://invalid-url-12345.com/script.js' }],
	};
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle closed browser instance', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config = { ...defaultConfig, port: 11006 };
	await serverService.start(config);

	const closedBrowser = await puppeteer.launch({ headless: true });
	await closedBrowser.close();

	try {
		await t.throwsAsync(async () => {
			await service.generate(html, 'test.html', config, closedBrowser);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle invalid PDF options', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config = {
		...defaultConfig,
		port: 11007,
		pdf_options: {
			format: 'InvalidFormat' as any,
			margin: 'invalid' as any,
		},
	};
	await serverService.start(config);

	try {
		// Should handle invalid options gracefully
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle HTML with embedded scripts that throw errors', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1><script>throw new Error("Test error");</script></body></html>';
	const config = { ...defaultConfig, port: 11008 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle HTML with infinite loops in scripts', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1><script>while(true) {}</script></body></html>';
	const config = { ...defaultConfig, port: 11009 };
	await serverService.start(config);

	try {
		// Should timeout or handle gracefully
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('closeBrowser should handle multiple calls', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test</h1></body></html>';
	const config = { ...defaultConfig, port: 11010 };
	await serverService.start(config);

	try {
		await service.generate(html, 'test.html', config);
		await service.closeBrowser();
		
		// Second close should not throw
		await t.notThrowsAsync(async () => {
			await service.closeBrowser();
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle HTML with unicode characters', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>测试 🎉 中文</h1></body></html>';
	const config = { ...defaultConfig, port: 11011 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

test('generate should handle HTML with null bytes', async (t) => {
	const service = new OutputGeneratorService();
	const html = '<html><body><h1>Test\0null byte</h1></body></html>';
	const config = { ...defaultConfig, port: 11012 };
	await serverService.start(config);

	try {
		await t.notThrowsAsync(async () => {
			const result = await service.generate(html, 'test.html', config, browser);
			t.truthy(result);
		});
	} finally {
		await serverService.stop();
	}
});

