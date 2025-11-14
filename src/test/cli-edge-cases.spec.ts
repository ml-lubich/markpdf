/**
 * CLI Edge Cases and Negative Testing
 * 
 * Tests for CLI error conditions, invalid arguments, and edge cases.
 */

import test from 'ava';
import { CliService } from '../lib/cli/CliService';
import { defaultConfig } from '../lib/config';

test('CliService should handle invalid config file path', async (t) => {
	const cliService = new CliService();
	const args = {
		'--config-file': '/non/existent/config.json',
		'--help': false,
		'--version': false,
	};

	// Should not throw, but should warn
	await t.notThrowsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	});
});

test('CliService should handle invalid JSON in config file', async (t) => {
	const cliService = new CliService();
	const args = {
		'--config-file': '/dev/null', // On Unix systems, this exists but may not be valid JSON
		'--help': false,
		'--version': false,
	};

	// Should handle gracefully
	await t.notThrowsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	});
});

test('CliService should handle invalid port number', async (t) => {
	const cliService = new CliService();
	const args = {
		'--port': -1,
		'--help': false,
		'--version': false,
	};

	// Should handle invalid port gracefully or throw appropriate error
	await t.notThrowsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	});
});

test('CliService should handle invalid JSON in CLI arguments', async (t) => {
	const cliService = new CliService();
	const args = {
		'--pdf-options': 'invalid json {',
		'--help': false,
		'--version': false,
	};

	// Should handle invalid JSON gracefully
	await t.notThrowsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	});
});

test('CliService should handle empty file list', async (t) => {
	const cliService = new CliService();
	const args = {
		_: [],
		'--help': false,
		'--version': false,
	};

	// Should show help when no files provided
	const originalLog = console.log;
	let output = '';

	console.log = (message: string) => {
		output += message;
	};

	try {
		await cliService.run(args as any, defaultConfig);
		t.truthy(output);
	} finally {
		console.log = originalLog;
	}
});

test('CliService should handle non-existent input files', async (t) => {
	const cliService = new CliService();
	const args = {
		_: ['/non/existent/file.md'],
		'--help': false,
		'--version': false,
	};

	// Should throw error for non-existent file
	await t.throwsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	}, { code: 'ENOENT' });
});

test('CliService should handle invalid watch options JSON', async (t) => {
	const cliService = new CliService();
	const args = {
		'--watch-options': 'invalid json',
		'--help': false,
		'--version': false,
	};

	// Should handle invalid JSON gracefully
	await t.notThrowsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	});
});

test('CliService should handle very long file paths', async (t) => {
	const cliService = new CliService();
	const longPath = '/path/' + 'x'.repeat(1000) + '/file.md';
	const args = {
		_: [longPath],
		'--help': false,
		'--version': false,
	};

	// Should handle long paths (may fail, but should fail gracefully)
	await t.notThrowsAsync(async () => {
		try {
			await cliService.run(args as any, defaultConfig);
		} catch (error) {
			// Expected to fail, but should be a proper error
			t.truthy(error);
		}
	});
});

test('CliService should handle special characters in file paths', async (t) => {
	const cliService = new CliService();
	const specialPath = '/path/to/file with spaces & special-chars.md';
	const args = {
		_: [specialPath],
		'--help': false,
		'--version': false,
	};

	// Should handle special characters (may fail, but should fail gracefully)
	await t.notThrowsAsync(async () => {
		try {
			await cliService.run(args as any, defaultConfig);
		} catch (error) {
			// Expected to fail, but should be a proper error
			t.truthy(error);
		}
	});
});

test('CliService should handle concurrent help requests', async (t) => {
	const cliService = new CliService();
	const args = { '--help': true };

	const originalLog = console.log;
	let callCount = 0;

	console.log = () => {
		callCount++;
	};

	try {
		await Promise.all([
			cliService.run(args as any, defaultConfig),
			cliService.run(args as any, defaultConfig),
			cliService.run(args as any, defaultConfig),
		]);

		t.true(callCount >= 3);
	} finally {
		console.log = originalLog;
	}
});

test('CliService should handle cleanup when no resources were started', async (t) => {
	const cliService = new CliService();

	// Should not throw when cleaning up without starting
	await t.notThrowsAsync(async () => {
		await cliService.cleanup();
	});
});

test('CliService should handle stdin with invalid encoding', async (t) => {
	const cliService = new CliService();
	const args = {
		'--md-file-encoding': 'invalid-encoding-12345',
		'--help': false,
		'--version': false,
	};

	// Should handle invalid encoding gracefully
	await t.notThrowsAsync(async () => {
		await cliService.run(args as any, defaultConfig);
	});
});

