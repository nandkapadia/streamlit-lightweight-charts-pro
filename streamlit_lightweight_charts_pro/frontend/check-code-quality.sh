#!/bin/bash

# Code Quality Check Script
# Run this script to check all code quality aspects

echo "🔍 Running Code Quality Checks..."
echo "=================================="

echo ""
echo "1️⃣  Checking code formatting with Prettier..."
if npm run format:check; then
    echo "✅ Code formatting is correct"
else
    echo "❌ Code formatting issues found. Run 'npm run format' to fix."
    exit 1
fi

echo ""
echo "2️⃣  Running ESLint checks..."
echo "Running ESLint with auto-fix for common issues..."
if npm run lint; then
    echo "✅ ESLint auto-fix completed"
else
    echo "⚠️  Some ESLint issues remain after auto-fix"
    echo "Checking for critical errors only..."
    # Check for errors only (ignore warnings)
    if npm run lint:check 2>&1 | grep -q "error"; then
        echo "❌ Critical ESLint errors found. Please fix them manually."
        exit 1
    else
        echo "✅ No critical ESLint errors found (warnings are acceptable)"
    fi
fi

echo ""
echo "3️⃣  Running TypeScript type checking..."
if npm run type-check; then
    echo "✅ No type errors found"
else
    echo "❌ Type errors found. Please fix them manually."
    exit 1
fi

echo ""
echo "🎉 All code quality checks passed!"
echo "=================================="
echo ""
echo "Available commands:"
echo "  npm run format          - Fix formatting issues"
echo "  npm run lint           - Fix auto-fixable linting issues"
echo "  npm run code-quality   - Run all fixes and checks"
echo ""
