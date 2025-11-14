# 📄 Markdown to PDF Converter

<div align="center">

**A modern, powerful CLI tool for converting Markdown documents to beautiful PDFs**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## ✨ Features

- 🎨 **Mermaid Diagram Support** - Automatically renders flowcharts, sequence diagrams, Gantt charts, and more
- 🎯 **Syntax Highlighting** - Beautiful code blocks with syntax highlighting via highlight.js
- 🎨 **Custom Styling** - Full control over PDF appearance with custom CSS and stylesheets
- 📝 **Front Matter** - YAML configuration for document settings
- 🔄 **Watch Mode** - Automatically regenerate PDFs when files change
- 🚀 **Modern Architecture** - Clean, maintainable, and extensible TypeScript codebase
- 📦 **Programmatic API** - Use it as a library in your Node.js projects
- 🌐 **Multiple Formats** - Support for PDF and HTML output
- ⚡ **Concurrent Processing** - Convert multiple files simultaneously
- 🔧 **Highly Configurable** - Extensive customization options

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Architecture](#-architecture)
- [Development](#-development)
- [Examples](#-examples)
- [Security](#-security-considerations)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

### Installation

```bash
npm install -g markpdf
```

Or clone and install locally:

```bash
git clone https://github.com/ml-lubich/markpdf.git
cd markpdf
npm install
npm link
```

#### As a Dependency

```bash
npm install markpdf
```

### Basic Usage

```bash
# Convert a single file
markpdf document.md

# Convert multiple files
markpdf *.md

# Watch mode - automatically regenerate on changes
markpdf --watch document.md

# Use stdin
cat document.md | markpdf > output.pdf
```

## 📖 Documentation

### Mermaid Diagrams

This tool has built-in support for Mermaid diagrams! Simply include Mermaid code blocks in your Markdown:

````markdown
```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
```
````

Supported diagram types:
- Flowcharts
- Sequence Diagrams
- Gantt Charts
- Class Diagrams
- State Diagrams
- Entity Relationship Diagrams
- And more!

### Programmatic API

```typescript
import { mdToPdf } from 'markpdf';
import { writeFileSync } from 'fs';

async function convert() {
  const pdf = await mdToPdf(
    { path: 'document.md' },
    {
      pdf_options: {
        format: 'A4',
        margin: '30mm',
        printBackground: true,
      },
    }
  );

  if (pdf) {
    writeFileSync(pdf.filename, pdf.content);
    console.log('PDF generated successfully!');
  }
}

convert();
```

### Configuration Options

markpdf supports multiple ways to configure PDF generation. Configuration sources are merged in the following order (later sources override earlier ones):

1. **Default configuration** - Built-in defaults
2. **Config file** (optional) - JSON/JS config file specified with `--config-file`
3. **Front matter** (optional) - YAML front matter in the Markdown file
4. **CLI arguments** - Command-line options (highest priority)

#### When to Use Each Method

- **Front Matter**: Use for document-specific settings that should be part of the document itself (recommended for per-document configuration)
- **CLI Arguments**: Use for temporary overrides, batch processing with different settings, or when you don't want to modify the document
- **Config File**: Use for project-wide defaults shared across multiple documents

#### CLI Options

| Option | Description | Example |
|-------|-------------|---------|
| `--basedir` | Base directory for file server | `--basedir ./docs` |
| `--stylesheet` | Custom stylesheet (can be used multiple times) | `--stylesheet custom.css` |
| `--css` | Inline CSS styles | `--css "body { font-size: 12px; }"` |
| `--highlight-style` | Code highlighting theme | `--highlight-style monokai` |
| `--pdf-options` | Puppeteer PDF options (JSON) | `--pdf-options '{"format":"Letter"}'` |
| `--watch` | Watch mode | `--watch` |
| `--as-html` | Output HTML instead of PDF | `--as-html` |
| `--port` | HTTP server port | `--port 3000` |

#### Front Matter Configuration

Configure your document using YAML front matter at the top of your Markdown file. This is the recommended approach for document-specific settings:

````markdown
---
pdf_options:
  format: a4
  margin: 30mm 25mm
  printBackground: true
  headerTemplate: |-
    <div style="text-align: center; font-size: 11px;">
      Document Title
    </div>
  footerTemplate: |-
    <div style="text-align: center;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
stylesheet:
  - https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.0.0/github-markdown.min.css
body_class: markdown-body
highlight_style: github
---

# Your Document Content
````

**Note**: CLI arguments override front matter settings. For example, if your front matter specifies `format: a4` but you run `markpdf --pdf-options '{"format":"Letter"}' document.md`, the Letter format will be used.

### Advanced Features

#### Custom Headers and Footers

Use Puppeteer's header and footer templates with dynamic values:

```markdown
---
pdf_options:
  headerTemplate: |-
    <div style="font-size: 10px; width: 100%; text-align: center;">
      <span class="title"></span> - <span class="date"></span>
    </div>
  footerTemplate: |-
    <div style="font-size: 10px; width: 100%; text-align: center;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
---
```

#### Page Breaks

Force page breaks using CSS:

```html
<div class="page-break"></div>
```

#### Math Formulas

Support for MathJax (see examples in `/src/test/mathjax`).

## 🏗️ Architecture

This tool uses a modern, modular architecture:

1. **Markdown Parser** - Uses Marked to convert Markdown to HTML
2. **Mermaid Processor** - Renders Mermaid diagrams to images using Puppeteer
3. **PDF Generator** - Uses Puppeteer (headless Chrome) to generate PDFs
4. **Styling Engine** - Applies custom CSS and themes

## 🛠️ Development

### Setup

```bash
git clone https://github.com/ml-lubich/markpdf.git
cd markpdf
npm install
```

### Build

```bash
npm run build
```

### Watch Mode (Development)

```bash
npm start
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## 📝 Examples

### Example 1: Basic Conversion

```bash
markpdf README.md
```

### Example 2: Custom Styling

```bash
markpdf document.md \
  --stylesheet custom.css \
  --css "body { font-family: 'Georgia', serif; }" \
  --highlight-style github
```

### Example 3: Watch Mode

```bash
markpdf --watch document.md
```

### Example 4: Multiple Files

```bash
markpdf chapter1.md chapter2.md chapter3.md
```

## 🔒 Security Considerations

### Local File Server

This tool runs a local HTTP server to serve files during conversion. The server:
- Runs on `localhost` on a random port (or specified port)
- Shuts down automatically when the process exits
- Only serves files within the specified base directory

**Note:** Be cautious when running in watch mode, as the server remains active.

### Untrusted Content

Always sanitize user-provided Markdown content before processing to prevent security issues.

## 🤝 Contributing

Contributions are welcome! We appreciate your help in making markpdf better.

Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Coding standards
- Testing requirements
- Pull request process

### Quick Contribution Steps

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Misha Lubich**

- GitHub: [@ml-lubich](https://github.com/ml-lubich)
- Email: michaelle.lubich@gmail.com

## 🙏 Acknowledgments

- Built with [Marked](https://github.com/markedjs/marked) for Markdown parsing
- Powered by [Puppeteer](https://github.com/puppeteer/puppeteer) for PDF generation
- Syntax highlighting by [highlight.js](https://github.com/highlightjs/highlight.js)
- Diagram rendering with [Mermaid](https://mermaid.js.org/)

---

<div align="center">

Made with ❤️ by [Misha Lubich](https://github.com/ml-lubich)

</div>
