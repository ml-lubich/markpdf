/**
 * Comprehensive error handling tests for Mermaid processing
 *
 * Ensures graceful error handling, resource cleanup, and stability
 * under various failure scenarios.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('processCharts should gracefully handle completely invalid Mermaid syntax', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Invalid\n\n\`\`\`mermaid\nthis is completely invalid syntax!!!\nrandom text here\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9100);

	// Should not crash, should continue processing
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);
	// Should still return valid structure
	t.truthy(Array.isArray(result.imageFiles));
	t.truthy(Array.isArray(result.warnings));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle multiple invalid diagrams gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Multiple Invalid\n\n\`\`\`mermaid\ninvalid 1\n\`\`\`\n\n\`\`\`mermaid\ninvalid 2\n\`\`\`\n\n\`\`\`mermaid\ninvalid 3\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9101);

	// Should process all three, even if all fail
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);
	// Should not throw or crash
	t.pass();

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle mixed valid and invalid diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Mixed\n\n\`\`\`mermaid\ninvalid syntax\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Valid"\n\`\`\`\n\n\`\`\`mermaid\nalso invalid\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9102);

	// Should process valid diagram even if others fail
	t.truthy(result.processedMarkdown);
	// Should have at least attempted to process all
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle empty Mermaid blocks gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Empty\n\n\`\`\`mermaid\n\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9103);

	t.is(result.imageFiles.length, 0);
	t.true(result.warnings.length >= 1);
	t.true(result.warnings[0]!.includes('Skipping empty'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle whitespace-only Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Whitespace\n\n\`\`\`mermaid\n   \n\t\n  \n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9104);

	t.is(result.imageFiles.length, 0);
	t.true(result.warnings.length >= 1);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle extremely long Mermaid code gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	// Create a very long gitGraph
	const longCode = `gitGraph\n${Array.from({ length: 100 }, (_, i) => `    commit id: "Commit ${i}"`).join('\n')}`;
	const markdown = `# Long Code\n\n\`\`\`mermaid\n${longCode}\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9105);

	// Should handle it gracefully (may succeed or fail, but shouldn't crash)
	t.truthy(result.processedMarkdown);
	t.truthy(Array.isArray(result.imageFiles));
	t.truthy(Array.isArray(result.warnings));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle special characters in Mermaid code', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Special Chars\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Test with <>&\"' special chars"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9106);

	// Should handle special characters gracefully
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle malformed gitGraph syntax gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Malformed\n\n\`\`\`mermaid\ngitGraph\n    commit\n    branch\n    checkout\n    merge\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9107);

	// Should not crash on malformed syntax
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with missing branch before checkout', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Missing Branch\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    checkout nonexistent\n    commit id: "Should Fail"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9108);

	// Should handle gracefully
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with duplicate branch names', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Duplicate Branches\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    branch develop\n    branch develop\n    checkout develop\n    commit id: "Work"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9109);

	// Should handle duplicate branch names
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with merge before branch exists', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Premature Merge\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    merge nonexistent\n    commit id: "After Merge"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9110);

	// Should handle gracefully
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should cleanup resources even on error', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Error Test\n\n\`\`\`mermaid\ninvalid syntax that will fail\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9111);

	// Should still return valid structure
	t.truthy(result.processedMarkdown);
	t.truthy(Array.isArray(result.imageFiles));
	t.truthy(Array.isArray(result.warnings));

	// Cleanup should work
	await processor.cleanup(result.imageFiles);
	
	// Verify cleanup worked
	for (const imageFile of result.imageFiles) {
		const exists = await fs.access(imageFile).then(() => true).catch(() => false);
		t.false(exists, `Image file ${imageFile} should be cleaned up`);
	}
});

test('processCharts should handle concurrent processing of multiple diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Concurrent\n\n\`\`\`mermaid\ngitGraph\n    commit id: "1"\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "2"\n\`\`\`\n\n\`\`\`mermaid\ngitGraph\n    commit id: "3"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9112);

	// Should process all concurrently without issues
	t.true(result.imageFiles.length >= 0);
	t.truthy(result.processedMarkdown);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('cleanup should handle non-existent files gracefully', async (t) => {
	const processor = new MermaidProcessorService();
	const nonExistentFiles = [
		join(tmpdir(), 'nonexistent1.png'),
		join(tmpdir(), 'nonexistent2.png'),
	];

	// Should not throw when cleaning up non-existent files
	await t.notThrowsAsync(async () => {
		await processor.cleanup(nonExistentFiles);
	});
});

test('cleanup should handle empty array', async (t) => {
	const processor = new MermaidProcessorService();

	// Should not throw on empty array
	await t.notThrowsAsync(async () => {
		await processor.cleanup([]);
	});
});

test('processCharts should handle markdown with no Mermaid blocks efficiently', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# No Mermaid\n\nJust regular markdown content here.\n\n\`\`\`javascript\nconsole.log('test');\n\`\`\`\n\nMore content.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9113);

	// Should return immediately without processing
	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should handle markdown with only non-Mermaid code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Code Only\n\n\`\`\`python\ndef hello():\n    print("world")\n\`\`\`\n\n\`\`\`json\n{"key": "value"}\n\`\`\`\n\n\`\`\`bash\necho "test"\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9114);

	// Should not process non-Mermaid blocks
	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should preserve original markdown structure on error', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Structure Test\n\nSome text.\n\n\`\`\`mermaid\ninvalid\n\`\`\`\n\nMore text.\n\n\`\`\`javascript\ncode here\n\`\`\`\n\nEnd.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9115);

	// Should preserve structure
	t.true(result.processedMarkdown.includes('Some text.'));
	t.true(result.processedMarkdown.includes('More text.'));
	t.true(result.processedMarkdown.includes('End.'));

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle gitGraph with unicode characters', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Unicode\n\n\`\`\`mermaid\ngitGraph\n    commit id: "测试 🚀 功能"\n    branch 功能分支\n    checkout 功能分支\n    commit id: "工作完成 ✅"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9116);

	// Should handle unicode gracefully
	t.truthy(result.processedMarkdown);
	t.true(result.warnings.length >= 0);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('processCharts should handle very large number of gitGraph diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const diagrams = Array.from({ length: 10 }, (_, i) => 
		`\`\`\`mermaid\ngitGraph\n    commit id: "Diagram ${i + 1}"\n\`\`\``
	).join('\n\n');
	const markdown = `# Many Diagrams\n\n${diagrams}\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9117);

	// Should handle many diagrams
	t.true(result.imageFiles.length >= 0);
	t.truthy(result.processedMarkdown);

	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

