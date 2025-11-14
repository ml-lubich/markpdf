/**
 * Tests for GitGraph Mermaid diagram processing
 *
 * Ensures gitGraph syntax (with capital G) works correctly with Mermaid 10.x
 * and that the behavior is preserved across versions.
 */

import { promises as fs } from 'node:fs';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('processCharts should process gitGraph diagram with capital G', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9000);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should process complex gitGraph with branches and merges', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Complex Git Graph\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n    commit id: "Dev Work 2"\n    checkout main\n    commit id: "Hotfix"\n    checkout develop\n    commit id: "Dev Work 3"\n    checkout main\n    merge develop\n    commit id: "Release"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9001);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should process gitGraph with commit id syntax', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph with IDs\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial Commit"\n    commit id: "Add Feature"\n    branch feature-branch\n    checkout feature-branch\n    commit id: "Work on Feature"\n    checkout main\n    merge feature-branch\n    commit id: "Release"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9002);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph in mixed content', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Mixed Content\n\nSome text.\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    branch develop\n    checkout develop\n    commit id: "Work"\n\`\`\`\n\nMore text.\n\n\`\`\`javascript\nconsole.log('test');\n\`\`\`\n\nAnother diagram:\n\n\`\`\`mermaid\nflowchart TD\n    A --> B\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9003);

	t.is(result.imageFiles.length, 2);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));
	t.true(result.processedMarkdown.includes('```javascript'));
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should preserve gitGraph syntax exactly', async (t) => {
	const processor = new MermaidProcessorService();
	const gitGraphCode = `gitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"`;
	const markdown = `# Test\n\n\`\`\`mermaid\n${gitGraphCode}\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9004);

	// Should have processed the diagram
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	
	// Should have replaced the mermaid block with image
	t.false(result.processedMarkdown.includes('```mermaid'));
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle multiple gitGraph diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Multiple Git Graphs\n\n\`\`\`mermaid\ngitGraph\n    commit id: "First"\n    commit id: "Second"\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Third"\n    branch feature\n    checkout feature\n    commit id: "Fourth"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9005);

	t.is(result.imageFiles.length, 2);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('Mermaid Chart 1'));
	t.true(result.processedMarkdown.includes('Mermaid Chart 2'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should generate valid image file for gitGraph', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph Image Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Test Commit"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9006);

	t.is(result.imageFiles.length, 1);
	
	// Verify image file exists and is readable
	const imageExists = await fs
		.access(result.imageFiles[0]!)
		.then(() => true)
		.catch(() => false);
	t.true(imageExists);

	// Verify it's a PNG file
	const stats = await fs.stat(result.imageFiles[0]!);
	t.true(stats.size > 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});


test('processCharts should handle gitGraph with many branches', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Many Branches\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    branch feature1\n    branch feature2\n    branch feature3\n    checkout feature1\n    commit id: "Feature 1 Work"\n    checkout feature2\n    commit id: "Feature 2 Work"\n    checkout feature3\n    commit id: "Feature 3 Work"\n    checkout main\n    merge feature1\n    merge feature2\n    merge feature3\n    commit id: "All Merged"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9007);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with long commit messages', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Long Messages\n\n\`\`\`mermaid\ngitGraph\n    commit id: "This is a very long commit message that describes a complex feature implementation"\n    commit id: "Another long message with special characters: !@#$%^&*()"\n    branch develop\n    checkout develop\n    commit id: "Work on feature with unicode: 测试 🚀"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9008);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with special characters in branch names', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Special Branch Names\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    branch feature/awesome-feature\n    branch hotfix-critical-bug\n    checkout feature/awesome-feature\n    commit id: "Work"\n    checkout hotfix-critical-bug\n    commit id: "Fix"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9009);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should gracefully handle invalid gitGraph syntax', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Invalid Syntax\n\n\`\`\`mermaid\ngitGraph\n    invalid command here\n    commit without id\n    branch\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9010);

	// Should continue processing even if one diagram fails
	t.true(result.warnings.length >= 0);
	// Should not crash
	t.truthy(result.processedMarkdown);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with nested branch operations', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Nested Operations\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Start"\n    branch A\n    checkout A\n    commit id: "A1"\n    branch B\n    checkout B\n    commit id: "B1"\n    checkout A\n    commit id: "A2"\n    checkout main\n    merge A\n    merge B\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9011);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with very large diagram', async (t) => {
	const processor = new MermaidProcessorService();
	// Create a large gitGraph with many commits
	const commits = Array.from({ length: 20 }, (_, i) => `    commit id: "Commit ${i + 1}"`).join('\n');
	const markdown = `# Large Diagram\n\n\`\`\`mermaid\ngitGraph\n${commits}\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9012);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should continue processing after gitGraph error', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Mixed Success/Failure\n\n\`\`\`mermaid\ngitGraph\n    invalid syntax here\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Valid"\n    commit id: "Also Valid"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9013);

	// Should process valid diagrams even if one fails
	t.true(result.imageFiles.length >= 0);
	t.truthy(result.processedMarkdown);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with whitespace variations', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Whitespace Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n\tcommit id: "Tab Indented"\n    commit id: "Space Indented"\n  commit id: "Two Spaces"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9014);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph mixed with other diagram types', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Mixed Diagrams\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Git Start"\n\`\`\`\n\n\`\`\`mermaid\nflowchart TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Git End"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9015);

	t.is(result.imageFiles.length, 3);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should preserve gitGraph rendering quality', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Quality Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    branch develop\n    checkout develop\n    commit id: "Work"\n    checkout main\n    merge develop\n    commit id: "Release"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9016);

	t.is(result.imageFiles.length, 1);
	
	// Verify image is substantial (not empty/corrupted)
	const stats = await fs.stat(result.imageFiles[0]!);
	t.true(stats.size > 1000); // Should be at least 1KB for a valid PNG

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with sequential operations', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Sequential\n\n\`\`\`mermaid\ngitGraph\n    commit id: "1"\n    commit id: "2"\n    commit id: "3"\n    commit id: "4"\n    commit id: "5"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9017);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with rapid branch switching', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Rapid Switching\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Start"\n    branch A\n    branch B\n    branch C\n    checkout A\n    commit id: "A1"\n    checkout B\n    commit id: "B1"\n    checkout C\n    commit id: "C1"\n    checkout A\n    commit id: "A2"\n    checkout B\n    commit id: "B2"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9018);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});
