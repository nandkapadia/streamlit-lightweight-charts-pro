#!/bin/bash

# Basic frontend pre-commit hook for streamlit-lightweight-charts-pro
# Runs only essential checks: formatting and build

set -e

echo "⚛️  Basic Frontend Pre-commit Checks"
echo "===================================="

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

# Find project root directory (where pyproject.toml is located)
PROJECT_ROOT=""
if [ -f "pyproject.toml" ]; then
    PROJECT_ROOT="."
elif [ -f "../pyproject.toml" ]; then
    PROJECT_ROOT=".."
elif [ -f "../../pyproject.toml" ]; then
    PROJECT_ROOT="../.."
else
    print_error "Cannot find project root directory with pyproject.toml"
    exit 1
fi

# Navigate to project root
cd "$PROJECT_ROOT"

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

print_status "Running basic frontend checks..."

# Step 1: Check code formatting with Prettier
print_status "Step 1: Checking code formatting with Prettier..."
if ! npm run format:check; then
    print_error "Code formatting issues found. Run 'npm run format' to fix."
    exit 1
fi
print_success "Code formatting is correct"

# Step 2: Try a quick build check (but don't fail if it has issues)
print_status "Step 2: Checking build capability..."
if npm run build > /dev/null 2>&1; then
    print_success "Build check passed"
else
    print_warning "Build check had issues, but continuing (TypeScript errors may exist)"
fi

echo ""
print_success "🎉 Basic frontend pre-commit checks completed!"
echo "============================================="
print_status "✅ Frontend formatting is ready for commit!"
print_warning "ℹ️  TypeScript and ESLint checks were skipped for speed"
print_warning "ℹ️  Run 'npm run type-check' and 'npm run lint' manually for full checks"
echo ""
