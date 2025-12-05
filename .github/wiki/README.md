# GitHub Wiki Setup Guide

This directory contains the content for the GitHub Wiki.

## About GitHub Wiki

GitHub Wiki is a separate Git repository that lives alongside your main repository. It's ideal for:
- Community-driven documentation
- Quick-edit documentation (no PR required)
- Searchable knowledge base
- FAQs and troubleshooting guides
- Code recipes and examples

## Setting Up the Wiki

### Enable Wiki

1. Go to repository **Settings**
2. Scroll to **Features** section
3. Check **Wikis** checkbox

### Clone Wiki Repository

The wiki is a separate Git repository:

```bash
git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.wiki.git
```

### Sync Local Wiki Content

Copy content from this directory to the wiki repository:

```bash
# From repository root
cp -r .github/wiki/* ../streamlit-lightweight-charts-pro.wiki/

# Commit and push
cd ../streamlit-lightweight-charts-pro.wiki
git add .
git commit -m "Initial wiki setup"
git push origin master
```

## Wiki Structure

```
.github/wiki/
├── Home.md                     # Wiki homepage
├── Installation-Guide.md       # Installation instructions
├── Quick-Start-Tutorial.md     # Getting started tutorial
├── FAQ.md                      # Frequently asked questions
├── Code-Recipes.md             # Copy-paste code examples
├── Troubleshooting.md          # Common issues and solutions
├── API-Cheat-Sheet.md          # Quick API reference
├── Contributing-to-Wiki.md     # How to contribute to wiki
└── README.md                   # This file (not part of wiki)
```

## File Naming Convention

- Use **Title-Case-With-Dashes.md** for wiki pages
- Example: `Performance-Optimization.md`
- No spaces in filenames
- GitHub automatically converts to URLs: `Performance-Optimization` → `/Performance-Optimization`

## Creating New Pages

### Method 1: Through GitHub UI

1. Go to Wiki tab
2. Click **New Page**
3. Enter page title
4. Write content in Markdown
5. Click **Save Page**

### Method 2: Through Git

1. Create `.md` file in wiki repository
2. Write content
3. Commit and push
4. Page appears automatically

### Method 3: Via Links

Create a link to non-existent page in any wiki page:

```markdown
See [Performance Optimization](Performance-Optimization) for details.
```

Click the link → GitHub prompts you to create the page

## Editing Pages

### Through GitHub UI

1. Navigate to page
2. Click **Edit** button (top right)
3. Make changes
4. Click **Save Page**

### Through Git

1. Clone wiki repository
2. Edit `.md` file
3. Commit and push

## Organizing Pages

### Create Sidebar

Create `_Sidebar.md` in wiki repository:

```markdown
## Navigation

**Getting Started**
- [Home](Home)
- [Installation](Installation-Guide)
- [Quick Start](Quick-Start-Tutorial)

**Guides**
- [Chart Types](Chart-Types-Overview)
- [Styling](Styling-and-Theming)
- [Performance](Performance-Optimization)

**Reference**
- [API Cheat Sheet](API-Cheat-Sheet)
- [FAQ](FAQ)
- [Troubleshooting](Troubleshooting)
```

### Create Footer

Create `_Footer.md` in wiki repository:

```markdown
---
📚 [Official Docs](https://nandkapadia.github.io/streamlit-lightweight-charts-pro/) |
🐛 [Issues](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues) |
💬 [Discussions](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/discussions)
```

## Markdown Tips

### Internal Links

```markdown
See [Installation Guide](Installation-Guide) for setup.
```

### External Links

```markdown
Read [Official Docs](https://nandkapadia.github.io/streamlit-lightweight-charts-pro/)
```

### Code Blocks

````markdown
```python
import streamlit as st
from streamlit_lightweight_charts_pro import renderChart
```
````

### Images

```markdown
![Screenshot](https://example.com/image.png)
```

### Tables

```markdown
| Feature | Supported |
|---------|-----------|
| Line charts | ✅ |
| Candlestick | ✅ |
```

### Alerts

GitHub Wiki supports GitHub Flavored Markdown alerts:

```markdown
> **Note**
> This is a note

> **Warning**
> This is a warning
```

## Best Practices

### Content Guidelines

1. **Keep it simple** - Wiki is for quick reference
2. **Use examples** - Show, don't just tell
3. **Link liberally** - Connect related pages
4. **Update regularly** - Keep content current
5. **Be concise** - Short paragraphs, bullet points

### Organization

1. **Homepage as hub** - Link to all major sections
2. **Create categories** - Group related pages
3. **Use sidebar** - Easy navigation
4. **Cross-reference** - Link related topics
5. **Search-friendly** - Use clear headings

### Maintenance

1. **Review regularly** - Check for outdated info
2. **Accept contributions** - Community can edit
3. **Monitor changes** - Use wiki's history
4. **Sync with code** - Update when code changes
5. **Test examples** - Ensure code works

## Wiki vs Official Docs

### Use Wiki for:
- Quick-start guides
- FAQ
- Troubleshooting
- Code recipes
- Community examples
- Tips and tricks

### Use Official Docs for:
- Complete API reference
- Architecture details
- Type definitions
- Contributing guidelines
- Formal documentation

## Automation

### Auto-sync from this directory

Add to `.github/workflows/sync-wiki.yml`:

```yaml
name: Sync Wiki

on:
  push:
    branches:
      - main
    paths:
      - '.github/wiki/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Clone wiki
        run: git clone https://github.com/${{ github.repository }}.wiki.git wiki

      - name: Sync content
        run: |
          cp -r .github/wiki/* wiki/
          cd wiki
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git diff-index --quiet HEAD || git commit -m "Auto-sync from main repo"
          git push
```

## Contributing to Wiki

Anyone with repository access can edit the wiki. See [Contributing-to-Wiki.md](Contributing-to-Wiki.md) for guidelines.

## Resources

- [About GitHub Wikis](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis)
- [Editing Wiki Content](https://docs.github.com/en/communities/documenting-your-project-with-wikis/editing-wiki-content)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

## Questions?

Open an issue or discussion in the main repository.
