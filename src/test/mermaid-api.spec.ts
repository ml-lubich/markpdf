import { readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import test, { before } from 'ava';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { type TextItem } from 'pdfjs-dist/types/src/display/api';
import { mdToPdf } from './...js';

const getPdfTextContent = async (content: Buffer) => {
	const document = await getDocument({ data: content }).promise;
	const page = await document.getPage(1);
	const textContent = (await page.getTextContent()).items
		.filter((item): item is TextItem => 'str' in item)
		.map(({ str }) => str)
		.join('');

	return textContent;
};

before(() => {
	const filesToDelete = [
		resolve(__dirname, 'mermaid', 'test-mermaid-api.pdf'),
		resolve(__dirname, 'mermaid', 'test-flowchart.pdf'),
		resolve(__dirname, 'mermaid', 'test-sequence.pdf'),
	];

	for (const file of filesToDelete) {
		try {
			unlinkSync(file);
		} catch (error) {
			if ((error as { code: string }).code !== 'ENOENT') {
				throw error;
			}
		}
	}
});

test('compile markdown with mermaid flowchart to pdf', async (t) => {
	const markdown = `# Test Document

This is a test with a flowchart:

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

The flowchart should be rendered as an image in the PDF.
`;

	const pdf = await mdToPdf({ content: markdown }, { dest: resolve(__dirname, 'mermaid', 'test-flowchart.pdf') });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 0);

	// Verify PDF was created
	t.notThrows(() => readFileSync(resolve(__dirname, 'mermaid', 'test-flowchart.pdf')));
});

test('compile markdown with mermaid sequence diagram to pdf', async (t) => {
	const markdown = `# Sequence Diagram Test

\`\`\`mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!
    A->>B: How are you?
    B-->>A: Great, thanks!
\`\`\`
`;

	const pdf = await mdToPdf({ content: markdown }, { dest: resolve(__dirname, 'mermaid', 'test-sequence.pdf') });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 0);
});

test('compile markdown with multiple mermaid diagrams to pdf', async (t) => {
	const markdown = `# Multiple Diagrams

First diagram:

\`\`\`mermaid
graph LR
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

Second diagram:

\`\`\`mermaid
pie title "Distribution"
    "A" : 30
    "B" : 40
    "C" : 30
\`\`\`
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 0);
});

test('compile markdown with mermaid and regular content to pdf', async (t) => {
	const markdown = `# Mixed Content

This is regular markdown text with **bold** and *italic* formatting.

## Section with Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start
    Processing --> Success: Complete
    Processing --> Error: Fail
    Success --> Idle
    Error --> Idle
\`\`\`

More regular markdown content here.
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 0);
});

test('compile markdown with empty mermaid block should handle gracefully', async (t) => {
	const markdown = `# Test

\`\`\`mermaid

\`\`\`

Regular content.
`;

	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('compile markdown with invalid mermaid syntax should handle gracefully', async (t) => {
	const markdown = `# Test

\`\`\`mermaid
invalid syntax here
not valid mermaid
\`\`\`

Regular content.
`;

	// Should not throw, but may produce warnings
	const pdf = await mdToPdf({ content: markdown });

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
});

test('compile full mermaid test document to pdf', async (t) => {
	const pdf = await mdToPdf(
		{ path: resolve(__dirname, 'mermaid', 'test-mermaid.md') },
		{ dest: resolve(__dirname, 'mermaid', 'test-mermaid-api.pdf') },
	);

	t.truthy(pdf);
	t.truthy(pdf.content instanceof Buffer);
	t.true(pdf.content.length > 10_000); // Should be substantial PDF

	// Verify PDF was created
	t.notThrows(() => readFileSync(resolve(__dirname, 'mermaid', 'test-mermaid-api.pdf')));
});

test('compile markdown with mermaid to html', async (t) => {
	const markdown = `# Test

\`\`\`mermaid
graph TD
    A --> B
\`\`\`
`;

	const html = await mdToPdf({ content: markdown }, { as_html: true });

	t.truthy(html);
	t.is(typeof html.content, 'string');
	t.true(html.content.includes('Mermaid Chart'));
	t.true(html.content.includes('mermaid-chart-container'));
});
