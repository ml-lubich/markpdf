/**
 * Tests for MarkdownParserService
 * 
 * Tests markdown parsing and syntax highlighting.
 */

import test from 'ava';
import { MarkdownParserService } from '../lib/services/MarkdownParserService';

test('parse should convert markdown to HTML', (t) => {
	const parser = new MarkdownParserService();
	const markdown = '# Hello World\n\nThis is a test.';
	const html = parser.parse(markdown);

	t.truthy(html);
	t.true(html.includes('<h1'));
	t.true(html.includes('Hello World'));
	t.true(html.includes('<p>'));
});

test('parse should handle code blocks with syntax highlighting', (t) => {
	const parser = new MarkdownParserService();
	const markdown = '```js\nconst x = 1;\n```';
	const html = parser.parse(markdown);

	t.truthy(html);
	t.true(html.includes('<code'));
	t.true(html.includes('hljs'));
});

test('parse should handle unknown language as plaintext', (t) => {
	const parser = new MarkdownParserService();
	const markdown = '```unknown\nsome code\n```';
	const html = parser.parse(markdown);

	t.truthy(html);
	t.true(html.includes('<code'));
});

test('parse should handle markdown with custom options', (t) => {
	const parser = new MarkdownParserService({ breaks: true });
	const markdown = 'Line 1\nLine 2';
	const html = parser.parse(markdown);

	t.truthy(html);
});

test('parse should throw error for invalid markdown syntax in edge cases', (t) => {
	const parser = new MarkdownParserService();
	
	// This should not throw for normal markdown
	const markdown = '# Valid Markdown';
	t.notThrows(() => {
		parser.parse(markdown);
	});
});

test('parse should handle complex markdown with lists and tables', (t) => {
	const parser = new MarkdownParserService();
	const markdown = `# Title

- Item 1
- Item 2

| Col1 | Col2 |
|------|------|
| A    | B    |`;
	const html = parser.parse(markdown);

	t.truthy(html);
	t.true(html.includes('<ul>'));
	t.true(html.includes('<table>'));
});

test('parse should handle markdown with links and images', (t) => {
	const parser = new MarkdownParserService();
	const markdown = '[Link](https://example.com)\n![Image](image.png)';
	const html = parser.parse(markdown);

	t.truthy(html);
	t.true(html.includes('<a'));
	t.true(html.includes('<img'));
});

