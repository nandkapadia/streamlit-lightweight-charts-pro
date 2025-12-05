# Documentation Overview

This document provides a comprehensive overview of the documentation infrastructure for Streamlit Lightweight Charts Pro.

## Documentation Types

This project uses a **multi-layered documentation approach** optimized for a dual-language codebase (Python + TypeScript/React):

1. **Python API Documentation** - Sphinx with Google-style docstrings
2. **TypeScript API Documentation** - TypeDoc with JSDoc/TSDoc
3. **User Guides & Tutorials** - reStructuredText (.rst) files
4. **Examples** - Complete code examples with explanations
5. **GitHub Wiki** - Community-driven guides, FAQs, and recipes

### When to Use Each

**Official Documentation (Sphinx/TypeDoc)** - For:
- Complete API reference
- Installation instructions
- Architecture details
- Type definitions
- Contributing guidelines

**GitHub Wiki** - For:
- Quick-start tutorials
- FAQ and troubleshooting
- Code recipes (copy-paste examples)
- Community examples
- Tips and tricks

**README** - For:
- Project overview
- Quick installation
- Basic usage
- Links to other docs

## Quick Start

### Build All Documentation

```bash
make docs
```

This builds both Python and TypeScript documentation.

### View Documentation

```bash
make docs-serve
```

Visit http://localhost:8000 to view the documentation.

### Clean Documentation

```bash
make docs-clean
```

## Directory Structure

```
streamlit-lightweight-charts-pro/
├── docs/                           # Main documentation directory
│   ├── source/                    # Sphinx source files
│   │   ├── conf.py               # Sphinx configuration
│   │   ├── index.rst             # Homepage
│   │   ├── installation.rst      # Installation guide
│   │   ├── quickstart.rst        # Quick start guide
│   │   ├── migration.rst         # Migration guides
│   │   ├── contributing.rst      # Contributing guide
│   │   ├── api/                  # API reference (auto-generated)
│   │   │   ├── index.rst
│   │   │   ├── chart.rst
│   │   │   ├── types.rst
│   │   │   ├── utils.rst
│   │   │   └── exceptions.rst
│   │   └── examples/             # Usage examples
│   │       ├── index.rst
│   │       ├── basic_charts.rst
│   │       ├── advanced_features.rst
│   │       └── trading_examples.rst
│   ├── build/                    # Generated HTML (gitignored)
│   │   └── html/
│   ├── typescript/               # TypeDoc output (gitignored)
│   ├── Makefile                  # Sphinx makefile
│   ├── requirements.txt          # Documentation dependencies
│   └── README.md                 # Documentation README
├── .pre-commit-config.yaml       # Pre-commit hooks
├── .github/
│   ├── workflows/docs.yml        # CI/CD for docs
│   └── wiki/                     # GitHub Wiki content
│       ├── Home.md
│       ├── Installation-Guide.md
│       ├── FAQ.md
│       ├── Code-Recipes.md
│       └── README.md
├── DOCUMENTATION_SETUP.md        # Setup guide
└── DOCUMENTATION.md              # This file
```

## Available Commands

### Makefile Commands

From repository root:

```bash
make docs              # Build all documentation
make docs-python       # Build Python docs only
make docs-typescript   # Build TypeScript docs only
make docs-serve        # Serve docs at http://localhost:8000
make docs-clean        # Clean build artifacts

make pre-commit        # Run pre-commit hooks
make pre-commit-install # Install pre-commit hooks
```

### Manual Commands

**Python (Sphinx)**:

```bash
cd docs
sphinx-build -b html source build/html
```

**TypeScript (TypeDoc)**:

```bash
cd streamlit_lightweight_charts_pro/frontend
npm run docs
```

## Documentation Standards

### Python Documentation

**Style**: Google-style docstrings

**Required for**:
- All public modules
- All public classes
- All public functions/methods
- All public exceptions

**Format**:

```python
def function_name(param1: str, param2: int) -> bool:
    """Short one-line summary (≤99 chars).

    Longer description explaining purpose, behavior, and important details.
    Can span multiple paragraphs.

    Args:
        param1: Description of param1.
        param2: Description of param2.

    Returns:
        Description of return value.

    Raises:
        ValueError: When param2 is negative.
        TypeError: When param1 is not a string.

    Example:
        ```python
        result = function_name("test", 42)
        assert result is True
        ```

    Note:
        Additional notes or warnings.
    """
    pass
```

**Validation**:

```bash
pydocstyle streamlit_lightweight_charts_pro --convention=google
```

### TypeScript Documentation

**Style**: Google-style JSDoc/TSDoc

**Required for**:
- All exported functions
- All exported classes
- All exported types/interfaces
- All public methods

**Format**:

```typescript
/**
 * Short one-line summary (≤100 chars).
 *
 * Longer description explaining purpose, behavior, and important details.
 * Can span multiple paragraphs.
 *
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * @throws {Error} When param2 is negative
 * @throws {TypeError} When param1 is not a string
 *
 * @example
 * ```typescript
 * const result = functionName("test", 42);
 * assert(result === true);
 * ```
 *
 * @remarks
 * Additional notes or warnings.
 */
export function functionName(param1: string, param2: number): boolean {
    // Implementation
}
```

**Validation**:

```bash
cd streamlit_lightweight_charts_pro/frontend
npx eslint \
  --no-eslintrc \
  --plugin jsdoc \
  --rule "jsdoc/check-syntax: error" \
  "src/**/*.{ts,tsx}"
```

## Pre-commit Hooks

Pre-commit hooks automatically validate code quality on every commit.

### Installation

```bash
pip install pre-commit
pre-commit install
```

### Python Hooks

1. **isort** - Sort imports
2. **autoflake** - Remove unused imports/variables
3. **black** - Format code
4. **ruff** - Lint code
5. **pydocstyle** - Validate docstrings

### TypeScript Hooks

1. **prettier** - Format code
2. **eslint** - Lint code
3. **tsc** - Type check
4. **JSDoc validator** - Validate JSDoc syntax

### Running Manually

```bash
# Run all hooks
pre-commit run --all-files

# Run specific hook
pre-commit run black --all-files
```

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/docs.yml`

**Triggers**:
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev`
- Manual workflow dispatch

**Jobs**:

1. **build-docs**:
   - Builds Python docs with Sphinx
   - Builds TypeScript docs with TypeDoc
   - Combines both into single artifact
   - Uploads artifact

2. **deploy-docs** (only on push to main/dev):
   - Deploys to GitHub Pages
   - URL: `https://<username>.github.io/<repo>/`

3. **validate-docs**:
   - Validates Python docstrings
   - Validates TypeScript JSDoc

### Manual Deployment

To deploy documentation manually:

```bash
# Build documentation
make docs

# Deploy to GitHub Pages (requires gh-pages branch setup)
# See docs/README.md for detailed instructions
```

## Writing Documentation

### Adding New API Documentation

API documentation is **auto-generated** from source code docstrings.

**For Python**:

1. Add/update Google-style docstring in source code
2. Rebuild: `make docs-python`
3. Verify in `docs/build/html/api/`

**For TypeScript**:

1. Add/update JSDoc comment in source code
2. Rebuild: `make docs-typescript`
3. Verify in `docs/typescript/`

### Adding New User Guide

1. Create `.rst` file in `docs/source/`
2. Add to appropriate `toctree` in `index.rst`
3. Write content using reStructuredText
4. Build: `make docs-python`
5. Verify output

### Adding New Example

1. Create `.rst` file in `docs/source/examples/`
2. Add to `toctree` in `examples/index.rst`
3. Include complete working code examples
4. Add explanatory text
5. Build and verify

## Best Practices

### Documentation Guidelines

1. **Write for novices**: Assume reader has basic Python/TypeScript knowledge but is new to this package
2. **Be explicit**: Don't assume context; explain thoroughly
3. **Include examples**: Every function should have usage examples
4. **Show edge cases**: Document error conditions and edge cases
5. **Keep updated**: Update docs when code changes
6. **Test examples**: Ensure code examples actually work

### Code Quality

1. **Line lengths**:
   - Python: ≤99 characters
   - TypeScript: ≤100 characters

2. **Docstring completeness**:
   - All public APIs must be documented
   - All parameters must be described
   - Return values must be described
   - Exceptions must be listed

3. **Type hints**:
   - Python: All public APIs must have type hints
   - TypeScript: Use strict typing

### Pre-commit Usage

1. **Install hooks**: Run `make pre-commit-install` once
2. **Automatic validation**: Hooks run on every commit
3. **Manual runs**: Use `make pre-commit` to check all files
4. **Fix issues**: Pre-commit will auto-fix most issues; re-stage files after fixes

## Troubleshooting

### Common Issues

**Issue**: Sphinx build fails with "undefined label" error

**Solution**: Check cross-references in `.rst` files; ensure referenced labels exist

---

**Issue**: TypeDoc fails with TypeScript errors

**Solution**: Run `npm run type-check` to find and fix TypeScript errors first

---

**Issue**: Pre-commit hook fails

**Solution**: Read error message, fix issue, re-stage files, commit again

---

**Issue**: Documentation not updating

**Solution**: Clean build: `make docs-clean && make docs`

---

**Issue**: Import errors in Sphinx

**Solution**: Ensure package is installed: `pip install -e .`

### Getting Help

1. Check existing documentation in `docs/`
2. Review `DOCUMENTATION_SETUP.md` for setup details
3. Check `.pre-commit-config.yaml` for hook configuration
4. Review GitHub Actions workflow in `.github/workflows/docs.yml`
5. Open an issue on GitHub

## Resources

### Documentation Tools

- [Sphinx](https://www.sphinx-doc.org/) - Python documentation generator
- [TypeDoc](https://typedoc.org/) - TypeScript documentation generator
- [pre-commit](https://pre-commit.com/) - Git hook framework
- [GitHub Pages](https://pages.github.com/) - Documentation hosting

### Style Guides

- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [reStructuredText Primer](https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html)
- [JSDoc Documentation](https://jsdoc.app/)

### Project Documentation

- `DOCUMENTATION_SETUP.md` - Detailed setup guide
- `docs/README.md` - Documentation directory guide
- `.pre-commit-config.yaml` - Pre-commit configuration
- `.github/workflows/docs.yml` - CI/CD workflow

## GitHub Wiki

### About

GitHub Wiki is a separate Git repository for community-driven documentation. It's ideal for:
- Quick-edit guides (no PR required)
- FAQ and troubleshooting
- Copy-paste code recipes
- Community examples

### Setup

1. **Enable wiki** in repository settings
2. **Clone wiki repository**:
   ```bash
   git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.wiki.git
   ```
3. **Sync content**:
   ```bash
   cp -r .github/wiki/* ../streamlit-lightweight-charts-pro.wiki/
   cd ../streamlit-lightweight-charts-pro.wiki
   git add .
   git commit -m "Initial wiki setup"
   git push origin master
   ```

### Wiki Pages Included

- **Home.md** - Wiki homepage with navigation
- **Installation-Guide.md** - Detailed installation instructions
- **FAQ.md** - Frequently asked questions
- **Code-Recipes.md** - 50+ copy-paste code examples
- Plus placeholders for additional guides

### Editing

Anyone with repository access can edit wiki pages directly through GitHub UI or by cloning the wiki repository.

See `.github/wiki/README.md` for complete wiki setup guide.

## Next Steps

1. **Install dependencies**:
   ```bash
   pip install -r docs/requirements.txt
   cd streamlit_lightweight_charts_pro/frontend
   npm install -D typedoc typedoc-plugin-markdown
   ```

2. **Install pre-commit hooks**:
   ```bash
   make pre-commit-install
   ```

3. **Build documentation**:
   ```bash
   make docs
   ```

4. **View documentation**:
   ```bash
   make docs-serve
   ```

5. **Start contributing**: See `docs/source/contributing.rst` for guidelines
