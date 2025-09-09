#!/bin/bash

# Script to rebuild the frontend for streamlit-lightweight-charts-pro

echo "Rebuilding frontend for streamlit-lightweight-charts-pro..."

# Navigate to the frontend directory
cd streamlit_lightweight_charts_pro/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clean the build directory
echo "Cleaning build directory..."
rm -rf build

# Build the frontend
echo "Building frontend..."
npm run build

# Check if build was successful
if [ -d "build" ]; then
    echo "Frontend build successful!"
    echo "Build directory contents:"
    ls -la build/
    echo ""
    echo "Static JS files:"
    ls -la build/static/js/
else
    echo "Frontend build failed!"
    exit 1
fi

echo "Frontend rebuild complete!" 