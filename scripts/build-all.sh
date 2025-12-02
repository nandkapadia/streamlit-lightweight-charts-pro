#!/bin/bash

# Comprehensive build script for all packages in the monorepo
# Builds packages in the correct dependency order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from streamlit-lightweight-charts-pro root."
    exit 1
fi

print_header "Building All Packages"
echo "This will build packages in the correct dependency order:"
echo "  1. Core (@lightweight-charts-pro/core)"
echo "  2. Vue3 (@lightweight-charts-pro/vue3) - depends on core"
echo "  3. Streamlit Frontend - depends on core"
echo ""

# Step 1: Install all dependencies
print_header "Step 1: Installing Dependencies"
echo "Installing root dependencies..."
npm install
print_success "Root dependencies installed"

# Step 2: Build Core Package
print_header "Step 2: Building Core Package"
echo "Building @lightweight-charts-pro/core..."
cd packages/core

if [ ! -d "node_modules" ]; then
    print_warning "Core node_modules not found, installing..."
    npm install
fi

npm run build
print_success "Core package built successfully"
cd ../..

# Step 3: Build Vue3 Package (depends on core)
print_header "Step 3: Building Vue3 Package"
echo "Building @lightweight-charts-pro/vue3..."
cd packages/vue3

if [ ! -d "node_modules" ]; then
    print_warning "Vue3 node_modules not found, installing..."
    npm install
fi

npm run build
print_success "Vue3 package built successfully"
cd ../..

# Step 4: Build Streamlit Frontend (depends on core)
print_header "Step 4: Building Streamlit Frontend"
echo "Building Streamlit frontend..."
cd packages/streamlit/src/streamlit_lightweight_charts_pro/frontend

if [ ! -d "node_modules" ]; then
    print_warning "Frontend node_modules not found, installing..."
    npm install
fi

npm run build
print_success "Streamlit frontend built successfully"
cd ../../../../..

# Step 5: Build Python Package
print_header "Step 5: Building Python Package"
echo "Building Python package (streamlit-lightweight-charts-pro)..."

# Clean previous builds
rm -rf dist/ build/ *.egg-info

# Build wheel and source distribution
python -m build

if [ -d "dist" ]; then
    print_success "Python package built successfully"
    echo ""
    echo "Built distributions:"
    ls -lh dist/
else
    print_error "Python package build failed"
    exit 1
fi

cd ..

# Summary
print_header "Build Summary"
print_success "All packages built successfully!"
echo ""
echo "Package locations:"
echo "  Core:             packages/core/dist/"
echo "  Vue3:             packages/vue3/dist/"
echo "  Streamlit (TS):   packages/streamlit/src/streamlit_lightweight_charts_pro/frontend/build/"
echo "  Streamlit (Py):   dist/"
echo ""
print_success "Build complete! 🎉"
