# Quick Start Guide - How to Run markpdf

## Simple Usage (Recommended)

### Step 1: Build the Project (if not already built)

```bash
npm run build
```

### Step 2: Run the Tool

**Basic command:**
```bash
node dist/cli.js <input-file.md>
```

**Examples:**
```bash
# Convert a single file
node dist/cli.js src/test/basic/test.md

# Convert the mermaid test file
node dist/cli.js src/test/mermaid/test-mermaid.md

# Convert with watch mode (auto-regenerate on changes)
node dist/cli.js src/test/basic/test.md -w

# Get help
node dist/cli.js --help
```

## Common Commands

### Convert a File
```bash
node dist/cli.js your-file.md
```
This creates `your-file.pdf` in the same directory.

### Convert Multiple Files
```bash
node dist/cli.js file1.md file2.md file3.md
```

### Watch Mode (Auto-regenerate)
```bash
node dist/cli.js your-file.md -w
```
Press `Ctrl+C` to stop watching.

### Custom Styling
```bash
# Use custom stylesheet
node dist/cli.js file.md --stylesheet custom.css

# Use custom CSS
node dist/cli.js file.md --css "body { font-family: Arial; }"

# Change code highlighting
node dist/cli.js file.md --highlight-style monokai
```

### Output HTML Instead of PDF
```bash
node dist/cli.js file.md --as-html
```

## Using npm link (Optional)

If you want to use the `markpdf` command directly:

```bash
# Link the package globally
npm link

# Now you can use:
markpdf your-file.md
markpdf --help
```

## Testing Mermaid Charts

The tool automatically processes Mermaid charts in markdown files:

```bash
# Convert the mermaid test file
node dist/cli.js src/test/mermaid/test-mermaid.md

# This will:
# 1. Render all mermaid charts to images
# 2. Replace code blocks with image references
# 3. Generate PDF with all charts included
```

**Note:** Mermaid processing requires:
- Internet connection (to download Mermaid.js)
- Puppeteer (browser automation)
- May take longer for files with many charts

## Troubleshooting

### Command Not Found
If you get "command not found", use:
```bash
node dist/cli.js --help
```

### Build Errors
Rebuild the project:
```bash
npm run build
```

### Process Hangs/Stalls
If the process hangs, it might be:
1. **Mermaid processing** - This can take time, especially with many charts
2. **Browser launching** - Puppeteer needs to launch Chrome/Chromium
3. **Network issues** - Downloading Mermaid.js from CDN

**Try:**
- Wait a bit longer (first run can be slow)
- Check your internet connection
- Try with a simpler file first (no mermaid):
  ```bash
  node dist/cli.js src/test/basic/test.md
  ```

### Port Already in Use
Specify a different port:
```bash
node dist/cli.js file.md --port 3001
```

## File Structure

- **Input:** Markdown file (`.md`)
- **Output:** PDF file (`.pdf`) in the same directory as input
- **Temp files:** Created in system temp directory, cleaned up automatically

## Examples

### Basic Conversion
```bash
node dist/cli.js src/test/basic/test.md
```

### With Custom Options
```bash
node dist/cli.js file.md \
  --highlight-style monokai \
  --pdf-options '{"format": "Letter", "margin": "20mm"}' \
  --stylesheet custom.css
```

### Watch Mode
```bash
node dist/cli.js file.md -w
```

## Getting Help

```bash
# Show help
node dist/cli.js --help

# Show version
node dist/cli.js --version
```

## Next Steps

- Check [USAGE.md](./USAGE.md) for detailed documentation
- See [../../README.md](../../README.md) for full feature list
- Test with `src/test/mermaid/test-mermaid.md` to see Mermaid charts in action

