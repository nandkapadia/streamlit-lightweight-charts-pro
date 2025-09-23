#!/usr/bin/env node
// Script to fix Vite-generated HTML for Streamlit compatibility
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'build', 'index.html');

// Fix HTML by removing type="module" as recommended in the article
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/type="module"\s*/g, '');
  fs.writeFileSync(htmlPath, html);
  console.log('✅ Fixed HTML for Streamlit compatibility');
} else {
  console.error('❌ build/index.html not found');
}