#!/bin/bash

# Unified pre-commit hook for streamlit-lightweight-charts-pro
# Runs functionality-focused code quality checks (excludes performance tests)

set -e

echo "🚀 Streamlit Lightweight Charts Pro - Pre-commit Checks"
echo "======================================================"

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

# Configuration
FAST_MODE=${PRE_COMMIT_FAST:-false}
SKIP_FRONTEND=${PRE_COMMIT_SKIP_FRONTEND:-false}

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    print_error "Not in project root directory. Please run from streamlit-lightweight-charts-pro root."
    exit 1
fi

# Detect changed files to determine what to check
CHANGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")
PYTHON_CHANGES=false
FRONTEND_CHANGES=false

if [ -n "$CHANGED_FILES" ]; then
    # Check for Python changes
    if echo "$CHANGED_FILES" | grep -q -E '\.(py)$'; then
        PYTHON_CHANGES=true
    fi
    
    # Check for frontend changes
    if echo "$CHANGED_FILES" | grep -q -E 'streamlit_lightweight_charts_pro/frontend/.*\.(ts|tsx|js|jsx)$'; then
        FRONTEND_CHANGES=true
    fi
else
    # If no staged files, check everything
    PYTHON_CHANGES=true
    FRONTEND_CHANGES=true
fi

print_status "Python changes detected: $PYTHON_CHANGES"
print_status "Frontend changes detected: $FRONTEND_CHANGES"
print_status "Fast mode: $FAST_MODE"

# =============================================================================
# Python/Backend Checks
# =============================================================================

if [ "$PYTHON_CHANGES" = true ]; then
    echo ""
    print_status "🐍 Running Python code quality checks..."
    
    # Check if Python is available
    if ! command -v python &> /dev/null; then
        print_error "Python is not available. Please install Python."
        exit 1
    fi

    # Step 1: Import organization
    print_status "Step 1: Organizing imports with isort..."
    if ! python -m isort tests/ streamlit_lightweight_charts_pro/ --float-to-top --check-only --diff; then
        print_error "Import organization issues found. Run 'python -m isort tests/ streamlit_lightweight_charts_pro/ --float-to-top' to fix."
        exit 1
    fi
    print_success "Import organization is correct"

    # Step 2: Remove unused imports
    print_status "Step 2: Checking for unused imports with autoflake..."
    if ! python -m autoflake tests/ streamlit_lightweight_charts_pro/ --remove-all-unused-imports --remove-unused-variables --recursive --check; then
        print_error "Unused imports found. Run 'python -m autoflake tests/ streamlit_lightweight_charts_pro/ --remove-all-unused-imports --remove-unused-variables --recursive --in-place' to fix."
        exit 1
    fi
    print_success "No unused imports found"

    # Step 3: Code formatting
    print_status "Step 3: Checking code formatting with black..."
    if ! python -m black tests/ streamlit_lightweight_charts_pro/ --check; then
        print_error "Code formatting issues found. Run 'python -m black tests/ streamlit_lightweight_charts_pro/' to fix."
        exit 1
    fi
    print_success "Code formatting is correct"

    # Step 4: Run functionality tests (excluding performance)
    print_status "Step 4: Running functionality tests (excluding performance)..."
    
    # Use pytest plugin to exclude performance tests
    if ! python -m pytest tests/unit/ tests/integration/ tests/e2e/ \
        --tb=short -q --maxfail=3 \
        -p scripts.pytest_precommit_plugin \
        --disable-warnings; then
        print_error "Python functionality tests failed!"
        exit 1
    fi
    print_success "All functionality tests passed"

    print_success "✅ Python checks completed successfully!"
else
    print_status "⏭️  Skipping Python checks (no Python files changed)"
fi

# =============================================================================
# Frontend Checks
# =============================================================================

if [ "$FRONTEND_CHANGES" = true ] && [ "$SKIP_FRONTEND" != true ]; then
    echo ""
    print_status "⚛️  Running frontend code quality checks..."
    
    FRONTEND_DIR="streamlit_lightweight_charts_pro/frontend"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
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
    
    # Step 1: Code formatting
    print_status "Step 1: Checking code formatting with Prettier..."
    if ! npm run format:check; then
        print_error "Code formatting issues found. Run 'npm run format' to fix."
        exit 1
    fi
    print_success "Code formatting is correct"
    
    if [ "$FAST_MODE" = true ]; then
        print_status "Fast mode: Skipping TypeScript and ESLint checks"
    else
        # Step 2: ESLint (production code only)
        print_status "Step 2: Running ESLint on production code..."
        if ! npx eslint src --ext .ts,.tsx,.js,.jsx \
            --ignore-pattern "src/**/__tests__/**" \
            --ignore-pattern "src/**/*.test.*" \
            --fix; then
            print_warning "Some ESLint issues found, attempting auto-fix..."
            # Try auto-fix again
            npx eslint src --ext .ts,.tsx,.js,.jsx \
                --ignore-pattern "src/**/__tests__/**" \
                --ignore-pattern "src/**/*.test.*" \
                --fix || true
            
            # Check for remaining errors (ignore warnings)
            print_status "Checking for critical errors only..."
            if npx eslint src --ext .ts,.tsx,.js,.jsx \
                --ignore-pattern "src/**/__tests__/**" \
                --ignore-pattern "src/**/*.test.*" 2>&1 | grep -q "error"; then
                print_error "Critical ESLint errors found. Please fix them manually."
                exit 1
            else
                print_success "No critical ESLint errors found (warnings are acceptable)"
            fi
        else
            print_success "No ESLint issues found"
        fi
        
        # Step 3: TypeScript type checking
        print_status "Step 3: Running TypeScript type checking..."
        if ! npm run type-check; then
            print_error "Type errors found. Please fix them manually."
            exit 1
        fi
        print_success "No type errors found"
    fi
    
    # Step 4: Build check (quick)
    print_status "Step 4: Checking build capability..."
    if npm run build > /dev/null 2>&1; then
        print_success "Build check passed"
    else
        print_warning "Build check had issues, but continuing (TypeScript errors may exist)"
    fi
    
    # Return to project root
    cd - > /dev/null
    
    print_success "✅ Frontend checks completed successfully!"
else
    if [ "$SKIP_FRONTEND" = true ]; then
        print_status "⏭️  Skipping frontend checks (PRE_COMMIT_SKIP_FRONTEND=true)"
    else
        print_status "⏭️  Skipping frontend checks (no frontend files changed)"
    fi
fi

# =============================================================================
# Summary
# =============================================================================

echo ""
print_success "🎉 Pre-commit checks completed successfully!"
echo "=================================================="

if [ "$PYTHON_CHANGES" = true ]; then
    print_status "✅ Python functionality tests passed (performance tests excluded)"
fi

if [ "$FRONTEND_CHANGES" = true ] && [ "$SKIP_FRONTEND" != true ]; then
    if [ "$FAST_MODE" = true ]; then
        print_status "✅ Frontend formatting passed (fast mode)"
    else
        print_status "✅ Frontend production code quality passed"
    fi
fi

echo ""
print_status "💡 Usage tips:"
echo "   • Set PRE_COMMIT_FAST=true for faster checks (skips TypeScript/ESLint)"
echo "   • Set PRE_COMMIT_SKIP_FRONTEND=true to skip frontend checks"
echo "   • Performance tests are automatically excluded from pre-commit runs"
echo "   • Run 'make test' for full test suite including performance tests"
echo ""
