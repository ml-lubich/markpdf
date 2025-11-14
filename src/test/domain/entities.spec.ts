/**
 * Comprehensive tests for domain entities and value objects.
 * 
 * Tests InputSource, OutputDestination, and ConversionRequest
 * with edge cases and negative scenarios.
 */

import test from 'ava';
import { InputSource, OutputDestination, ConversionRequest } from '../../lib/domain/entities';
import { ValidationError } from '../../lib/domain/errors';

// ============================================================================
// InputSource Tests
// ============================================================================

test('InputSource.fromPath should create path-based input', (t) => {
	const input = InputSource.fromPath('/path/to/file.md');
	
	t.true(input.isPath());
	t.false(input.isContent());
	t.is(input.path, '/path/to/file.md');
	t.is(input.content, undefined);
});

test('InputSource.fromContent should create content-based input', (t) => {
	const input = InputSource.fromContent('# Hello World');
	
	t.false(input.isPath());
	t.true(input.isContent());
	t.is(input.path, undefined);
	t.is(input.content, '# Hello World');
});

test('InputSource.from should create from path object', (t) => {
	const input = InputSource.from({ path: '/path/to/file.md' });
	
	t.true(input.isPath());
	t.is(input.path, '/path/to/file.md');
});

test('InputSource.from should create from content object', (t) => {
	const input = InputSource.from({ content: '# Hello World' });
	
	t.true(input.isContent());
	t.is(input.content, '# Hello World');
});

// ============================================================================
// InputSource Validation Tests
// ============================================================================

test('InputSource should throw error when neither path nor content provided', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.from({});
	}, { instanceOf: ValidationError, message: /Input must have either path or content/ });
});

test('InputSource should throw error when both path and content provided', (t) => {
	t.throws(() => {
		InputSource.from({ path: '/path/to/file.md', content: '# Hello' });
	}, { instanceOf: ValidationError, message: /InputSource cannot have both path and content/ });
});

test('InputSource.fromPath should throw error for non-string path', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromPath(null);
	}, { instanceOf: ValidationError });
});

test('InputSource.fromContent should throw error for non-string content', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromContent(null);
	}, { instanceOf: ValidationError });
});

// ============================================================================
// InputSource Edge Cases
// ============================================================================

test('InputSource should handle empty string path', (t) => {
	const input = InputSource.fromPath('');
	
	t.true(input.isPath());
	t.is(input.path, '');
});

test('InputSource should handle empty string content', (t) => {
	const input = InputSource.fromContent('');
	
	t.true(input.isContent());
	t.is(input.content, '');
});

test('InputSource should handle very long path', (t) => {
	const longPath = '/path/' + 'a'.repeat(10000) + '.md';
	const input = InputSource.fromPath(longPath);
	
	t.is(input.path, longPath);
	t.is(input.path.length, 10000 + 10);
});

test('InputSource should handle very long content', (t) => {
	const longContent = '# ' + 'a'.repeat(100000);
	const input = InputSource.fromContent(longContent);
	
	t.is(input.content, longContent);
	t.is(input.content.length, 100000 + 2);
});

test('InputSource should handle path with special characters', (t) => {
	const path = '/path/with spaces/file-name.md';
	const input = InputSource.fromPath(path);
	
	t.is(input.path, path);
});

test('InputSource should handle path with unicode characters', (t) => {
	const path = '/path/中文/العربية/file.md';
	const input = InputSource.fromPath(path);
	
	t.is(input.path, path);
});

test('InputSource should handle content with special characters', (t) => {
	const content = '# Test\n\nContent with "quotes" and \'single quotes\' and\nnewlines\tand\ttabs';
	const input = InputSource.fromContent(content);
	
	t.is(input.content, content);
});

test('InputSource should handle content with unicode characters', (t) => {
	const content = '# Test\n\nContent with unicode: 🚀 📝 ✨ 中文 العربية';
	const input = InputSource.fromContent(content);
	
	t.is(input.content, content);
});

// ============================================================================
// OutputDestination Tests
// ============================================================================

test('OutputDestination.toFile should create file destination', (t) => {
	const dest = OutputDestination.toFile('/path/to/output.pdf');
	
	t.false(dest.isStdout());
	t.true(dest.isFile());
	t.is(dest.path, '/path/to/output.pdf');
});

test('OutputDestination.toStdout should create stdout destination', (t) => {
	const dest = OutputDestination.toStdout();
	
	t.true(dest.isStdout());
	t.false(dest.isFile());
	t.is(dest.path, undefined);
});

test('OutputDestination.from should create file destination from path', (t) => {
	const dest = OutputDestination.from('/path/to/output.pdf');
	
	t.true(dest.isFile());
	t.is(dest.path, '/path/to/output.pdf');
});

test('OutputDestination.from should create stdout destination from "stdout"', (t) => {
	const dest = OutputDestination.from('stdout');
	
	t.true(dest.isStdout());
});

test('OutputDestination.from should create stdout destination from undefined', (t) => {
	const dest = OutputDestination.from(undefined);
	
	t.true(dest.isStdout());
});

// ============================================================================
// OutputDestination Edge Cases
// ============================================================================

test('OutputDestination should handle empty string path', (t) => {
	const dest = OutputDestination.toFile('');
	
	t.true(dest.isFile());
	t.is(dest.path, '');
});

test('OutputDestination should handle very long path', (t) => {
	const longPath = '/path/' + 'a'.repeat(10000) + '.pdf';
	const dest = OutputDestination.toFile(longPath);
	
	t.is(dest.path, longPath);
	t.is(dest.path.length, 10000 + 10);
});

test('OutputDestination should handle path with special characters', (t) => {
	const path = '/path/with spaces/output-file.pdf';
	const dest = OutputDestination.toFile(path);
	
	t.is(dest.path, path);
});

test('OutputDestination should handle path with unicode characters', (t) => {
	const path = '/path/中文/العربية/output.pdf';
	const dest = OutputDestination.toFile(path);
	
	t.is(dest.path, path);
});

// ============================================================================
// ConversionRequest Tests
// ============================================================================

test('ConversionRequest should create PDF conversion request', (t) => {
	const input = InputSource.fromContent('# Hello');
	const output = OutputDestination.toFile('/path/to/output.pdf');
	const request = new ConversionRequest(input, output, 'pdf');
	
	t.true(request.isPdf());
	t.false(request.isHtml());
	t.is(request.format, 'pdf');
	t.is(request.input, input);
	t.is(request.output, output);
});

test('ConversionRequest should create HTML conversion request', (t) => {
	const input = InputSource.fromContent('# Hello');
	const output = OutputDestination.toFile('/path/to/output.html');
	const request = new ConversionRequest(input, output, 'html');
	
	t.false(request.isPdf());
	t.true(request.isHtml());
	t.is(request.format, 'html');
});

// ============================================================================
// ConversionRequest Edge Cases
// ============================================================================

test('ConversionRequest should handle path-based input', (t) => {
	const input = InputSource.fromPath('/path/to/input.md');
	const output = OutputDestination.toFile('/path/to/output.pdf');
	const request = new ConversionRequest(input, output, 'pdf');
	
	t.true(request.input.isPath());
	t.is(request.input.path, '/path/to/input.md');
});

test('ConversionRequest should handle content-based input', (t) => {
	const input = InputSource.fromContent('# Hello World');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'html');
	
	t.true(request.input.isContent());
	t.is(request.input.content, '# Hello World');
	t.true(request.output.isStdout());
});

test('ConversionRequest should handle stdout output', (t) => {
	const input = InputSource.fromContent('# Hello');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'pdf');
	
	t.true(request.output.isStdout());
});

// ============================================================================
// Integration Tests
// ============================================================================

test('should create complete conversion request with all components', (t) => {
	const input = InputSource.fromPath('/path/to/input.md');
	const output = OutputDestination.toFile('/path/to/output.pdf');
	const request = new ConversionRequest(input, output, 'pdf');
	
	t.true(request.input.isPath());
	t.true(request.output.isFile());
	t.true(request.isPdf());
	t.is(request.input.path, '/path/to/input.md');
	t.is(request.output.path, '/path/to/output.pdf');
});

test('should create HTML conversion request from content to stdout', (t) => {
	const input = InputSource.fromContent('# Hello World');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'html');
	
	t.true(request.input.isContent());
	t.true(request.output.isStdout());
	t.true(request.isHtml());
	t.is(request.input.content, '# Hello World');
});

// ============================================================================
// Negative Tests
// ============================================================================

test('InputSource should reject null path', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromPath(null);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject null content', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromContent(null);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject undefined path', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromPath(undefined);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject undefined content', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromContent(undefined);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject number as path', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromPath(123 as any);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject number as content', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromContent(123 as any);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject object as path', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromPath({} as any);
	}, { instanceOf: ValidationError });
});

test('InputSource should reject object as content', (t) => {
	t.throws(() => {
		// @ts-expect-error - intentionally testing invalid input
		InputSource.fromContent({} as any);
	}, { instanceOf: ValidationError });
});

// ============================================================================
// Boundary Tests
// ============================================================================

test('InputSource should handle maximum path length', (t) => {
	// Most systems support up to 4096 characters for paths
	const maxPath = '/'.repeat(4096);
	const input = InputSource.fromPath(maxPath);
	
	t.is(input.path, maxPath);
	t.is(input.path.length, 4096);
});

test('InputSource should handle very large content', (t) => {
	// Test with 1MB of content
	const largeContent = '# ' + 'a'.repeat(1024 * 1024);
	const input = InputSource.fromContent(largeContent);
	
	t.is(input.content, largeContent);
	t.is(input.content.length, 1024 * 1024 + 2);
});

test('OutputDestination should handle maximum path length', (t) => {
	const maxPath = '/'.repeat(4096);
	const dest = OutputDestination.toFile(maxPath);
	
	t.is(dest.path, maxPath);
	t.is(dest.path.length, 4096);
});

// ============================================================================
// Real-world Scenario Tests
// ============================================================================

test('should handle markdown file conversion scenario', (t) => {
	const input = InputSource.fromPath('./document.md');
	const output = OutputDestination.toFile('./document.pdf');
	const request = new ConversionRequest(input, output, 'pdf');
	
	t.true(request.input.isPath());
	t.true(request.output.isFile());
	t.true(request.isPdf());
});

test('should handle stdin to stdout conversion scenario', (t) => {
	const input = InputSource.fromContent('# Hello from stdin');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'html');
	
	t.true(request.input.isContent());
	t.true(request.output.isStdout());
	t.true(request.isHtml());
});

test('should handle file to stdout conversion scenario', (t) => {
	const input = InputSource.fromPath('./document.md');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'pdf');
	
	t.true(request.input.isPath());
	t.true(request.output.isStdout());
	t.true(request.isPdf());
});

