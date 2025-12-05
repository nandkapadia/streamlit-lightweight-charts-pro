# Documentation & Automation Setup Guide

This document provides a comprehensive guide for setting up professional documentation and automation for the **streamlit-lightweight-charts-pro** package (Python + Streamlit + React).

## Table of Contents
- [Documentation Standards](#documentation-standards)
- [Pre-commit Hooks Setup](#pre-commit-hooks-setup)
- [Documentation Infrastructure](#documentation-infrastructure)
- [CI/CD Automation](#cicd-automation)
- [Deployment](#deployment)

---

## Documentation Standards

### Industry Standards for Python + JavaScript Packages

#### Python Documentation

**Standard**: **Sphinx** with **ReadTheDocs** or **GitHub Pages**

**Why**:
- Industry standard for Python packages (NumPy, Pandas, Django use it)
- Supports Google-style docstrings (via napoleon extension)
- Automatic API documentation from docstrings
- Versioned documentation
- Search functionality
- Theme support (Read the Docs theme, Furo, etc.)

**Alternatives**:
- **MkDocs**: Simpler, Markdown-based (good for Streamlit projects)
- **pdoc**: Lightweight, auto-generates from docstrings

#### TypeScript/JavaScript Documentation

**Standard**: **TypeDoc** for TypeScript

**Why**:
- Official TypeScript documentation generator
- Supports TSDoc/JSDoc comments
- Generates HTML documentation
- Type information preserved
- Search and navigation

**Alternatives**:
- **JSDoc**: For pure JavaScript
- **Docusaurus**: Facebook's doc generator (good for React projects)
- **VuePress**: Vue-based static site generator

#### Recommendation for This Project

**Hybrid Approach**:
```
1. MkDocs Material (main documentation site)
   ├─ User guide (tutorials, examples)
   ├─ API reference (auto-generated from Sphinx)
   └─ TypeScript API (auto-generated from TypeDoc)

2. Sphinx (Python API documentation)
   └─ Auto-generated from docstrings

3. TypeDoc (TypeScript API documentation)
   └─ Auto-generated from TSDoc comments
```

---

## Pre-commit Hooks Setup

### Installation

```bash
# Install pre-commit
pip install pre-commit

# Install hooks (reads .pre-commit-config.yaml)
pre-commit install

# Optional: Install commit-msg hook for conventional commits
pre-commit install --hook-type commit-msg
```

### What the Hooks Do

#### Python Checks
✅ **isort**: Sort imports (Standard → Third Party → Local)
✅ **autoflake**: Remove unused imports/variables
✅ **black**: Format code (line length 99)
✅ **ruff**: Lint and fix issues
✅ **pydocstyle**: Validate Google-style docstrings

#### TypeScript Checks
✅ **prettier**: Format code (line length 100)
✅ **eslint**: Lint and fix issues
✅ **tsc**: Type checking
✅ **JSDoc validator**: Validate JSDoc syntax

#### Custom Checks
✅ **Frontend build exists**: Ensure build/ directory present
✅ **General**: Large files, merge conflicts, trailing whitespace

### Usage

```bash
# Automatic: Runs on every git commit
git commit -m "feat: add new feature"

# Manual: Run on all files
pre-commit run --all-files

# Manual: Run specific hook
pre-commit run eslint-fix --all-files

# Update hooks to latest versions
pre-commit autoupdate

# Skip hooks (use sparingly!)
git commit -m "fix: quick fix" --no-verify
```

### JSDoc Validation Details

The custom hook validates:
- ✅ **Syntax**: Proper JSDoc format
- ✅ **Param names**: Match function signature
- ✅ **Param types**: Types are specified
- ✅ **Return types**: Return type documented
- ✅ **Type validity**: Types are valid TypeScript types

**Example Error**:
```typescript
/**
 * Create series
 * @param chart - Chart instance
 * @param config - Wrong param name!  ❌
 */
function createSeries(chart: IChartApi, seriesConfig: SeriesConfig) {}
```

**Fix**:
```typescript
/**
 * Create series
 * @param chart - Chart instance
 * @param seriesConfig - Series configuration  ✅
 * @returns Created series instance
 */
function createSeries(chart: IChartApi, seriesConfig: SeriesConfig): ISeriesApi {}
```

---

## Documentation Infrastructure

### Option 1: Sphinx + ReadTheDocs (Recommended for Python-Heavy Projects)

#### Setup

**1. Install dependencies**:
```bash
pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints myst-parser
```

**2. Create docs structure**:
```bash
mkdir -p docs/source
cd docs
sphinx-quickstart
```

**3. Configure** (`docs/source/conf.py`):
```python
# Configuration file for the Sphinx documentation builder.

import os
import sys
sys.path.insert(0, os.path.abspath('../..'))

project = 'Streamlit Lightweight Charts Pro'
copyright = '2024, Nand Kapadia'
author = 'Nand Kapadia'
release = '0.3.0'

# Extensions
extensions = [
    'sphinx.ext.autodoc',        # Auto-generate from docstrings
    'sphinx.ext.napoleon',       # Google-style docstrings
    'sphinx.ext.viewcode',       # Link to source code
    'sphinx.ext.intersphinx',    # Link to other projects
    'sphinx_autodoc_typehints',  # Type hints support
    'myst_parser',               # Markdown support
]

# Napoleon settings (Google-style)
napoleon_google_docstring = True
napoleon_numpy_docstring = False
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = False
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_type_aliases = None

# Theme
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# Intersphinx (link to other docs)
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
    'numpy': ('https://numpy.org/doc/stable/', None),
    'pandas': ('https://pandas.pydata.org/docs/', None),
    'streamlit': ('https://docs.streamlit.io/', None),
}
```

**4. Create index** (`docs/source/index.rst`):
```rst
Streamlit Lightweight Charts Pro Documentation
==============================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   quickstart
   tutorials/index
   api/index
   examples/index

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
```

**5. Auto-generate API docs**:
```bash
sphinx-apidoc -o docs/source/api streamlit_lightweight_charts_pro
```

**6. Build**:
```bash
cd docs
make html  # Output: docs/build/html/
```

#### ReadTheDocs Integration

**1. Create** `.readthedocs.yaml`:
```yaml
version: 2

build:
  os: ubuntu-22.04
  tools:
    python: "3.11"

sphinx:
  configuration: docs/source/conf.py

python:
  install:
    - method: pip
      path: .
      extra_requirements:
        - docs
```

**2. Add to** `pyproject.toml`:
```toml
[project.optional-dependencies]
docs = [
    "sphinx>=7.0",
    "sphinx-rtd-theme>=2.0",
    "sphinx-autodoc-typehints>=1.25",
    "myst-parser>=2.0",
]
```

**3. Sign up**: https://readthedocs.org/
**4. Import**: Connect GitHub repo
**5. Build**: Automatic on every push

---

### Option 2: MkDocs Material (Recommended for Streamlit Projects)

#### Setup

**1. Install**:
```bash
pip install mkdocs mkdocs-material mkdocstrings[python] mkdocs-jupyter
```

**2. Initialize**:
```bash
mkdocs new .
```

**3. Configure** (`mkdocs.yml`):
```yaml
site_name: Streamlit Lightweight Charts Pro
site_url: https://nandkapadia.github.io/streamlit-lightweight-charts-pro
repo_url: https://github.com/nandkapadia/streamlit-lightweight-charts-pro
repo_name: streamlit-lightweight-charts-pro

theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - search.highlight
    - content.code.copy

plugins:
  - search
  - mkdocstrings:
      handlers:
        python:
          options:
            docstring_style: google
            show_source: true
            show_root_heading: true
  - mkdocs-jupyter:
      include_source: true

markdown_extensions:
  - pymdownx.highlight
  - pymdownx.superfences
  - pymdownx.tabbed
  - pymdownx.details
  - admonition
  - toc:
      permalink: true

nav:
  - Home: index.md
  - Getting Started:
    - Installation: getting-started/installation.md
    - Quickstart: getting-started/quickstart.md
  - Tutorials:
    - Basic Charts: tutorials/basic-charts.md
    - Custom Series: tutorials/custom-series.md
    - Trading Features: tutorials/trading-features.md
  - API Reference:
    - Python API: api/python.md
    - TypeScript API: api/typescript.md
  - Examples:
    - Gallery: examples/gallery.md
  - Contributing: contributing.md
```

**4. Auto-generate Python API** (`docs/api/python.md`):
```markdown
# Python API Reference

## Chart

::: streamlit_lightweight_charts_pro.Chart
    options:
      show_root_heading: true
      show_source: true

## ChartManager

::: streamlit_lightweight_charts_pro.ChartManager
```

**5. Build**:
```bash
mkdocs build  # Output: site/
mkdocs serve  # Dev server: http://127.0.0.1:8000
```

---

### TypeScript Documentation (TypeDoc)

#### Setup

**1. Install**:
```bash
cd streamlit_lightweight_charts_pro/frontend
npm install --save-dev typedoc typedoc-plugin-markdown
```

**2. Configure** (`typedoc.json`):
```json
{
  "entryPoints": ["src/index.tsx"],
  "entryPointStrategy": "expand",
  "out": "../../docs/typescript-api",
  "theme": "default",
  "name": "Streamlit Lightweight Charts Pro - TypeScript API",
  "includeVersion": true,
  "exclude": [
    "**/__tests__/**",
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.test.tsx"
  ],
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": false,
  "readme": "../../README.md",
  "categorizeByGroup": true,
  "categoryOrder": [
    "Components",
    "Hooks",
    "Services",
    "Utilities",
    "*"
  ],
  "sort": ["source-order"],
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": false
  }
}
```

**3. Add script** (`package.json`):
```json
{
  "scripts": {
    "docs": "typedoc",
    "docs:watch": "typedoc --watch"
  }
}
```

**4. Build**:
```bash
npm run docs  # Output: docs/typescript-api/
```

---

## CI/CD Automation

### GitHub Actions Workflow

Create `.github/workflows/docs.yml`:

```yaml
name: Documentation

on:
  push:
    branches: [main, dev]
    paths:
      - 'streamlit_lightweight_charts_pro/**/*.py'
      - 'streamlit_lightweight_charts_pro/frontend/src/**/*.{ts,tsx}'
      - 'docs/**'
      - 'mkdocs.yml'
      - '.github/workflows/docs.yml'
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  # ========================================================================
  # Build Documentation
  # ========================================================================
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: streamlit_lightweight_charts_pro/frontend/package-lock.json

      - name: Install Python dependencies
        run: |
          pip install -e ".[docs]"

      - name: Install frontend dependencies
        run: |
          cd streamlit_lightweight_charts_pro/frontend
          npm ci

      - name: Build TypeScript docs
        run: |
          cd streamlit_lightweight_charts_pro/frontend
          npm run docs

      - name: Build Python docs (MkDocs)
        run: |
          mkdocs build --strict

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./site

  # ========================================================================
  # Deploy to GitHub Pages
  # ========================================================================
  deploy-docs:
    needs: build-docs
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  # ========================================================================
  # Validate Documentation
  # ========================================================================
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Check docstring coverage
        run: |
          pip install interrogate
          interrogate streamlit_lightweight_charts_pro/ -vv --fail-under=80

      - name: Check TypeScript docs
        run: |
          cd streamlit_lightweight_charts_pro/frontend
          npm ci
          npm run docs 2>&1 | tee docs-output.log
          # Check for warnings
          if grep -i "warning" docs-output.log; then
            echo "⚠️  TypeDoc warnings found"
            exit 1
          fi
```

### Add to pyproject.toml

```toml
[project.optional-dependencies]
docs = [
    "mkdocs>=1.5",
    "mkdocs-material>=9.5",
    "mkdocstrings[python]>=0.24",
    "mkdocs-jupyter>=0.24",
    "interrogate>=1.5",  # Docstring coverage
]
```

---

## Deployment

### GitHub Pages Setup

**1. Enable GitHub Pages**:
- Go to: `Settings` → `Pages`
- Source: `GitHub Actions`

**2. Push to main**:
```bash
git add .
git commit -m "docs: add documentation infrastructure"
git push origin main
```

**3. View docs**:
```
https://nandkapadia.github.io/streamlit-lightweight-charts-pro/
```

### ReadTheDocs Setup (Alternative)

**1. Sign up**: https://readthedocs.org
**2. Import project**: Connect GitHub
**3. Configure**:
   - Branch: `main`
   - Config file: `.readthedocs.yaml`

**4. View docs**:
```
https://streamlit-lightweight-charts-pro.readthedocs.io/
```

---

## Documentation Structure (Recommended)

```
docs/
├── index.md                          # Homepage
├── getting-started/
│   ├── installation.md
│   ├── quickstart.md
│   └── configuration.md
├── tutorials/
│   ├── basic-charts.md
│   ├── custom-series.md
│   ├── multi-pane.md
│   ├── trading-features.md
│   └── advanced-features.md
├── api/
│   ├── python.md                     # Python API (auto-generated)
│   └── typescript.md                 # Link to TypeDoc output
├── examples/
│   ├── gallery.md
│   ├── notebooks/                    # Jupyter notebooks
│   │   ├── quickstart.ipynb
│   │   └── advanced.ipynb
│   └── code-samples/
├── contributing.md
├── changelog.md
└── faq.md

typescript-api/                       # TypeDoc output (auto-generated)
└── ...
```

---

## Makefile Commands

Add to your `Makefile`:

```makefile
# Documentation commands
.PHONY: docs docs-serve docs-python docs-typescript docs-validate

docs: docs-typescript docs-python  ## Build all documentation

docs-python:  ## Build Python documentation (MkDocs)
	mkdocs build --strict

docs-typescript:  ## Build TypeScript documentation (TypeDoc)
	cd streamlit_lightweight_charts_pro/frontend && npm run docs

docs-serve:  ## Serve documentation locally
	mkdocs serve

docs-validate:  ## Validate documentation coverage
	interrogate streamlit_lightweight_charts_pro/ -vv --fail-under=80
	cd streamlit_lightweight_charts_pro/frontend && npm run docs

docs-clean:  ## Clean generated documentation
	rm -rf site/ docs/typescript-api/
```

---

## Quick Start Commands

```bash
# 1. Install pre-commit
pip install pre-commit
pre-commit install

# 2. Install documentation dependencies
pip install -e ".[docs]"
cd streamlit_lightweight_charts_pro/frontend && npm install

# 3. Build documentation locally
make docs

# 4. Serve documentation
make docs-serve  # Visit http://127.0.0.1:8000

# 5. Validate documentation
make docs-validate

# 6. Test pre-commit hooks
pre-commit run --all-files
```

---

## Summary

**What's Automated**:
✅ Pre-commit hooks validate code on every commit
✅ JSDoc syntax validated automatically
✅ Documentation built on every push to main
✅ GitHub Pages deployed automatically
✅ Docstring coverage checked in CI

**What You Get**:
📚 Professional HTML documentation
🔍 Searchable API reference
📖 Tutorials and examples
🚀 Auto-deployed to GitHub Pages
✨ Dual-language (Python + TypeScript) support

**Next Steps**:
1. Review and customize `mkdocs.yml`
2. Write tutorials in `docs/tutorials/`
3. Add examples with Jupyter notebooks
4. Test the workflow with a commit
5. Share documentation URL with users

---

For questions or issues, see the [Contributing Guide](contributing.md).
