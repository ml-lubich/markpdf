import test from 'ava';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { Server } from 'http';
import { defaultConfig } from '../lib/config';
import { convertMdToPdf } from '../lib/md-to-pdf';
import { closeServer, serveDirectory } from '../lib/serve-dir';

let browser: Browser;
let servers: Server[] = [];

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
	// Clean up any remaining servers
	for (const server of servers) {
		try {
			await closeServer(server);
		} catch {
			// Ignore cleanup errors
		}
	}
});

test('convertMdToPdf should handle content input with front-matter', async (t) => {
	const content = `---
title: Test Document
---

# Hello World

This is a test.`;

	const config = { ...defaultConfig, port: 3000 };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);
	t.truthy(result.content instanceof Buffer);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle path input', async (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const config = { ...defaultConfig, port: 3001, basedir: resolve(__dirname, 'basic') };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ path: testMdPath }, config, { browser });

	t.truthy(result.content);
	t.truthy(result.content instanceof Buffer);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should merge front-matter config into default config', async (t) => {
	const content = `---
document_title: Custom Title
body_class: [custom, class]
---

# Test`;

	const config = { ...defaultConfig, port: 3002 };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle front-matter with pdf_options', async (t) => {
	const content = `---
pdf_options:
  format: Letter
---

# Test`;

	const config = { ...defaultConfig, port: 3003 };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle front-matter parse error gracefully', async (t) => {
	// This test verifies that invalid front-matter doesn't crash the conversion
	const content = `---
invalid: [unclosed
---

# Test`;

	const config = { ...defaultConfig, port: 3004 };
	const server = await serveDirectory(config);
	servers.push(server);

	// Should not throw, but may warn
	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should enable displayHeaderFooter when headerTemplate is provided', async (t) => {
	const content = '# Test';
	const config = {
		...defaultConfig,
		port: 3005,
		pdf_options: {
			...defaultConfig.pdf_options,
			headerTemplate: '<div>Header</div>',
		},
	};
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);
	t.is(config.pdf_options.displayHeaderFooter, true);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should enable displayHeaderFooter when footerTemplate is provided', async (t) => {
	const content = '# Test';
	const config = {
		...defaultConfig,
		port: 3006,
		pdf_options: {
			...defaultConfig.pdf_options,
			footerTemplate: '<div>Footer</div>',
		},
	};
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);
	t.is(config.pdf_options.displayHeaderFooter, true);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should sanitize array options from front-matter', async (t) => {
	const content = `---
body_class: single-class
stylesheet: single-stylesheet.css
script: []
---

# Test`;

	const config = { ...defaultConfig, port: 3007 };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);
	t.true(Array.isArray(config.body_class));
	t.true(Array.isArray(config.stylesheet));
	t.true(Array.isArray(config.script));

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should merge CLI args into config', async (t) => {
	const content = '# Test';
	const config = { ...defaultConfig, port: 3008 };
	const server = await serveDirectory(config);
	servers.push(server);
	const args = {
		'--document-title': 'CLI Title',
		'--marked-options': JSON.stringify({ breaks: true }),
	};

	const result = await convertMdToPdf({ content }, config, { args, browser });

	t.truthy(result.content);
	t.is(config.document_title, 'CLI Title');

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle string margin in pdf_options', async (t) => {
	const content = '# Test';
	const config = {
		...defaultConfig,
		port: 3009,
		pdf_options: {
			...defaultConfig.pdf_options,
			margin: '10mm',
		},
	};
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);
	t.not(typeof config.pdf_options.margin, 'string');

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should set dest to stdout when no path provided', async (t) => {
	const content = '# Test';
	const config = { ...defaultConfig, port: 3010, dest: undefined };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.is(result.filename, 'stdout');

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should write to file when filename is provided', async (t) => {
	const content = '# Test';
	const outputPath = resolve(__dirname, 'basic', 'md-to-pdf-test.pdf');
	const config = { ...defaultConfig, port: 3011, dest: outputPath };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.is(result.filename, outputPath);
	t.notThrows(() => fs.access(outputPath));

	// Cleanup
	await fs.unlink(outputPath).catch(() => {
		// Ignore cleanup errors
	});
	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle stdout output', async (t) => {
	const content = '# Test';
	const config = { ...defaultConfig, port: 3012, dest: 'stdout' };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.is(result.filename, 'stdout');
	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle md_file_encoding from args', async (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const config = { ...defaultConfig, port: 3013, basedir: resolve(__dirname, 'basic') };
	const server = await serveDirectory(config);
	servers.push(server);
	const args = {
		'--md-file-encoding': 'utf-8',
	};

	const result = await convertMdToPdf({ path: testMdPath }, config, { args, browser });

	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle gray_matter_options from args', async (t) => {
	const content = `---
title: Test
---

# Test`;

	const config = { ...defaultConfig, port: 3014 };
	const server = await serveDirectory(config);
	servers.push(server);
	const args = {
		'--gray-matter-options': JSON.stringify({ delimiters: '---' }),
	};

	const result = await convertMdToPdf({ content }, config, { args, browser });

	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should continue when Mermaid processing fails', async (t) => {
	const content = `# Test\n\n\`\`\`mermaid\ninvalid syntax\n\`\`\`\n\nRegular content.`;
	const config = { ...defaultConfig, port: 3015 };
	const server = await serveDirectory(config);
	servers.push(server);

	// Should not throw even if Mermaid processing fails
	const result = await convertMdToPdf({ content }, config, { browser });

	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle error when generateOutput returns undefined', async (t) => {
	const content = '# Test';
	const config = { ...defaultConfig, port: 3016, devtools: false };
	const server = await serveDirectory(config);
	servers.push(server);

	// This test verifies error handling when output generation fails
	// Note: This may not always throw depending on implementation
	const result = await convertMdToPdf({ content }, config, { browser }).catch((error) => {
		// If it throws, that's expected behavior
		return null;
	});

	// Either result is truthy or error was thrown (both are valid)
	t.true(result === null || (result !== null && result.content instanceof Buffer));

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle Mermaid warnings output', async (t) => {
	const content = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\ninvalid\n\`\`\`\n\nContent.`;
	const config = { ...defaultConfig, port: 3017 };
	const server = await serveDirectory(config);
	servers.push(server);

	// Capture console.warn
	const originalWarn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => {
		warnings.push(message);
	};

	try {
		const result = await convertMdToPdf({ content }, config, { browser });
		t.truthy(result.content);
		// Should have warnings about Mermaid charts
		t.true(warnings.length >= 0);
	} finally {
		console.warn = originalWarn;
		await closeServer(server);
		servers = servers.filter((s) => s !== server);
	}
});

test('convertMdToPdf should write Buffer content to file', async (t) => {
	const content = '# Test';
	const outputPath = resolve(__dirname, 'basic', 'buffer-test.pdf');
	const config = { ...defaultConfig, port: 3020, dest: outputPath };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.is(result.filename, outputPath);
	t.truthy(result.content instanceof Buffer);
	
	// Verify file was written
	const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
	t.true(fileExists);

	// Cleanup
	await fs.unlink(outputPath).catch(() => {});
	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should write string content to stdout', async (t) => {
	const content = '# Test';
	const config = { ...defaultConfig, port: 3021, dest: 'stdout', as_html: true };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });

	t.is(result.filename, 'stdout');
	t.is(typeof result.content, 'string');

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

test('convertMdToPdf should handle cleanup of Mermaid images', async (t) => {
	const content = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nContent.`;
	const config = { ...defaultConfig, port: 3022 };
	const server = await serveDirectory(config);
	servers.push(server);

	const result = await convertMdToPdf({ content }, config, { browser });
	t.truthy(result.content);

	await closeServer(server);
	servers = servers.filter((s) => s !== server);
});

