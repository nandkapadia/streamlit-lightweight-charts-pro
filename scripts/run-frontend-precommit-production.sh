#!/bin/bash

# Frontend pre-commit hook for streamlit-lightweight-charts-pro
# Runs TypeScript/React code quality checks on production code only

set -e

echo "⚛️  Frontend Production Code Pre-commit Checks"
echo "=============================================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    print_error "Not in project root directory. Please run from streamlit-lightweight-charts-pro root."
    exit 1
fi

# Navigate to frontend directory
FRONTEND_DIR="packages/streamlit/src/streamlit_lightweight_charts_pro/frontend"

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

print_status "Running frontend production code quality checks..."

# Step 1: Check code formatting with Prettier
print_status "Step 1: Checking code formatting with Prettier..."
if ! npm run format:check; then
    print_error "Code formatting issues found. Run 'npm run format' to fix."
    exit 1
fi
print_success "Code formatting is correct"

# Step 2: Run ESLint on production code only (exclude tests)
print_status "Step 2: Running ESLint on production code (excluding tests)..."
if ! npx eslint src --ext .ts,.tsx,.js,.jsx --ignore-pattern "src/**/__tests__/**" --ignore-pattern "src/**/*.test.*" --fix; then
    print_warning "Some ESLint issues found, attempting auto-fix..."
    # Try auto-fix again
    npx eslint src --ext .ts,.tsx,.js,.jsx --ignore-pattern "src/**/__tests__/**" --ignore-pattern "src/**/*.test.*" --fix || true

    # Check for remaining errors (ignore warnings)
    print_status "Checking for critical errors only..."
    if npx eslint src --ext .ts,.tsx,.js,.jsx --ignore-pattern "src/**/__tests__/**" --ignore-pattern "src/**/*.test.*" 2>&1 | grep -q "error"; then
        print_error "Critical ESLint errors found in production code. Please fix them manually."
        exit 1
    else
        print_success "No critical ESLint errors found in production code (warnings are acceptable)"
    fi
else
    print_success "No ESLint issues found in production code"
fi

# Step 3: Run TypeScript type checking
print_status "Step 3: Running TypeScript type checking..."
if ! npm run type-check; then
    print_error "Type errors found. Please fix them manually."
    exit 1
fi
print_success "No type errors found"

# Step 4: Check for build issues (quick check)
print_status "Step 4: Checking for build issues..."
if ! npm run build > /dev/null 2>&1; then
    print_error "Build failed. Please fix build issues."
    exit 1
fi
print_success "Build check passed"

echo ""
print_success "🎉 Frontend production code pre-commit checks completed successfully!"
echo "=========================================================="
print_status "✅ Production code is ready for commit!"
print_warning "ℹ️  Test files were excluded from linting checks"
echo ""
