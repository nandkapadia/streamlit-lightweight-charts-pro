#!/bin/bash
# Script to sync wiki content from .github/wiki to GitHub Wiki repository
# Run this after creating the first wiki page in GitHub web UI

set -e

echo "🔄 Syncing GitHub Wiki content..."

# Check if wiki repo exists
if [ ! -d "../streamlit-lightweight-charts-pro.wiki" ]; then
    echo "📥 Cloning wiki repository..."
    cd ..
    git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.wiki.git
    cd streamlit-lightweight-charts-pro
fi

# Copy wiki content
echo "📋 Copying wiki content..."
cp -v .github/wiki/*.md ../streamlit-lightweight-charts-pro.wiki/

# Commit and push
echo "💾 Committing changes..."
cd ../streamlit-lightweight-charts-pro.wiki
git add .
git config user.name "$(git config --get user.name || echo 'Nand Kapadia')"
git config user.email "$(git config --get user.email || echo 'nand.kapadia@gmail.com')"

if git diff-index --quiet HEAD --; then
    echo "✅ No changes to commit"
else
    git commit -m "Sync wiki content from main repository

- Installation Guide
- FAQ
- Code Recipes
- Home page with navigation

🤖 Generated with Claude Code"

    echo "⬆️  Pushing to GitHub..."
    git push origin master
    echo "✅ Wiki content synced successfully!"
fi

cd ../streamlit-lightweight-charts-pro
echo "🎉 Done!"
