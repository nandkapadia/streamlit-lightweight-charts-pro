#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all test files
const testFiles = glob.sync('src/**/*.test.{ts,tsx}', {
  cwd: process.cwd(),
  absolute: true
});

console.log(`Found ${testFiles.length} test files`);

let filesFixed = 0;
let filesSkipped = 0;

testFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has vitest import
  if (content.includes("from 'vitest'") || content.includes('from "vitest"')) {
    filesSkipped++;
    return;
  }

  // Check if file uses vitest functions
  const usesVitestFunctions =
    content.includes('describe(') ||
    content.includes('it(') ||
    content.includes('expect(') ||
    content.includes('beforeEach(') ||
    content.includes('afterEach(') ||
    content.includes('beforeAll(') ||
    content.includes('afterAll(') ||
    content.includes('vi.fn(') ||
    content.includes('vi.mock(') ||
    content.includes('vi.spyOn(');

  if (!usesVitestFunctions) {
    filesSkipped++;
    return;
  }

  // Determine which functions are used
  const functionsUsed = new Set();
  if (content.includes('describe(')) functionsUsed.add('describe');
  if (content.includes('it(') || content.includes('test(')) functionsUsed.add('it');
  if (content.includes('expect(')) functionsUsed.add('expect');
  if (content.includes('beforeEach(')) functionsUsed.add('beforeEach');
  if (content.includes('afterEach(')) functionsUsed.add('afterEach');
  if (content.includes('beforeAll(')) functionsUsed.add('beforeAll');
  if (content.includes('afterAll(')) functionsUsed.add('afterAll');
  if (content.includes('vi.')) functionsUsed.add('vi');

  // Build import statement
  const importStatement = `import { ${Array.from(functionsUsed).sort().join(', ')} } from 'vitest';`;

  // Find where to insert the import
  let insertPosition = 0;
  let addedNewline = '';

  // Check if file has jsdom environment comment
  const jsdomMatch = content.match(/@vitest-environment jsdom/);
  const hasJsdomComment = !!jsdomMatch;

  // Find the first import statement or use start of file
  const firstImportMatch = content.match(/^import\s+/m);

  if (firstImportMatch) {
    insertPosition = firstImportMatch.index;
  } else if (hasJsdomComment) {
    // If has jsdom comment but no imports, add after the comment block
    const commentEndMatch = content.match(/\*\/\s*\n/);
    if (commentEndMatch) {
      insertPosition = commentEndMatch.index + commentEndMatch[0].length;
    }
  } else {
    // Add jsdom comment if file uses React/DOM
    if (content.includes('@testing-library/react') || content.includes('render(') || content.includes('document')) {
      const jsdomComment = `/**
 * @vitest-environment jsdom
 */

`;
      content = jsdomComment + content;
      insertPosition = jsdomComment.length;
    }
  }

  // Check if we need jest-dom imports
  if (content.includes('toBeInTheDocument') || content.includes('toBeVisible') || content.includes('toHaveAttribute')) {
    if (!content.includes('@testing-library/jest-dom')) {
      const jestDomImport = `import '@testing-library/jest-dom/vitest';\n`;
      content = content.slice(0, insertPosition) + jestDomImport + content.slice(insertPosition);
      insertPosition += jestDomImport.length;
    }
  }

  // Insert the vitest import
  const newContent = content.slice(0, insertPosition) + importStatement + '\n' + content.slice(insertPosition);

  fs.writeFileSync(filePath, newContent);
  filesFixed++;
  console.log(`Fixed: ${path.basename(filePath)}`);
});

console.log(`\nSummary:`);
console.log(`Files fixed: ${filesFixed}`);
console.log(`Files skipped: ${filesSkipped}`);
console.log(`Total files: ${testFiles.length}`);
