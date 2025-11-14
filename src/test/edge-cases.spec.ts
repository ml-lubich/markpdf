import test from 'ava';
import { mdToPdf } from './...js';

test('should handle empty markdown content', async (t) => {
	const pdf = await mdToPdf({ content: '' });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 0);
});

test('should handle markdown with only whitespace', async (t) => {
	const pdf = await mdToPdf({ content: '   \n\n  \t\n  ' });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle very long markdown content', async (t) => {
	const longContent =
		'# Test\n\n' + 'This is a very long line. '.repeat(1000) + '\n\n' + '# Section\n\n' + 'More content. '.repeat(1000);

	const pdf = await mdToPdf({ content: longContent });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 0);
});

test('should handle markdown with special characters', async (t) => {
	const markdown = `# Special Characters Test

This has <>&"' characters and emojis 🚀 📝 ✨

\`\`\`javascript
const code = '<script>alert("XSS")</script>';
\`\`\`
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with code blocks in various languages', async (t) => {
	const markdown = `# Code Blocks Test

JavaScript:
\`\`\`javascript
const x = 1;
\`\`\`

Python:
\`\`\`python
x = 1
\`\`\`

TypeScript:
\`\`\`typescript
const x: number = 1;
\`\`\`
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with nested lists', async (t) => {
	const markdown = `# Nested Lists

1. First item
   1. Nested item
   2. Another nested
2. Second item
   - Unordered nested
   - Another unordered

- Top level
  - Nested
    - Double nested
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with tables', async (t) => {
	const markdown = `# Tables

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with links and images', async (t) => {
	const markdown = `# Links and Images

This is a [link](https://example.com).

![Image alt text](https://example.com/image.png)
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with HTML elements', async (t) => {
	const markdown = `# HTML Elements

<div class="custom">
  This is custom HTML
</div>

<strong>Bold text</strong> and <em>italic text</em>.
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with front matter', async (t) => {
	const markdown = `---
title: Test Document
author: Test Author
---

# ${''}

This is the content after front matter.
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with custom PDF options in front matter', async (t) => {
	const markdown = `---
pdf_options:
  format: letter
  margin: 20mm
---

# Test

Content with custom PDF options.
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with CSS styling', async (t) => {
	const markdown = `# Styled Document

This document has custom styling.
`;

	const pdf = await mdToPdf(
		{ content: markdown },
		{
			css: `
				body {
					font-family: Arial, sans-serif;
					color: #333;
				}
				h1 {
					color: #0066cc;
				}
			`,
		},
	);

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('should handle markdown with custom stylesheet', async (t) => {
	const markdown = `# Styled Document

This uses a custom stylesheet.
`;

	const pdf = await mdToPdf({ content: markdown }, { stylesheet: [] });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});
