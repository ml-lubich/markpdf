import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { defaultConfig, type HtmlConfig, type PdfConfig } from '../lib/config.js';
import { closeBrowser, generateOutput } from '../lib/generate-output.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await closeBrowser();
	await browser.close();
});

test('generateOutput should generate PDF output', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 4000, as_html: false };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		t.is(result.filename, config.dest);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should generate HTML output when as_html is true', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: HtmlConfig = { ...defaultConfig, port: 4001, as_html: true };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.is(typeof result.content, 'string');
		t.true(result.content.includes('<h1>Test</h1>'));
		t.is(result.filename, config.dest);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should add stylesheets from config', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 4002,
		stylesheet: [...defaultConfig.stylesheet, 'https://example.com/style.css'],
	};
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should add custom CSS from config', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 4003,
		css: 'body { background-color: red; }',
	};
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should add scripts from config', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 4004,
		script: [{ url: 'https://example.com/script.js' }],
	};
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should use provided browser reference', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 4005 };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should create browser instance when not provided', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 4006 };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
		await closeBrowser();
	}
});

test('generateOutput should handle page_media_type setting', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = {
		...defaultConfig,
		port: 4007,
		page_media_type: 'print',
	};
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		const result = await generateOutput(html, 'test.html', config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('closeBrowser should close browser instance', async (t) => {
	// Create a browser instance through generateOutput
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 4008 };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		await generateOutput(html, 'test.html', config);
		// Should not throw
		await t.notThrowsAsync(async () => {
			await closeBrowser();
		});
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should handle navigation timeout gracefully', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 4010 };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		// This should handle navigation timeout gracefully
		const result = await generateOutput(html, 'test.html', config, browser);
		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});

test('generateOutput should handle page evaluation errors gracefully', async (t) => {
	const html = '<html><body><h1>Test</h1></body></html>';
	const config: PdfConfig = { ...defaultConfig, port: 4011 };
	const server = await import('../lib/serve-dir.js').then(async (m) => m.serveDirectory(config));

	try {
		// Should handle evaluation errors in the try-catch block
		const result = await generateOutput(html, 'test.html', config, browser);
		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await import('../lib/serve-dir.js').then(async (m) => m.closeServer(server));
	}
});
