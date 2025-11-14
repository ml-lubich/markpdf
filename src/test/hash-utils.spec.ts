/**
 * Tests for Hash Utilities
 * 
 * Tests content-based hashing for Mermaid charts to ensure uniqueness
 * and prevent conflicts in parallel processing scenarios.
 */

import test from 'ava';
import { generateContentHash, generateMermaidFilename } from '../lib/utils/hash';

test('generateContentHash should produce same hash for identical content', (t) => {
	const content = 'graph TD\n    A --> B';
	const hash1 = generateContentHash(content);
	const hash2 = generateContentHash(content);

	t.is(hash1, hash2);
	t.is(hash1.length, 16); // Default length
});

test('generateContentHash should produce different hashes for different content', (t) => {
	const content1 = 'graph TD\n    A --> B';
	const content2 = 'graph TD\n    A --> C';
	const hash1 = generateContentHash(content1);
	const hash2 = generateContentHash(content2);

	t.not(hash1, hash2);
});

test('generateContentHash should normalize whitespace', (t) => {
	const content1 = 'graph TD\n    A --> B';
	const content2 = '  graph TD\n    A --> B  ';
	const hash1 = generateContentHash(content1);
	const hash2 = generateContentHash(content2);

	t.is(hash1, hash2);
});

test('generateContentHash should normalize line endings', (t) => {
	const content1 = 'graph TD\n    A --> B';
	const content2 = 'graph TD\r\n    A --> B';
	const content3 = 'graph TD\r    A --> B';
	const hash1 = generateContentHash(content1);
	const hash2 = generateContentHash(content2);
	const hash3 = generateContentHash(content3);

	t.is(hash1, hash2);
	t.is(hash1, hash3);
});

test('generateContentHash should respect custom length', (t) => {
	const content = 'graph TD\n    A --> B';
	const hash8 = generateContentHash(content, 8);
	const hash32 = generateContentHash(content, 32);

	t.is(hash8.length, 8);
	t.is(hash32.length, 32);
	t.is(hash32.substring(0, 8), hash8);
});

test('generateContentHash should cap length at 64', (t) => {
	const content = 'graph TD\n    A --> B';
	const hash = generateContentHash(content, 100);

	t.is(hash.length, 64); // SHA-256 produces 64 hex chars
});

test('generateMermaidFilename should generate proper filename format', (t) => {
	const mermaidCode = 'graph TD\n    A --> B';
	const filename = generateMermaidFilename(mermaidCode, 0);

	t.true(filename.startsWith('mermaid-'));
	t.true(filename.endsWith('-0.png'));
	t.true(filename.includes('.png'));
});

test('generateMermaidFilename should include hash in filename', (t) => {
	const mermaidCode = 'graph TD\n    A --> B';
	const filename = generateMermaidFilename(mermaidCode, 0);
	const hash = generateContentHash(mermaidCode);

	t.true(filename.includes(hash));
});

test('generateMermaidFilename should use index in filename', (t) => {
	const mermaidCode = 'graph TD\n    A --> B';
	const filename0 = generateMermaidFilename(mermaidCode, 0);
	const filename1 = generateMermaidFilename(mermaidCode, 1);

	t.true(filename0.endsWith('-0.png'));
	t.true(filename1.endsWith('-1.png'));
	t.not(filename0, filename1);
});

test('generateMermaidFilename should produce same filename for same content and index', (t) => {
	const mermaidCode = 'graph TD\n    A --> B';
	const filename1 = generateMermaidFilename(mermaidCode, 0);
	const filename2 = generateMermaidFilename(mermaidCode, 0);

	t.is(filename1, filename2);
});

test('generateMermaidFilename should produce different filenames for different content', (t) => {
	const code1 = 'graph TD\n    A --> B';
	const code2 = 'graph TD\n    A --> C';
	const filename1 = generateMermaidFilename(code1, 0);
	const filename2 = generateMermaidFilename(code2, 0);

	t.not(filename1, filename2);
});

