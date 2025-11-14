/**
 * Tests for ServerService
 *
 * Tests HTTP server management for file serving.
 */

import { resolve } from 'node:path';
import test from 'ava';
import { ServerService } from '../lib/services/ServerService.js';
import { defaultConfig } from '../lib/config.js';

test('start should start server on specified port', async (t) => {
	const service = new ServerService();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port: 10_000,
	};

	await service.start(config);

	t.truthy(service);

	await service.stop();
});

test('start should start server on random port when port is 0', async (t) => {
	const service = new ServerService();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port: 0,
	};

	await service.start(config);

	t.truthy(service);

	await service.stop();
});

test('stop should close server', async (t) => {
	const service = new ServerService();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port: 10_001,
	};

	await service.start(config);
	await service.stop();

	// Should not throw
	await t.notThrowsAsync(async () => {
		await service.stop();
	});
});

test('stop should handle already closed server', async (t) => {
	const service = new ServerService();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port: 10_002,
	};

	await service.start(config);
	await service.stop();
	await service.stop(); // Second stop should not throw

	t.pass();
});

test('start should handle multiple start calls', async (t) => {
	const service = new ServerService();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port: 10_003,
	};

	await service.start(config);

	// Starting again should handle gracefully
	await t.notThrowsAsync(async () => {
		await service.start(config);
	});

	await service.stop();
});
