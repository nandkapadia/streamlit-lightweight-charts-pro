#!/bin/bash

# Backend pre-commit hook for streamlit-lightweight-charts-pro
# Runs Python code quality checks and tests

set -e

echo "🐍 Backend Pre-commit Checks"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    print_error "Not in project root directory. Please run from streamlit-lightweight-charts-pro root."
    exit 1
fi

# Check if Python is available
if ! command -v python &> /dev/null; then
    print_error "Python is not available. Please install Python."
    exit 1
fi

# Use our Python pre-commit test runner if available
if [ -f "scripts/run-pre-commit-tests.py" ]; then
    print_status "Running comprehensive Python pre-commit test suite..."
    if python scripts/run-pre-commit-tests.py; then
        print_success "Backend checks passed!"
    else
        print_error "Backend checks failed!"
        exit 1
    fi
else
    print_status "Running basic Python checks..."

    # Step 1: Run isort with --float-to-top
    print_status "Step 1: Organizing imports with isort (--float-to-top)..."
    if ! python -m isort tests/ streamlit_lightweight_charts_pro/ --float-to-top; then
        print_error "isort failed!"
        exit 1
    fi
    print_success "Import organization completed"

    # Step 2: Run autoflake
    print_status "Step 2: Removing unused imports with autoflake..."
    if ! python -m autoflake tests/ streamlit_lightweight_charts_pro/ --remove-all-unused-imports --remove-unused-variables --recursive --in-place; then
        print_error "autoflake failed!"
        exit 1
    fi
    print_success "Unused imports removal completed"

    # Step 3: Run black
    print_status "Step 3: Formatting code with black..."
    if ! python -m black tests/ streamlit_lightweight_charts_pro/; then
        print_error "black failed!"
        exit 1
    fi
    print_success "Code formatting completed"

    # Step 4: Run basic tests (excluding performance)
    print_status "Step 4: Running Python tests..."
    if ! python -m pytest tests/unit/ tests/integration/ tests/e2e/ --tb=short -q --maxfail=3; then
        print_error "Python tests failed!"
        exit 1
    fi
    print_success "All tests passed"

    print_success "All backend checks passed!"
fi

echo ""
print_success "🎉 Backend pre-commit checks completed successfully!"
echo "=================================================="
