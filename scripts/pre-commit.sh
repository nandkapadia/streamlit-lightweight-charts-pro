#!/bin/bash

# Smart pre-commit hook for streamlit-lightweight-charts-pro
# Automatically stages formatted changes to avoid conflicts

set -e

echo "🚀 Running pre-commit checks..."
echo "==============================="

# Run the standard pre-commit configuration
if command -v pre-commit > /dev/null; then
    # Run pre-commit hooks
    pre-commit run --all-files

    # Check if any files were modified by the hooks
    if ! git diff --quiet; then
        echo "📝 Auto-staging formatted changes..."
        git add -A
        echo "✅ Formatted changes staged automatically"
    fi

    echo "✅ Pre-commit checks completed!"
else
    echo "❌ pre-commit not found. Please install with: pip install pre-commit"
    exit 1
fi
