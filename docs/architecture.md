# Architecture Documentation

## Overview

This document describes the architecture of the markpdf tool, a modern CLI application for converting Markdown documents to PDF with support for Mermaid diagrams, syntax highlighting, and advanced customization.

## 📋 Table of Contents

- [Architecture Principles](#architecture-principles)
- [System Layers](#system-layers)
  - [1. Presentation Layer](#1-presentation-layer)
  - [2. Application Layer](#2-application-layer)
  - [3. Domain Layer](#3-domain-layer)
  - [4. Service Layer](#4-service-layer)
  - [5. Infrastructure Layer](#5-infrastructure-layer)
- [Data Flow](#data-flow)
  - [Conversion Workflow](#conversion-workflow)
  - [Configuration Resolution Order](#configuration-resolution-order)
  - [Mermaid Processing Flow](#mermaid-processing-flow)
- [Key Components](#key-components)
  - [Server Architecture](#server-architecture)
  - [Browser Management](#browser-management)
  - [Image Handling](#image-handling)
- [Dependency Graph](#dependency-graph)
- [Error Handling](#error-handling)
- [Testing Strategy](#testing-strategy)
- [Extensibility Points](#extensibility-points)
- [Performance Considerations](#performance-considerations)
- [Security Considerations](#security-considerations)

## Architecture Principles

The tool follows **Clean Architecture** principles with the following key concepts:

1. **Separation of Concerns** - Clear boundaries between different layers
2. **Dependency Inversion** - High-level modules don't depend on low-level modules
3. **Single Responsibility** - Each module has one clear purpose
4. **Interface Segregation** - Clients depend only on interfaces they use
5. **Testability** - All components are designed for easy testing

## System Layers

### 1. Presentation Layer

**Location:** `src/cli.ts`, `src/lib/cli/`

This layer handles all user interaction:

- **CLI Entry Point** (`cli.ts`): Parses command-line arguments and delegates to `CliService`
- **CliService** (`lib/cli/CliService.ts`): Orchestrates CLI operations including:
  - Argument parsing and validation
  - Configuration loading and merging
  - File processing (single, multiple, or stdin)
  - Watch mode management
  - Error handling and user feedback

**Responsibilities:**
- Parse and validate CLI arguments
- Load configuration from files, front-matter, and CLI args
- Coordinate file processing (single, batch, or watch mode)
- Display help text and version information
- Handle stdin/stdout operations

### 2. Application Layer

**Location:** `src/index.ts`, `src/lib/core/`

This layer contains the main application logic:

- **Public API** (`index.ts`): Exposes `mdToPdf()` function for programmatic use
- **Converter** (`lib/core/converter.ts`): Orchestrates the conversion workflow
- **Output Generator** (`lib/core/output-generator.ts`): Handles PDF/HTML generation

**Responsibilities:**
- Coordinate the conversion process
- Manage server and browser lifecycle
- Handle resource cleanup
- Provide a clean public API

### 3. Domain Layer

**Location:** `src/lib/domain/`

This layer contains core business logic and entities:

- **Entities** (`domain/entities.ts`): Domain models like `InputSource`, `OutputDestination`
- **Errors** (`domain/errors.ts`): Domain-specific error types
- **Logger** (`domain/Logger.ts`): Logging interface and implementations
- **Result** (`domain/Result.ts`): Result type for error handling

**Responsibilities:**
- Define core business concepts
- Enforce business rules and validation
- Provide domain-specific error types
- Remain framework-agnostic

### 4. Service Layer

**Location:** `src/lib/services/`

This layer implements specific business capabilities:

- **ConverterService**: Orchestrates markdown to PDF/HTML conversion
- **MermaidProcessorService**: Processes Mermaid diagrams into images
- **OutputGeneratorService**: Generates PDF/HTML output using Puppeteer
- **FileService**: Handles file I/O operations
- **ConfigService**: Manages configuration loading and merging
- **ServerService**: Manages HTTP server for file serving
- **MarkdownParserService**: Parses Markdown with syntax highlighting

**Responsibilities:**
- Implement business logic
- Coordinate with external dependencies (Puppeteer, file system, HTTP)
- Handle cross-cutting concerns (logging, error handling)
- Provide testable, injectable services

### 5. Infrastructure Layer

**Location:** `src/lib/utils/`, `src/lib/renderers/`, `src/lib/validators/`

This layer contains low-level utilities and adapters:

- **Utils** (`utils/`): Helper functions for file, path, URL, PDF operations
- **Renderers** (`renderers/`): HTML and Markdown rendering implementations
- **Validators** (`validators/`): Validation logic (e.g., Node version)
- **Server** (`server/`): HTTP server implementation

**Responsibilities:**
- Provide low-level utilities
- Interface with external libraries (Marked, highlight.js, Puppeteer)
- Handle system-specific operations (file system, network)

## Data Flow

### Conversion Workflow

```
User Input (CLI/API)
    ↓
CLI Service / Public API
    ↓
Converter Service
    ↓
1. File Service (read markdown)
2. Config Service (merge configuration)
3. Markdown Parser Service (parse markdown)
4. Mermaid Processor Service (process diagrams)
5. HTML Renderer (generate HTML)
6. Output Generator Service (generate PDF/HTML)
    ↓
File Service (write output)
    ↓
Result returned to user
```

### Configuration Resolution Order

1. **Default Configuration** - Built-in defaults in `config.ts`
2. **Config File** - Optional JSON/JS file specified with `--config-file`
3. **Front Matter** - YAML front matter in the Markdown file
4. **CLI Arguments** - Command-line options (highest priority)

### Mermaid Processing Flow

```
Markdown with Mermaid blocks
    ↓
MermaidProcessorService detects blocks
    ↓
For each block:
    1. Launch Puppeteer page
    2. Load Mermaid.js library
    3. Render diagram to SVG
    4. Take screenshot as PNG
    5. Save to temp directory
    6. Generate HTTP URL
    7. Replace block with image reference
    ↓
Updated Markdown (with image references)
```

## Key Components

### Server Architecture

The tool uses a local HTTP server to serve files during conversion:

- **Purpose**: Enable proper resolution of relative paths, images, and stylesheets
- **Port**: Random port by default, or specified with `--port`
- **Base Directory**: Serves files from `basedir` (defaults to markdown file directory or cwd)
- **Temp Images**: Serves Mermaid-generated images from `/__pdfify_temp__/` path

### Browser Management

Puppeteer browser instances are managed at two levels:

1. **API Level** (`index.ts`): One browser per API call, closed after conversion
2. **CLI Level** (`CliService`): One browser shared across all files, closed after all conversions

### Image Handling

Mermaid diagrams are rendered as PNG images:

- **Storage**: System temp directory (`os.tmpdir() + '/pdfify-mermaid-images'`)
- **Access**: Served via HTTP server at `/__pdfify_temp__/` path
- **Cleanup**: Images deleted after PDF generation completes
- **Cross-platform**: Uses `os.tmpdir()` for cross-platform compatibility

## Dependency Graph

```
CLI Entry Point
    ↓
CliService
    ├── ConfigService
    ├── ServerService
    ├── ConverterService
    │   ├── MermaidProcessorService
    │   ├── OutputGeneratorService
    │   ├── FileService
    │   └── MarkdownParserService
    └── OutputGeneratorService

Public API (index.ts)
    ↓
mdToPdf()
    ├── ServerService
    ├── OutputGeneratorService
    └── ConverterService
        └── (same as above)
```

## Error Handling

The architecture uses a layered error handling approach:

1. **Domain Errors** (`domain/errors.ts`): Business-logic errors
2. **Service Errors**: Wrapped domain errors with context
3. **CLI Errors**: User-friendly error messages
4. **API Errors**: Exception-based with clear error messages

## Testing Strategy

Each layer has corresponding tests:

- **Unit Tests**: Individual services and utilities
- **Integration Tests**: Service interactions
- **End-to-End Tests**: Full conversion workflows
- **Edge Case Tests**: Error conditions and boundary cases

## Extensibility Points

The architecture supports extension through:

1. **Service Interfaces**: Implement interfaces to provide custom implementations
2. **Renderer Plugins**: Custom HTML/Markdown renderers
3. **Configuration**: Extensive configuration options
4. **Custom Stylesheets**: Inject custom CSS
5. **Script Injection**: Add custom JavaScript to generated HTML

## Performance Considerations

- **Browser Reuse**: Single browser instance for multiple files in CLI mode
- **Concurrent Processing**: Multiple files processed in parallel
- **Temp Directory**: Efficient image storage and cleanup
- **Lazy Loading**: Resources loaded only when needed
- **Streaming**: Large files handled via streams

## Security Considerations

- **Local Server Only**: HTTP server only listens on localhost
- **Path Restrictions**: Server only serves from specified base directory
- **Temp Directory**: Isolated temp directory for generated images
- **Front Matter**: JavaScript execution in front-matter disabled by default
- **Input Validation**: All inputs validated before processing

