#!/bin/bash

# Frontend pre-commit hook for streamlit-lightweight-charts-pro
# Runs TypeScript/React code quality checks

set -e

echo "⚛️  Frontend Pre-commit Checks"
echo "=============================="

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

# Navigate to frontend directory
FRONTEND_DIR="streamlit_lightweight_charts_pro/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found!"
    exit 1
fi

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not available. Please install Node.js."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not available. Please install npm."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Run frontend code quality checks
print_status "Running frontend code quality checks..."

# Check if the quality check script exists
if [ -f "check-code-quality.sh" ]; then
    print_status "Using existing code quality script..."
    if bash check-code-quality.sh; then
        print_success "Frontend checks passed!"
    else
        print_error "Frontend checks failed!"
        exit 1
    fi
else
    print_status "Running individual checks..."
    
    # Step 1: Check code formatting with Prettier
    print_status "Step 1: Checking code formatting with Prettier..."
    if ! npm run format:check; then
        print_error "Code formatting issues found. Run 'npm run format' to fix."
        exit 1
    fi
    print_success "Code formatting is correct"
    
    # Step 2: Run ESLint checks
    print_status "Step 2: Running ESLint checks..."
    if ! npm run lint:check; then
        print_error "Linting issues found. Run 'npm run lint' to fix auto-fixable issues."
        exit 1
    fi
    print_success "No linting issues found"
    
    # Step 3: Run TypeScript type checking
    print_status "Step 3: Running TypeScript type checking..."
    if ! npm run type-check; then
        print_error "Type errors found. Please fix them manually."
        exit 1
    fi
    print_success "No type errors found"
    
    print_success "All frontend checks passed!"
fi

echo ""
print_success "🎉 Frontend pre-commit checks completed successfully!"
echo "=================================================="
