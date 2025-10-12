/**
 * @fileoverview Coverage Tests System Verification
 * @vitest-environment jsdom
 *
 * This test file verifies that our Coverage Tests system works correctly
 * with our existing centralized mock infrastructure and test helpers.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Import coverage system components
import { CoverageTestCases, COVERAGE_TEST_SUITES } from './coverage-test-cases';
import { CoverageRunner } from './runner';
import {
  COVERAGE_AREAS,
  getCoverageConfig,
  getMergedCoverageConfig,
  calculateWeightedCoverage,
} from './coverage-config';

// Import centralized testing infrastructure
import { setupTestSuite } from '../setup/testConfiguration';
import { MockFactory, setupGlobalMocks, MockPresets } from '../mocks/MockFactory';

// Setup test suite with unit preset for fast execution
setupTestSuite('unit');

describe('Coverage Tests System Verification', () => {
  let runner: CoverageRunner;

  beforeEach(async () => {
    // Setup mocks for coverage testing
    setupGlobalMocks(MockPresets.unit());
    runner = new CoverageRunner({ verbose: false, parallel: false });
  });

  afterEach(() => {
    MockFactory.resetAll();
    vi.clearAllMocks();
  });

  describe('Coverage Configuration', () => {
    it('should provide valid configuration for all areas', () => {
      COVERAGE_AREAS.forEach(area => {
        const config = getCoverageConfig(area.name);

        expect(config).toBeDefined();
        expect(config.thresholds.global).toBeDefined();
        expect(config.include).toBeDefined();
        expect(Array.isArray(config.include)).toBe(true);

        // Verify threshold values are reasonable
        expect(config.thresholds.global.statements).toBeGreaterThanOrEqual(0);
        expect(config.thresholds.global.statements).toBeLessThanOrEqual(100);
      });
    });

    it('should merge configurations correctly', () => {
      const mergedConfig = getMergedCoverageConfig(['components', 'utilities']);

      expect(mergedConfig).toBeDefined();
      expect(mergedConfig.include.length).toBeGreaterThan(0);

      // Should include patterns from both areas
      expect(mergedConfig.include.some(pattern => pattern.includes('components'))).toBe(true);
      expect(mergedConfig.include.some(pattern => pattern.includes('utils'))).toBe(true);
    });

    it('should calculate weighted coverage correctly', () => {
      const areaCoverages = [
        {
          area: 'components',
          coverage: { statements: 90, branches: 85, functions: 90, lines: 90 },
        },
        { area: 'utilities', coverage: { statements: 95, branches: 90, functions: 95, lines: 95 } },
      ];

      const weighted = calculateWeightedCoverage(areaCoverages);

      expect(weighted).toBeDefined();
      expect(weighted.statements).toBeGreaterThan(0);
      expect(weighted.statements).toBeLessThanOrEqual(100);
      expect(typeof weighted.statements).toBe('number');
    });
  });

  describe('Test Case Generation', () => {
    it('should generate test cases for components area', () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('components');

      expect(Array.isArray(testCases)).toBe(true);
      expect(testCases.length).toBeGreaterThan(0);

      testCases.forEach(testCase => {
        expect(testCase.name).toBeDefined();
        expect(testCase.description).toBeDefined();
        expect(testCase.area).toBe('components');
        expect(testCase.targetFile).toBeDefined();
        expect(typeof testCase.testFunction).toBe('function');
      });
    });

    it('should generate test cases for utilities area', () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('utilities');

      expect(Array.isArray(testCases)).toBe(true);
      expect(testCases.length).toBeGreaterThan(0);

      testCases.forEach(testCase => {
        expect(testCase.area).toBe('utilities');
        expect(testCase.expectedCoverage).toBeDefined();
      });
    });

    it('should get all test cases across areas', () => {
      const allTestCases = CoverageTestCases.getAllTestCases();

      expect(Array.isArray(allTestCases)).toBe(true);
      expect(allTestCases.length).toBeGreaterThan(0);

      // Should include test cases from multiple areas
      const areas = [...new Set(allTestCases.map(tc => tc.area))];
      expect(areas.length).toBeGreaterThan(1);
    });
  });

  describe('Test Suite Creation', () => {
    it('should create predefined test suites', () => {
      const coreTestSuite = COVERAGE_TEST_SUITES.core();

      expect(coreTestSuite).toBeDefined();
      expect(coreTestSuite.name).toBe('Core Coverage');
      expect(coreTestSuite.testCases.length).toBeGreaterThan(0);
      expect(coreTestSuite.config).toBeDefined();
    });

    it('should create full coverage test suite', () => {
      const fullTestSuite = COVERAGE_TEST_SUITES.full();

      expect(fullTestSuite.name).toBe('Full Coverage');
      expect(fullTestSuite.testCases.length).toBeGreaterThan(0);

      // Should include test cases from all areas
      const areas = [...new Set(fullTestSuite.testCases.map(tc => tc.area))];
      expect(areas).toContain('components');
      expect(areas).toContain('utilities');
      expect(areas).toContain('plugins');
    });
  });

  describe('Coverage Test Execution', () => {
    it('should execute individual test cases successfully', async () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('utilities');
      const testCase = testCases[0];

      expect(testCase).toBeDefined();

      // Execute the test case
      const result = await testCase.testFunction();

      expect(result).toBeDefined();
      expect(result.file).toBeDefined();
      expect(result.coverage).toBeDefined();
      expect(typeof result.coverage.statements).toBe('number');
      expect(typeof result.coverage.branches).toBe('number');
      expect(typeof result.coverage.functions).toBe('number');
      expect(typeof result.coverage.lines).toBe('number');
      expect(typeof result.executionTime).toBe('number');
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should run coverage test suite with runner', async () => {
      // Use predefined utilities suite
      const result = await runner.runTestSuite('utilities');

      expect(result).toBeDefined();
      expect(result.suite).toBeDefined();
      expect(typeof result.totalTests).toBe('number');
      expect(typeof result.passedTests).toBe('number');
      expect(typeof result.failedTests).toBe('number');
      expect(typeof result.executionTime).toBe('number');

      // The test cases should have been processed
      expect(result.totalTests).toBeGreaterThan(0);
    });
  });

  describe('Coverage Analysis and Reporting', () => {
    it('should provide detailed coverage analysis', async () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('components');
      const testCase = testCases[0];

      const result = await testCase.testFunction();

      // Verify detailed analysis
      expect(Array.isArray(result.uncoveredLines)).toBe(true);
      expect(Array.isArray(result.uncoveredBranches)).toBe(true);
      expect(Array.isArray(result.uncoveredFunctions)).toBe(true);

      // Check for recommendation generation
      if (result.issues.length > 0) {
        expect(result.issues.some(issue => issue.includes('coverage'))).toBe(true);
      }
    });

    it('should generate performance metrics', async () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('components');
      const testCase = testCases[0];

      const startTime = performance.now();
      const result = await testCase.testFunction();
      const actualTime = performance.now() - startTime;

      // Execution time should be captured
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(actualTime + 50); // Allow some variance
    });
  });

  describe('Integration with Existing Infrastructure', () => {
    it('should work with centralized mock system', async () => {
      // Verify that coverage tests use our centralized mocks
      const chart = MockFactory.createChart();
      const series = MockFactory.createSeries();

      expect(chart).toBeDefined();
      expect(series).toBeDefined();

      // Run a coverage test that should use these mocks
      const testCases = CoverageTestCases.generateTestCasesForArea('components');
      const componentTest = testCases.find(tc => tc.name.includes('Component'));

      if (componentTest) {
        const result = await componentTest.testFunction();
        expect(result.passed).toBeDefined();
      }
    });

    it('should provide actionable recommendations', async () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('utilities');

      for (const testCase of testCases.slice(0, 2)) {
        // Test first 2 cases
        const result = await testCase.testFunction();

        if (!result.passed && result.issues.length > 0) {
          // Verify recommendations are specific and actionable
          const hasSpecificRecommendation = result.issues.some(
            issue =>
              issue.includes('test') ||
              issue.includes('coverage') ||
              issue.includes('branch') ||
              issue.includes('function')
          );

          expect(hasSpecificRecommendation).toBe(true);
        }
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should validate area configurations', () => {
      COVERAGE_AREAS.forEach(area => {
        expect(area.name).toBeDefined();
        expect(area.description).toBeDefined();
        expect(area.config).toBeDefined();
        expect(typeof area.weight).toBe('number');
        expect(area.weight).toBeGreaterThan(0);
        expect(area.weight).toBeLessThanOrEqual(1);
      });
    });

    it('should have consistent threshold ranges', () => {
      COVERAGE_AREAS.forEach(area => {
        const config = area.config;

        ['global', 'perFile'].forEach(level => {
          const thresholds = config.thresholds[level as keyof typeof config.thresholds];

          expect(thresholds.statements).toBeGreaterThanOrEqual(0);
          expect(thresholds.statements).toBeLessThanOrEqual(100);
          expect(thresholds.branches).toBeGreaterThanOrEqual(0);
          expect(thresholds.branches).toBeLessThanOrEqual(100);
          expect(thresholds.functions).toBeGreaterThanOrEqual(0);
          expect(thresholds.functions).toBeLessThanOrEqual(100);
          expect(thresholds.lines).toBeGreaterThanOrEqual(0);
          expect(thresholds.lines).toBeLessThanOrEqual(100);
        });
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown coverage areas gracefully', () => {
      expect(() => {
        CoverageTestCases.generateTestCasesForArea('nonexistent-area');
      }).toThrow('Unknown coverage area: nonexistent-area');
    });

    it('should handle empty test suites', () => {
      // Test with valid area but no test cases (filtered out)
      const testSuite = CoverageTestCases.createTestSuite('Limited Test', ['components']);
      testSuite.testCases = []; // Manually empty for testing

      expect(testSuite.testCases).toHaveLength(0);
      expect(testSuite.name).toBe('Limited Test');
      expect(testSuite.config).toBeDefined();
    });

    it('should validate test case structure', () => {
      const testCases = CoverageTestCases.generateTestCasesForArea('components');

      testCases.forEach(testCase => {
        // Required fields
        expect(testCase.name).toBeTruthy();
        expect(testCase.description).toBeTruthy();
        expect(testCase.area).toBeTruthy();
        expect(testCase.targetFile).toBeTruthy();
        expect(typeof testCase.testFunction).toBe('function');

        // Optional fields should have correct types if present
        if (testCase.expectedCoverage) {
          expect(typeof testCase.expectedCoverage).toBe('object');
        }
        if (testCase.timeout) {
          expect(typeof testCase.timeout).toBe('number');
        }
        if (testCase.skip) {
          expect(typeof testCase.skip).toBe('boolean');
        }
      });
    });
  });
});
