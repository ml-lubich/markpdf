/**
 * Tests for FileService
 * 
 * Tests file reading, writing, and directory operations.
 */

import test from 'ava';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { FileService } from '../lib/services/FileService';

const fileService = new FileService();

test('readFile should read file with utf-8 encoding', async (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const content = await fileService.readFile(testMdPath);

	t.truthy(content);
	t.is(typeof content, 'string');
	t.true(content.includes('# Markdown To Pdf'));
});

test('readFile should read file with custom encoding', async (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const content = await fileService.readFile(testMdPath, 'utf-8');

	t.truthy(content);
	t.is(typeof content, 'string');
});

test('writeFile should write Buffer content', async (t) => {
	const testPath = resolve(__dirname, 'basic', 'file-service-test-buffer.txt');
	const content = Buffer.from('test content');

	try {
		await fileService.writeFile(testPath, content);

		const readContent = await fs.readFile(testPath);
		t.true(Buffer.isBuffer(readContent));
		t.is(readContent.toString(), 'test content');
	} finally {
		await fs.unlink(testPath).catch(() => {});
	}
});

test('writeFile should write string content', async (t) => {
	const testPath = resolve(__dirname, 'basic', 'file-service-test-string.txt');
	const content = 'test string content';

	try {
		await fileService.writeFile(testPath, content);

		const readContent = await fs.readFile(testPath, 'utf-8');
		t.is(readContent, content);
	} finally {
		await fs.unlink(testPath).catch(() => {});
	}
});

test('ensureDirectory should create directory if it does not exist', async (t) => {
	const testDir = resolve(__dirname, 'basic', 'test-dir');

	try {
		await fileService.ensureDirectory(testDir);

		const exists = await fs.access(testDir).then(() => true).catch(() => false);
		t.true(exists);
	} finally {
		await fs.rmdir(testDir).catch(() => {});
	}
});

test('ensureDirectory should not throw if directory exists', async (t) => {
	const testDir = resolve(__dirname, 'basic');

	await t.notThrowsAsync(async () => {
		await fileService.ensureDirectory(testDir);
	});
});

test('getDirectory should return directory path', (t) => {
	const filePath = '/path/to/file.md';
	const dir = fileService.getDirectory(filePath);

	t.is(dir, '/path/to');
});

test('getDirectory should handle relative paths', (t) => {
	const filePath = './path/to/file.md';
	const dir = fileService.getDirectory(filePath);

	t.is(dir, './path/to');
});

