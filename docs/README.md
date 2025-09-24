# Documentation

This directory contains the documentation for Streamlit Lightweight Charts Pro, built with MkDocs and the Material theme.

## Structure

- `index.md` - Main landing page
- `getting-started/` - Getting started guides
- `examples/` - Usage examples and tutorials
- `api/` - Auto-generated API documentation
- `advanced/` - Advanced topics and customization
- `stylesheets/` - Custom CSS styles
- `javascripts/` - Custom JavaScript files

## Development

### Prerequisites

Install documentation dependencies:

```bash
pip install -e ".[docs]"
```

### Local Development

Serve documentation locally:

```bash
make docs-serve
```

This will start a local server at http://localhost:8000 with live reloading.

### Building

Build the documentation:

```bash
make docs-build
```

### Deployment

Deploy to GitHub Pages:

```bash
make docs-deploy
```

## Configuration

The documentation is configured in `mkdocs.yml` with:

- Material theme with custom styling
- Automatic API documentation generation
- Search functionality
- Mobile-responsive design
- Dark/light mode support

## Adding Content

### New Pages

1. Create a new `.md` file in the appropriate directory
2. Add the page to `SUMMARY.md` for navigation
3. Use proper Markdown formatting with Material theme extensions

### API Documentation

API documentation is automatically generated from docstrings using mkdocstrings. The generation script is in `gen_ref_pages.py`.

### Styling

Custom styles are in `stylesheets/extra.css`. Use CSS variables for theme consistency:

```css
.md-typeset .custom-class {
    color: var(--md-accent-fg-color);
    background: var(--md-code-bg-color);
}
```

## Writing Guidelines

- Use clear, concise language
- Include code examples
- Add type hints and parameter descriptions
- Follow the existing style and structure
- Test locally before committing changes
