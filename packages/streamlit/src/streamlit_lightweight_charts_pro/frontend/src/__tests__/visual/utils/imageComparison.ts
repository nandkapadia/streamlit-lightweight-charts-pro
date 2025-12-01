/**
 * Image Comparison Utilities for Visual Tests
 *
 * Provides utilities to save, load, and compare canvas images for visual
 * regression testing using pixelmatch and pngjs.
 *
 * @module visual/utils/imageComparison
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

/**
 * Image comparison result
 */
export interface ComparisonResult {
  matches: boolean;
  diffPixels: number;
  diffPercentage: number;
  diffImage?: Buffer;
}

/**
 * Image comparison options
 */
export interface ComparisonOptions {
  threshold?: number; // 0-1, higher = more tolerant
  tolerance?: number; // Percentage of allowed diff (0-100)
  includeAA?: boolean; // Include anti-aliasing detection
  createDiffImage?: boolean; // Generate diff image
}

/**
 * Gets the snapshot directory path
 *
 * @returns Absolute path to snapshots directory
 */
export function getSnapshotDir(): string {
  return path.join(__dirname, '..', '__snapshots__');
}

/**
 * Gets the diff directory path
 *
 * @returns Absolute path to diffs directory
 */
export function getDiffDir(): string {
  const diffDir = path.join(getSnapshotDir(), '__diffs__');
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }
  return diffDir;
}

/**
 * Ensures snapshot directory exists
 */
export function ensureSnapshotDir(): void {
  const snapshotDir = getSnapshotDir();
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }
}

/**
 * Gets the baseline image path for a test
 *
 * @param testName - Name of the test
 * @param variant - Optional variant name for multiple snapshots per test
 * @returns Absolute path to baseline image
 */
export function getBaselinePath(testName: string, variant?: string): string {
  const fileName = variant ? `${testName}-${variant}.png` : `${testName}.png`;
  return path.join(getSnapshotDir(), fileName);
}

/**
 * Gets the diff image path for a test
 *
 * @param testName - Name of the test
 * @param variant - Optional variant name
 * @returns Absolute path to diff image
 */
export function getDiffPath(testName: string, variant?: string): string {
  const fileName = variant ? `${testName}-${variant}-diff.png` : `${testName}-diff.png`;
  return path.join(getDiffDir(), fileName);
}

/**
 * Converts ImageData to PNG buffer
 *
 * @param imageData - Canvas ImageData
 * @returns PNG image as Buffer
 */
export function imageDataToPNG(imageData: ImageData): Buffer {
  const png = new PNG({
    width: imageData.width,
    height: imageData.height,
  });

  // Copy pixel data
  for (let i = 0; i < imageData.data.length; i++) {
    png.data[i] = imageData.data[i];
  }

  return PNG.sync.write(png);
}

/**
 * Loads PNG file as ImageData-like object
 *
 * @param filePath - Path to PNG file
 * @returns Object with width, height, and data
 */
export function loadPNG(filePath: string): { width: number; height: number; data: Buffer } {
  const buffer = fs.readFileSync(filePath);
  const png = PNG.sync.read(buffer);
  return {
    width: png.width,
    height: png.height,
    data: png.data,
  };
}

/**
 * Saves PNG image to file
 *
 * @param buffer - PNG buffer
 * @param filePath - Destination file path
 */
export function savePNG(buffer: Buffer, filePath: string): void {
  ensureSnapshotDir();
  fs.writeFileSync(filePath, buffer);
}

/**
 * Compares two images pixel by pixel
 *
 * @param actual - Actual image data
 * @param baseline - Baseline image data
 * @param options - Comparison options
 * @returns ComparisonResult with match status and details
 */
export function compareImages(
  actual: ImageData,
  baseline: { width: number; height: number; data: Buffer },
  options: ComparisonOptions = {}
): ComparisonResult {
  const { threshold = 0.1, tolerance = 0.5, includeAA = true, createDiffImage = true } = options;

  // Check dimensions match
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    return {
      matches: false,
      diffPixels: actual.width * actual.height,
      diffPercentage: 100,
    };
  }

  // Create diff image buffer if requested
  let diffImage: Buffer | undefined;
  let diffData: Uint8Array | undefined;

  if (createDiffImage) {
    diffData = new Uint8Array(actual.width * actual.height * 4);
  }

  // Compare using pixelmatch
  const diffPixels = pixelmatch(actual.data, baseline.data, diffData, actual.width, actual.height, {
    threshold,
    includeAA,
    alpha: 0.1,
    diffColor: [255, 0, 0], // Red for differences
  });

  const totalPixels = actual.width * actual.height;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  // Create diff PNG if needed
  if (createDiffImage && diffData) {
    const diffPng = new PNG({
      width: actual.width,
      height: actual.height,
    });
    diffPng.data = Buffer.from(diffData);
    diffImage = PNG.sync.write(diffPng);
  }

  return {
    matches: diffPercentage <= tolerance,
    diffPixels,
    diffPercentage: Number(diffPercentage.toFixed(2)),
    diffImage,
  };
}

/**
 * Saves or compares against baseline snapshot
 *
 * @param testName - Name of the test
 * @param imageData - Actual image data from test
 * @param options - Comparison options
 * @param variant - Optional variant name
 * @returns ComparisonResult
 */
export function assertMatchesSnapshot(
  testName: string,
  imageData: ImageData,
  options: ComparisonOptions = {},
  variant?: string
): ComparisonResult {
  const baselinePath = getBaselinePath(testName, variant);
  const actualPNG = imageDataToPNG(imageData);

  // If baseline doesn't exist, save it
  if (!fs.existsSync(baselinePath)) {
    if (process.env.CI) {
      throw new Error(
        `Baseline snapshot not found: ${baselinePath}\n` +
          'Run tests locally with UPDATE_SNAPSHOTS=true to create baselines.'
      );
    }

    savePNG(actualPNG, baselinePath);
    console.log(`✓ Created baseline: ${path.basename(baselinePath)}`);

    return {
      matches: true,
      diffPixels: 0,
      diffPercentage: 0,
    };
  }

  // Load baseline and compare
  const baseline = loadPNG(baselinePath);
  const result = compareImages(imageData, baseline, options);

  // If update mode is enabled, update baseline
  if (process.env.UPDATE_SNAPSHOTS === 'true' && !result.matches) {
    savePNG(actualPNG, baselinePath);
    console.log(`✓ Updated baseline: ${path.basename(baselinePath)}`);
    return {
      matches: true,
      diffPixels: 0,
      diffPercentage: 0,
    };
  }

  // Save diff image if comparison failed
  if (!result.matches && result.diffImage) {
    const diffPath = getDiffPath(testName, variant);
    savePNG(result.diffImage, diffPath);
    console.log(`✗ Saved diff image: ${path.basename(diffPath)}`);
  }

  return result;
}

/**
 * Formats a test name to be filesystem-safe
 *
 * @param testName - Raw test name
 * @returns Sanitized test name
 */
export function sanitizeTestName(testName: string): string {
  return testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
