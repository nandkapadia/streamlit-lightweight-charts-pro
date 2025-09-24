#!/bin/bash

# Simple pre-commit hook for streamlit-lightweight-charts-pro
# Uses the simplified .pre-commit-config.yaml configuration

set -e

echo "🚀 Running pre-commit checks..."
echo "==============================="

# Run the standard pre-commit configuration
if command -v pre-commit > /dev/null; then
    pre-commit run --all-files
    echo "✅ Pre-commit checks completed!"
else
    echo "❌ pre-commit not found. Please install with: pip install pre-commit"
    exit 1
fi
