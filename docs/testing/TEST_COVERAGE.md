# Test Coverage Documentation

## 📋 Table of Contents

- [Test Files Summary](#test-files-summary)
- [Domain Layer Tests](#domain-layer-tests)
- [Service Layer Tests](#service-layer-tests)
- [Mermaid Processing Tests](#mermaid-processing-tests)
- [CLI Tests](#cli-tests)
- [Edge Case Tests](#edge-case-tests)
- [Test Coverage Statistics](#test-coverage-statistics)
- [Running Tests](#running-tests)

## Test Files Summary

Total test files: **36**
- Domain layer tests: 4 files
- Service layer tests: 8 files  
- Mermaid processing tests: 8 files
- CLI tests: 3 files
- Edge case tests: 13+ files

### Test Count by Category

- **Mermaid Processing**: 8 test files covering all Mermaid edge cases
- **Core Services**: ConverterService, FileService, ConfigService, etc.
- **CLI**: Full CLI functionality and edge cases
- **Domain**: Entities, errors, logging, result types
- **Edge Cases**: Comprehensive negative testing and boundary conditions

## Domain Layer Tests

### `src/test/domain/entities.spec.ts`
**Purpose**: Tests domain entities and value objects

**Coverage**:
- ✅ InputSource (fromPath, fromContent, from, validation)
- ✅ OutputDestination (toFile, toStdout, from)
- ✅ ConversionRequest (PDF, HTML)
- ✅ Edge cases (empty strings, very long paths/content, special characters, unicode)
- ✅ Boundary tests (maximum path length, large content)
- ✅ Negative tests (null, undefined, invalid types)
- ✅ Real-world scenarios (file conversion, stdin to stdout, file to stdout)

**Test Count**: 50+ tests

### `src/test/domain/errors.spec.ts`
**Purpose**: Tests domain-specific error types

**Coverage**:
- ✅ All error types (ValidationError, FileError, ConfigurationError, MarkdownParseError, MermaidProcessError, OutputGenerationError, ServerError)
- ✅ Error properties (code, message, timestamp, cause)
- ✅ Error inheritance (DomainError base class)
- ✅ Error serialization (JSON)
- ✅ Edge cases (empty messages, very long messages, special characters, unicode)
- ✅ Null and undefined cause
- ✅ Error throwing
- ✅ Error comparison
- ✅ Real-world scenarios (file not found, invalid config, Mermaid failures, server errors)

**Test Count**: 40+ tests

### `src/test/domain/logger.spec.ts`
**Purpose**: Tests logger interface and implementations

**Coverage**:
- ✅ ConsoleLogger with all log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Log level filtering
- ✅ SilentLogger (no logging)
- ✅ Error object logging
- ✅ Edge cases (empty messages, special characters, very long messages)
- ✅ Multiple arguments
- ✅ isLevelEnabled checks
- ✅ Interface compliance
- ✅ Performance tests
- ✅ Negative tests (null, undefined messages)

**Test Count**: 30+ tests

### `src/test/domain/result.spec.ts`
**Purpose**: Tests functional error handling with Result type

**Coverage**:
- ✅ Basic functionality (ok, err, unwrap, unwrapOr, unwrapOrElse)
- ✅ Map operations (map, mapErr)
- ✅ Edge cases (null, undefined, empty strings, zero, false)
- ✅ Complex objects (nested structures, arrays, functions)
- ✅ Error types (TypeError, ReferenceError, string errors)
- ✅ Chaining operations
- ✅ Type guards (isOk, isErr)
- ✅ Performance tests (large arrays, large strings)
- ✅ Negative tests (invalid usage)
- ✅ Real-world scenarios (file read, validation)

**Test Count**: 50+ tests

## Service Layer Tests

### `src/test/converter-service.spec.ts`
**Purpose**: Tests ConverterService with basic functionality and error handling

**Coverage**:
- ✅ Basic conversion (content input, path input)
- ✅ HTML output
- ✅ Error handling (ValidationError, OutputGenerationError)
- ✅ Front-matter parsing
- ✅ Mermaid diagram processing
- ✅ File output
- ✅ Stdout output
- ✅ Cleanup

**Test Count**: 10+ tests

### `src/test/converter-service-edge-cases.spec.ts`
**Purpose**: Comprehensive edge cases and negative tests for ConverterService

**Coverage**:
- ✅ Empty content (empty strings, whitespace only, newlines only)
- ✅ Very long content (1000+ lines, large markdown files)
- ✅ Special characters (HTML entities, unicode, emojis)
- ✅ Front-matter edge cases (invalid YAML, special characters, PDF options)
- ✅ Mermaid diagrams (invalid syntax, multiple diagrams)
- ✅ File operations (non-existent directories, permission errors)
- ✅ Configuration edge cases (empty stylesheets, custom CSS, invalid highlight styles)
- ✅ Logger integration (ConsoleLogger, SilentLogger)
- ✅ Type validation (null, undefined, invalid types)

**Test Count**: 28+ tests

### `src/test/config-service.spec.ts`
**Purpose**: Tests configuration merging and validation

**Coverage**:
- ✅ Default configuration
- ✅ Config file loading (JSON, JS)
- ✅ Front-matter parsing
- ✅ CLI argument merging
- ✅ Configuration priority
- ✅ Error handling (invalid config, missing files)

**Test Count**: 15+ tests

### `src/test/file-service.spec.ts`
**Purpose**: Tests file I/O operations

**Coverage**:
- ✅ File reading (with encoding)
- ✅ File writing (Buffer, string)
- ✅ Directory creation
- ✅ Error handling (file not found, permission denied)

**Test Count**: 8+ tests

### `src/test/markdown-parser-service.spec.ts`
**Purpose**: Tests Markdown parsing and syntax highlighting

**Coverage**:
- ✅ Basic markdown parsing
- ✅ Code block highlighting
- ✅ Custom highlight styles
- ✅ Marked options

**Test Count**: 7+ tests

### `src/test/output-generator-service.spec.ts`
**Purpose**: Tests PDF/HTML generation

**Coverage**:
- ✅ PDF generation
- ✅ HTML generation
- ✅ Custom PDF options
- ✅ Error handling

**Test Count**: 10+ tests

### `src/test/output-generator-edge-cases.spec.ts`
**Purpose**: Edge cases for output generation

**Coverage**:
- ✅ Large HTML content
- ✅ Custom PDF formats
- ✅ Resource waiting
- ✅ Timeout handling

**Test Count**: 13+ tests

### `src/test/server-service.spec.ts`
**Purpose**: Tests HTTP server management

**Coverage**:
- ✅ Server startup
- ✅ Server stop
- ✅ Port management
- ✅ Error handling

**Test Count**: 5+ tests

## Mermaid Processing Tests

### `src/test/mermaid-processor-service.spec.ts`
**Purpose**: Core Mermaid processing functionality

**Coverage**:
- ✅ No Mermaid blocks (should NOT process)
- ✅ Simple Mermaid diagram
- ✅ Multiple Mermaid diagrams
- ✅ Empty Mermaid blocks
- ✅ Error handling (invalid syntax)
- ✅ Image generation and cleanup

**Test Count**: 11+ tests

### `src/test/mermaid-edge-cases.spec.ts` ⭐ **NEW**
**Purpose**: Comprehensive Mermaid edge case tests

**Coverage**:
- ✅ **No Mermaid Charts Present**:
  - Plain text only
  - Only non-Mermaid code blocks (JavaScript, Python, Bash, TypeScript, JSON, YAML, SQL, HTML/XML)
  - Case-insensitive non-Mermaid blocks (MERMAID, Mermaid, etc. - should NOT process)
- ✅ **Mixed Content**:
  - Mermaid + non-Mermaid blocks (process ONLY Mermaid)
  - Multiple Mermaid blocks + other code blocks
- ✅ **Edge Cases**:
  - Empty/whitespace-only Mermaid blocks
  - Code fences without language
  - Malformed code fences
  - Very large files without Mermaid
  - Special characters
  - Empty markdown strings
  - Only whitespace/newlines

**Test Count**: 14+ tests

**Key Test**: Ensures Mermaid charts are **only generated when present** in markdown files.

### `src/test/mermaid-api.spec.ts`
**Purpose**: Mermaid processing via public API

**Coverage**:
- ✅ API integration
- ✅ Error handling

**Test Count**: 8+ tests

### `src/test/mermaid-image-generation.spec.ts`
**Purpose**: Mermaid image generation

**Coverage**:
- ✅ Image rendering
- ✅ File paths
- ✅ Cleanup

**Test Count**: 7+ tests

### `src/test/mermaid-parallel-processing.spec.ts`
**Purpose**: Parallel Mermaid processing

**Coverage**:
- ✅ Multiple diagrams in parallel
- ✅ Resource management

**Test Count**: 8+ tests

### `src/test/mermaid-optimization.spec.ts`
**Purpose**: Mermaid processing optimizations

**Coverage**:
- ✅ Performance optimizations
- ✅ Case-insensitive detection
- ✅ Resource reuse

**Test Count**: 15+ tests

### `src/test/process-mermaid.spec.ts`
**Purpose**: Legacy Mermaid processing functions

**Coverage**:
- ✅ Backward compatibility
- ✅ Legacy function exports

**Test Count**: 11+ tests

### `src/test/server-mermaid-images.spec.ts`
**Purpose**: Server serving Mermaid images

**Coverage**:
- ✅ Image serving
- ✅ Temp directory handling

**Test Count**: 13+ tests

## CLI Tests

### `src/test/cli.spec.ts`
**Purpose**: CLI entry point tests

**Coverage**:
- ✅ Argument parsing
- ✅ Version output
- ✅ Help output

**Test Count**: 3+ tests

### `src/test/cli-service.spec.ts`
**Purpose**: CliService functionality

**Coverage**:
- ✅ Configuration loading
- ✅ File processing
- ✅ Watch mode
- ✅ Error handling

**Test Count**: 6+ tests

### `src/test/cli-edge-cases.spec.ts`
**Purpose**: CLI edge cases

**Coverage**:
- ✅ Invalid arguments
- ✅ Missing files
- ✅ Permission errors
- ✅ Multiple files

**Test Count**: 12+ tests

## Edge Case Tests

### `src/test/edge-cases.spec.ts`
**Purpose**: General edge cases

**Coverage**:
- ✅ Empty content
- ✅ Whitespace-only
- ✅ Very long content
- ✅ Special characters
- ✅ Code blocks
- ✅ Nested lists
- ✅ Tables
- ✅ Links and images
- ✅ HTML elements
- ✅ Front matter

**Test Count**: 13+ tests

### `src/test/edge-cases-negative.spec.ts`
**Purpose**: Negative edge cases

**Coverage**:
- ✅ Invalid Mermaid syntax
- ✅ Extremely long Mermaid code
- ✅ Special characters in Mermaid
- ✅ Empty markdown
- ✅ Malformed code fences
- ✅ Case-sensitivity issues

**Test Count**: 39+ tests

## Test Coverage Statistics

### Total Test Count

- **Domain Layer**: 170+ tests (entities, errors, logger, result)
- **Service Layer**: 80+ tests (converter, config, file, markdown parser, output generator, server)
- **Mermaid Processing**: 100+ tests (core, edge cases, API, image generation, parallel, optimization)
- **CLI**: 20+ tests (entry point, service, edge cases)
- **Edge Cases**: 50+ tests (general, negative)

**Total: 420+ tests across 36 test files**

### Coverage Areas

✅ **Core Functionality**: All main features tested
✅ **Mermaid Processing**: Comprehensive coverage including edge cases
✅ **Error Handling**: All error types and scenarios
✅ **Edge Cases**: Extensive boundary testing
✅ **CLI**: Full command-line interface
✅ **Configuration**: All config sources and merging
✅ **File Operations**: Reading, writing, permissions
✅ **Resource Management**: Browser, server, temp files

### Key Test Coverage

#### Mermaid Processing (Critical)
- ✅ **No Mermaid charts**: Correctly skips processing (14+ tests)
- ✅ **Non-Mermaid code blocks**: Correctly ignores (14+ tests)
- ✅ **Mixed content**: Processes only Mermaid (14+ tests)
- ✅ **Multiple diagrams**: All processed correctly
- ✅ **Error handling**: Invalid syntax, timeouts, cleanup

#### Core Conversion
- ✅ **Input types**: Path, content, stdin
- ✅ **Output types**: PDF, HTML, stdout
- ✅ **Configuration**: All sources and priority
- ✅ **Front matter**: YAML parsing and merging

#### Error Handling
- ✅ **Validation errors**: All validation scenarios
- ✅ **File errors**: Not found, permissions, encoding
- ✅ **Conversion errors**: Generation failures
- ✅ **Server errors**: Port conflicts, startup failures

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Files

```bash
# Mermaid tests
npx ava src/test/mermaid-processor-service.spec.ts src/test/mermaid-edge-cases.spec.ts --timeout=2m

# Converter tests
npx ava src/test/converter-service.spec.ts src/test/converter-service-edge-cases.spec.ts --timeout=2m

# CLI tests
npx ava src/test/cli.spec.ts src/test/cli-service.spec.ts src/test/cli-edge-cases.spec.ts

# Domain tests
npx ava src/test/domain/*.spec.ts
```

### Run Tests with Coverage

```bash
npm test
# Coverage reports generated in coverage/ directory
```

### Test Timeouts

Some tests (especially Mermaid processing) may take longer:
- Default timeout: 10s
- Mermaid tests: 2m timeout recommended
- Use `--timeout=2m` for Mermaid-related tests

## Test Organization

Tests are organized by layer and functionality:

```
src/test/
├── domain/              # Domain layer tests
│   ├── entities.spec.ts
│   ├── errors.spec.ts
│   ├── logger.spec.ts
│   └── result.spec.ts
├── services/            # Service layer tests (implicit)
│   ├── converter-service.spec.ts
│   ├── config-service.spec.ts
│   ├── file-service.spec.ts
│   └── ...
├── mermaid/             # Mermaid-specific tests
│   ├── mermaid-processor-service.spec.ts
│   ├── mermaid-edge-cases.spec.ts ⭐ NEW
│   ├── mermaid-api.spec.ts
│   └── ...
├── cli/                 # CLI tests (implicit)
│   ├── cli.spec.ts
│   ├── cli-service.spec.ts
│   └── cli-edge-cases.spec.ts
└── edge-cases/          # General edge cases
    ├── edge-cases.spec.ts
    └── edge-cases-negative.spec.ts
```

## Testing Strategy

### Unit Tests
- Individual services and utilities
- Domain entities and value objects
- Error types and handling

### Integration Tests
- Service interactions
- Full conversion workflows
- API integration

### Edge Case Tests
- Boundary conditions
- Invalid inputs
- Error scenarios
- Performance edge cases

### Mermaid-Specific Tests
- No Mermaid charts (should NOT process)
- Non-Mermaid code blocks (should NOT process)
- Mixed content (process ONLY Mermaid)
- Multiple diagrams
- Error handling
- Cleanup

## Test Best Practices

### Test Organization
- One test file per source file (e.g., `converter-service.spec.ts` for `ConverterService.ts`)
- Group related tests using descriptive names
- Use `test.before` and `test.after` for setup/cleanup

### Test Naming
- Use descriptive names: `should NOT process markdown with no Mermaid blocks`
- Group by functionality
- Use consistent naming patterns

### Test Data
- Use realistic test data
- Test both success and error cases
- Include edge cases and boundary conditions

### Resource Cleanup
- Always cleanup browser instances
- Clean up temporary files
- Stop servers after tests

## Related Documentation

- **Architecture**: [../architecture.md](../architecture.md) - System architecture
- **System Design**: [../system-design.md](../system-design.md) - Design patterns
- **CLI Interface**: [../cli-interface.md](../cli-interface.md) - CLI reference
