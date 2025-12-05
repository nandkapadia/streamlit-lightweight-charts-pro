# Documentation

This directory contains the source files for building the Streamlit Lightweight Charts Pro documentation.

## Structure

```
docs/
├── source/              # Sphinx source files (.rst)
│   ├── conf.py         # Sphinx configuration
│   ├── index.rst       # Documentation homepage
│   ├── installation.rst
│   ├── quickstart.rst
│   ├── migration.rst
│   ├── contributing.rst
│   ├── api/            # Python API reference
│   └── examples/       # Usage examples
├── build/              # Generated HTML output (gitignored)
├── typescript/         # TypeDoc output (gitignored)
├── Makefile           # Sphinx makefile
└── requirements.txt   # Documentation dependencies
```

## Building Documentation

### Prerequisites

Install documentation dependencies:

```bash
# From repository root
pip install -r docs/requirements.txt

# For TypeScript docs
cd streamlit_lightweight_charts_pro/frontend
npm install -D typedoc typedoc-plugin-markdown
```

### Build Commands

**Build all documentation** (Python + TypeScript):

```bash
# From repository root
make docs
```

**Build Python docs only**:

```bash
make docs-python
# Or from docs/ directory:
cd docs && make html
```

**Build TypeScript docs only**:

```bash
make docs-typescript
# Or:
cd streamlit_lightweight_charts_pro/frontend && npm run docs
```

**Serve documentation locally**:

```bash
make docs-serve
# Visit http://localhost:8000
```

**Clean build files**:

```bash
make docs-clean
```

## Documentation Standards

### Python Documentation

- **Style**: Google-style docstrings
- **Line width**: ≤99 characters
- **Tool**: Sphinx with napoleon extension
- **Auto-generation**: API docs auto-generated from source code docstrings

Example:

```python
def example_function(param: str, value: int) -> bool:
    """Short one-line summary.

    Longer description explaining the function's purpose and behavior.

    Args:
        param: Description of param.
        value: Description of value.

    Returns:
        Description of return value.

    Raises:
        ValueError: When value is negative.

    Example:
        ```python
        result = example_function("test", 42)
        ```
    """
    if value < 0:
        raise ValueError("Value must be non-negative")
    return True
```

### TypeScript Documentation

- **Style**: Google-style JSDoc/TSDoc
- **Line width**: ≤100 characters
- **Tool**: TypeDoc
- **Auto-generation**: API docs auto-generated from JSDoc comments

Example:

```typescript
/**
 * Example function with comprehensive documentation.
 *
 * @param param - Description of param
 * @param value - Description of value
 * @returns Description of return value
 * @throws {Error} When value is negative
 *
 * @example
 * ```typescript
 * const result = exampleFunction("test", 42);
 * ```
 */
export function exampleFunction(param: string, value: number): boolean {
    if (value < 0) {
        throw new Error("Value must be non-negative");
    }
    return true;
}
```

## Validation

### Check Python Docstrings

```bash
pydocstyle streamlit_lightweight_charts_pro \
  --convention=google \
  --add-ignore=D100,D104,D105,D107 \
  --exclude=frontend,tests,examples,setup.py
```

### Check TypeScript JSDoc

```bash
cd streamlit_lightweight_charts_pro/frontend
npx eslint \
  --no-eslintrc \
  --plugin jsdoc \
  --rule "jsdoc/check-syntax: error" \
  --rule "jsdoc/check-param-names: error" \
  --rule "jsdoc/require-param-type: error" \
  --rule "jsdoc/require-returns-type: error" \
  "src/**/*.{ts,tsx}"
```

## CI/CD Integration

Documentation is automatically built and deployed to GitHub Pages via GitHub Actions:

- **Workflow**: `.github/workflows/docs.yml`
- **Triggers**: Push to `main` or `dev` branches
- **Deployment**: GitHub Pages
- **URL**: Will be available at `https://<username>.github.io/<repo>/`

### Manual Deployment

To manually deploy documentation to GitHub Pages:

1. Build documentation:
   ```bash
   make docs
   ```

2. Push to `gh-pages` branch:
   ```bash
   # First time setup
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r docs/build/html/* .
   git add .
   git commit -m "Deploy documentation"
   git push origin gh-pages

   # Subsequent updates
   git checkout gh-pages
   git rm -rf *
   cp -r docs/build/html/* .
   git add .
   git commit -m "Update documentation"
   git push origin gh-pages
   ```

## Writing Documentation

### Adding New Pages

1. Create a new `.rst` file in `docs/source/`
2. Add it to the appropriate `toctree` directive
3. Follow existing structure and style

### Adding Examples

1. Create example `.rst` file in `docs/source/examples/`
2. Include code blocks with full working examples
3. Add explanatory text before/after code
4. Add to `docs/source/examples/index.rst`

### Updating API Documentation

API documentation is auto-generated from source code docstrings. To update:

1. Update docstrings in source code
2. Rebuild documentation: `make docs-python`
3. Verify output in `docs/build/html/api/`

## Troubleshooting

### Sphinx Build Fails

- Check for syntax errors in `.rst` files
- Ensure all cross-references are valid
- Run with verbose output: `sphinx-build -v source build`

### TypeDoc Build Fails

- Check JSDoc syntax in TypeScript files
- Ensure TypeScript compiles: `npm run type-check`
- Check `typedoc.json` configuration

### Missing Dependencies

Install all documentation dependencies:

```bash
pip install -r docs/requirements.txt
cd streamlit_lightweight_charts_pro/frontend
npm install -D typedoc typedoc-plugin-markdown
```

## Resources

- [Sphinx Documentation](https://www.sphinx-doc.org/)
- [reStructuredText Primer](https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html)
- [TypeDoc Documentation](https://typedoc.org/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
