# Quick Manual Steps (2 minutes)

## Step 1: Initialize GitHub Wiki (1 minute)

1. Go to: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki
2. Click **"Create the first page"**
3. Title: `Home`
4. Content: Paste this:

```markdown
# Streamlit Lightweight Charts Pro Wiki

Welcome! This wiki provides community-driven documentation, FAQs, and code recipes.

See the full Home page after syncing...
```

5. Click **"Save Page"**
6. Run in terminal:

```bash
cd /Users/nandkapadia/streamlit-lightweight-charts-pro
./sync-wiki.sh
```

## Step 2: Enable GitHub Pages (1 minute)

1. Go to: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/settings/pages
2. Under **"Build and deployment"**:
   - Source: Select **"GitHub Actions"**
3. Click **"Save"**

## That's It!

Your documentation will auto-deploy at:
- **Docs**: https://nandkapadia.github.io/streamlit-lightweight-charts-pro/
- **Wiki**: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/wiki

To test locally:
```bash
make docs
make docs-serve
# Visit http://localhost:8000
```
