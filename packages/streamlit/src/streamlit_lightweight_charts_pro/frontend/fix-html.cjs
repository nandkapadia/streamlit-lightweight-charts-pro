#!/usr/bin/env node
// Script to fix Vite-generated HTML for Streamlit compatibility
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'build', 'index.html');

// Fix HTML by removing type="module" attribute
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Remove type="module" attributes (required for Streamlit compatibility)
  // Vite adds type="module" which breaks Streamlit's iframe loading
  html = html.replace(/type="module"\s*/g, '');

  fs.writeFileSync(htmlPath, html);
  console.log('✅ Fixed HTML for Streamlit compatibility');
} else {
  console.error('❌ build/index.html not found');
}
