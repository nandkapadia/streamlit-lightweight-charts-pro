#!/bin/bash
# Run CI/CD pipeline checks locally
# This script runs the same checks as the GitHub Actions CI pipeline

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored headers
print_header() {
    echo -e "\n${BLUE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Track if any checks fail
FAILED_CHECKS=""

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    print_error "Error: pyproject.toml not found. Please run this script from the project root."
    exit 1
fi

echo -e "${BLUE}Starting CI/CD Pipeline Checks${NC}"
echo "This will run the same checks as GitHub Actions CI/CD"

# ============================================
# Python Backend Checks
# ============================================

print_header "1. Python Linting (Ruff)"
if ruff check .; then
    print_success "Python linting passed"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Python linting (ruff)"
fi

print_header "2. Python Formatting (Ruff Format)"
if ruff format --check .; then
    print_success "Python formatting check passed"
else
    print_error "Python formatting issues found. Run 'ruff format .' to fix"
    FAILED_CHECKS="$FAILED_CHECKS\n- Python formatting"
fi

print_header "3. Type Checking (MyPy)"
if mypy streamlit_lightweight_charts_pro --ignore-missing-imports; then
    print_success "Type checking passed"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Type checking (mypy)"
fi

print_header "4. Security Checks (Bandit)"
# Exclude cli.py - it's a development tool with safe subprocess usage (shell=False, no user input)
if bandit -r streamlit_lightweight_charts_pro/ --exclude streamlit_lightweight_charts_pro/cli.py -f json -o bandit-report.json; then
    print_success "Security checks passed"
    rm -f bandit-report.json
else
    print_error "Security issues found. Check bandit-report.json for details"
    FAILED_CHECKS="$FAILED_CHECKS\n- Security checks (bandit)"
fi

print_header "5. Python Unit Tests (Pytest - Parallel)"
echo "Running all tests except performance tests in parallel..."
if pytest tests/ -v --cov=streamlit_lightweight_charts_pro --cov-report=term-missing -m "not performance" -n auto; then
    print_success "Python unit/integration/e2e tests passed (parallel)"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Python unit/integration/e2e tests"
fi

print_header "6. Python Performance Tests (Sequential)"
echo "Running performance tests sequentially..."
if pytest tests/performance/ -v -m "performance" --tb=short; then
    print_success "Python performance tests passed"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Python performance tests"
fi

# ============================================
# Frontend Checks
# ============================================

print_header "7. Frontend Dependencies"
cd streamlit_lightweight_charts_pro/frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm ci
fi

print_header "8. Frontend Linting (ESLint)"
if npm run lint; then
    print_success "Frontend linting passed"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Frontend linting"
fi

print_header "9. Frontend Formatting"
if npm run format:check; then
    print_success "Frontend formatting check passed"
else
    print_error "Frontend formatting issues found. Run 'npm run format' to fix"
    FAILED_CHECKS="$FAILED_CHECKS\n- Frontend formatting"
fi

print_header "10. Frontend Type Checking (TypeScript)"
if npm run type-check; then
    print_success "Frontend type checking passed"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Frontend type checking"
fi

print_header "11. Frontend Unit Tests"
if npm run test:batched; then
    print_success "Frontend unit tests passed"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Frontend unit tests"
fi

print_header "12. Frontend Build"
if npm run build; then
    print_success "Frontend build successful"
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Frontend build"
fi

# Return to root directory
cd ../..

# ============================================
# Package Build Check
# ============================================

print_header "13. Package Build Check"
if python -m build --sdist --wheel --outdir dist/ .; then
    print_success "Package build successful"
    # Check with twine
    if command -v twine &> /dev/null; then
        # Try to validate with twine, but don't fail if dependencies are missing
        if twine check dist/* 2>&1 | grep -q "ModuleNotFoundError"; then
            echo "Note: twine validation skipped (missing docutils). Install with: pip install twine[all]"
            print_success "Package build successful (validation skipped)"
        elif twine check dist/*; then
            print_success "Package validation passed"
        else
            FAILED_CHECKS="$FAILED_CHECKS\n- Package validation (twine)"
        fi
    else
        echo "Note: Install twine to validate package: pip install twine[all]"
    fi
    # Clean up dist directory
    rm -rf dist/
else
    FAILED_CHECKS="$FAILED_CHECKS\n- Package build"
fi

# ============================================
# Summary
# ============================================

print_header "CI/CD Pipeline Check Summary"

if [ -z "$FAILED_CHECKS" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ All CI/CD checks passed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${GREEN}Your code is ready to be pushed to GitHub!${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Some CI/CD checks failed:${NC}"
    echo -e "${RED}$FAILED_CHECKS${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${YELLOW}Please fix these issues before pushing to GitHub.${NC}"
    exit 1
fi
