# Streamlit Lightweight Charts Pro - Documentation

This directory contains the complete static HTML documentation for the Streamlit Lightweight Charts Pro library.

## 📁 Structure

- **`index.html`** - Main documentation homepage
- **`api/`** - Complete API reference (50+ pages)
- **`getting-started/`** - Installation and usage guides
- **`examples/`** - Example documentation
- **`assets/`** - CSS, JavaScript, and images
- **`search/`** - Search functionality
- **`sitemap.xml`** - SEO sitemap

## 🚀 Deployment

### GitHub Pages (Recommended)
1. **Push this `docs/` directory** to your repository
2. **Go to repository Settings** → Pages
3. **Set source** to "Deploy from a branch" → "main" → "/docs"
4. **Your docs will be live** at: `https://nandkapadia.github.io/streamlit-lightweight-charts-pro/`

### Any Web Server
1. **Upload all contents** to your web server
2. **Ensure `index.html`** is served as the default page
3. **Documentation will be available** at your domain

## 🔧 Development

### Building Documentation
```bash
# Build to docs/ directory
make -f Makefile.docs docs-build

# Serve locally for development
make -f Makefile.docs docs-serve

# Clean build files
make -f Makefile.docs docs-clean
```

### Configuration
- **Source files**: `docs-src/` (markdown files)
- **Output directory**: `docs/` (HTML files)
- **Links**: Explicit `.html` files (no directory URLs)
- **Theme**: Material Design with search functionality

## ✨ Features

- **Professional API Reference** - All 50+ Python modules documented
- **Interactive Search** - Full-text search across all documentation
- **Responsive Design** - Works on all devices
- **Mobile-Friendly** - Optimized for mobile viewing
- **Google-Style Docstrings** - Professional documentation format

## 📊 Statistics

- **Total Size**: ~16MB
- **Total Pages**: 100+ HTML pages
- **API Reference**: 50+ individual module pages
- **Coverage**: 100% of core modules documented

---

**Generated with**: MkDocs + Material Theme + mkdocstrings
**Last Updated**: $(date)
