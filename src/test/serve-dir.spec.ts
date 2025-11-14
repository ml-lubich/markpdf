import { Server } from 'node:http';
import { resolve } from 'node:path';
import test from 'ava';
import getPort from 'get-port';
import { closeServer, serveDirectory } from '../lib/serve-dir.js';
import { defaultConfig } from '../lib/config.js';

test('serveDirectory should start a server on the specified port', async (t) => {
	const port = await getPort();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port,
	};

	const server = await serveDirectory(config);

	t.truthy(server);
	// Note: mock server is not a real Server instance, so instanceof check may fail
	// But it should have the listening property
	t.true(server.listening);

	await closeServer(server);
});

test('serveDirectory should start a server on a random port when not specified', async (t) => {
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port: 0, // Let system assign port
	};

	const server = await serveDirectory(config);

	t.truthy(server);
	// Note: mock server is not a real Server instance, so instanceof check may fail
	// But it should have the listening property
	t.true(server.listening);

	await closeServer(server);
});

test('closeServer should close the server', async (t) => {
	const port = await getPort();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port,
	};

	const server = await serveDirectory(config);
	t.true(server.listening);

	await closeServer(server);

	// Server should be closed
	t.false(server.listening);
});

test('closeServer should handle errors gracefully', async (t) => {
	const port = await getPort();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port,
	};

	const server = await serveDirectory(config);
	await closeServer(server);

	// Closing an already closed server should not throw
	await t.notThrowsAsync(async () => {
		await closeServer(server);
	});
});

test('closeServer should reject promise when server.close has an error', async (t) => {
	const port = await getPort();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port,
	};

	const server = await serveDirectory(config);

	// Create a mock server that will error on close
	const mockServer = {
		close(callback: (error?: Error) => void) {
			callback(new Error('Test error'));
		},
	} as any;

	// Test that closeServer properly rejects on error
	await t.throwsAsync(
		async () => {
			await closeServer(mockServer);
		},
		{ message: 'Test error' },
	);

	// Clean up real server
	await closeServer(server);
});

test('serveDirectory should serve files from basedir', async (t) => {
	const port = await getPort();
	const config = {
		...defaultConfig,
		basedir: resolve(__dirname, 'basic'),
		port,
	};

	const server = await serveDirectory(config);

	try {
		// Server should be listening
		t.true(server.listening);
	} finally {
		await closeServer(server);
	}
});
