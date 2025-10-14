/**
 * @fileoverview Coverage Test Runner
 *
 * Following TradingView's coverage testing patterns, this module provides
 * the main test runner for executing coverage tests with comprehensive
 * reporting, parallel execution, and detailed analysis.
 */

import { performance } from 'perf_hooks';

import {
  CoverageTestCase,
  CoverageResult,
  CoverageTestSuite,
  CoverageTestCases,
  COVERAGE_TEST_SUITES,
} from './coverage-test-cases';
import { CoverageThresholds, calculateWeightedCoverage, COVERAGE_AREAS } from './coverage-config';
import { logger } from '../../utils/logger';

export interface CoverageRunResult {
  suite: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalCoverage: CoverageThresholds;
  areaCoverage: Array<{ area: string; coverage: CoverageThresholds }>;
  results: CoverageResult[];
  executionTime: number;
  issues: string[];
  recommendations: string[];
}

export interface CoverageRunnerOptions {
  parallel: boolean;
  maxWorkers: number;
  timeout: number;
  verbose: boolean;
  generateReport: boolean;
  outputDir: string;
  failOnThreshold: boolean;
  includeAreas: string[];
  excludeAreas: string[];
}

const DEFAULT_RUNNER_OPTIONS: CoverageRunnerOptions = {
  parallel: true,
  maxWorkers: 4,
  timeout: 30000,
  verbose: false,
  generateReport: true,
  outputDir: 'coverage',
  failOnThreshold: true,
  includeAreas: [],
  excludeAreas: [],
};

/**
 * Coverage Test Runner - Executes coverage tests with comprehensive reporting
 */
export class CoverageRunner {
  private options: CoverageRunnerOptions;

  constructor(options: Partial<CoverageRunnerOptions> = {}) {
    this.options = { ...DEFAULT_RUNNER_OPTIONS, ...options };
  }

  /**
   * Run coverage tests for a specific test suite
   */
  async runTestSuite(suiteName: string): Promise<CoverageRunResult> {
    const startTime = performance.now();

    try {
      // Get test suite
      const suite = this.getTestSuite(suiteName);
      if (!suite) {
        throw new Error(`Test suite '${suiteName}' not found`);
      }

      this.log(`Starting coverage test suite: ${suite.name}`);
      this.log(`Description: ${suite.description}`);
      this.log(`Total test cases: ${suite.testCases.length}`);

      // Filter test cases based on options
      const filteredTestCases = this.filterTestCases(suite.testCases);
      this.log(`Filtered test cases: ${filteredTestCases.length}`);

      // Execute test cases
      const results = await this.executeTestCases(filteredTestCases);

      // Calculate coverage metrics
      const runResult = this.calculateRunResult(suite.name, results, startTime);

      // Generate report if requested
      if (this.options.generateReport) {
        await this.generateCoverageReport(runResult);
      }

      // Log summary
      this.logRunSummary(runResult);

      return runResult;
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        suite: suiteName,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalCoverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
        areaCoverage: [],
        results: [],
        executionTime,
        issues: [`Test suite execution failed: ${error}`],
        recommendations: ['Check test suite configuration and dependencies'],
      };
    }
  }

  /**
   * Run coverage tests for multiple suites
   */
  async runMultipleTestSuites(suiteNames: string[]): Promise<CoverageRunResult[]> {
    const results: CoverageRunResult[] = [];

    if (this.options.parallel && suiteNames.length > 1) {
      // Run suites in parallel
      const promises = suiteNames.map(name => this.runTestSuite(name));
      results.push(...(await Promise.all(promises)));
    } else {
      // Run suites sequentially
      for (const suiteName of suiteNames) {
        results.push(await this.runTestSuite(suiteName));
      }
    }

    return results;
  }

  /**
   * Run all available coverage test suites
   */
  async runAllTestSuites(): Promise<CoverageRunResult[]> {
    const suiteNames = Object.keys(COVERAGE_TEST_SUITES);
    return this.runMultipleTestSuites(suiteNames);
  }

  /**
   * Run coverage test for specific areas
   */
  async runAreasTest(areas: string[]): Promise<CoverageRunResult> {
    const suite = CoverageTestCases.createTestSuite(
      `Custom Areas Test: ${areas.join(', ')}`,
      areas
    );

    return this.runCustomTestSuite(suite);
  }

  /**
   * Run a custom test suite
   */
  async runCustomTestSuite(suite: CoverageTestSuite): Promise<CoverageRunResult> {
    const startTime = performance.now();

    try {
      this.log(`Starting custom coverage test suite: ${suite.name}`);

      // Execute test cases
      const results = await this.executeTestCases(suite.testCases);

      // Calculate coverage metrics
      const runResult = this.calculateRunResult(suite.name, results, startTime);

      return runResult;
    } catch (error) {
      const executionTime = performance.now() - startTime;

      return {
        suite: suite.name,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        totalCoverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
        areaCoverage: [],
        results: [],
        executionTime,
        issues: [`Custom test suite execution failed: ${error}`],
        recommendations: ['Check test suite configuration'],
      };
    }
  }

  /**
   * Get test suite by name
   */
  private getTestSuite(suiteName: string): CoverageTestSuite | null {
    const suiteFactory = COVERAGE_TEST_SUITES[suiteName as keyof typeof COVERAGE_TEST_SUITES];
    return suiteFactory ? suiteFactory() : null;
  }

  /**
   * Filter test cases based on runner options
   */
  private filterTestCases(testCases: CoverageTestCase[]): CoverageTestCase[] {
    let filtered = testCases.filter(testCase => !testCase.skip);

    // Filter by included areas
    if (this.options.includeAreas.length > 0) {
      filtered = filtered.filter(testCase => this.options.includeAreas.includes(testCase.area));
    }

    // Filter by excluded areas
    if (this.options.excludeAreas.length > 0) {
      filtered = filtered.filter(testCase => !this.options.excludeAreas.includes(testCase.area));
    }

    return filtered;
  }

  /**
   * Execute test cases with optional parallelization
   */
  private async executeTestCases(testCases: CoverageTestCase[]): Promise<CoverageResult[]> {
    const results: CoverageResult[] = [];

    if (this.options.parallel && testCases.length > 1) {
      // Execute in parallel with worker limit
      const chunks = this.chunkArray(testCases, this.options.maxWorkers);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(testCase => this.executeTestCase(testCase));
        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }
    } else {
      // Execute sequentially
      for (const testCase of testCases) {
        results.push(await this.executeTestCase(testCase));
      }
    }

    return results;
  }

  /**
   * Execute a single test case
   */
  private async executeTestCase(testCase: CoverageTestCase): Promise<CoverageResult> {
    const timeout = testCase.timeout || this.options.timeout;

    this.log(`Executing: ${testCase.name} (${testCase.targetFile})`);

    try {
      // Execute with timeout
      const result = (await Promise.race([
        testCase.testFunction(),
        this.createTimeoutPromise(timeout, testCase.name),
      ])) as CoverageResult;

      this.log(`Completed: ${testCase.name} - ${result.passed ? 'PASSED' : 'FAILED'}`);

      return result;
    } catch (error) {
      this.log(`Failed: ${testCase.name} - ${error}`);

      return {
        file: testCase.targetFile,
        coverage: { statements: 0, branches: 0, functions: 0, lines: 0 },
        uncoveredLines: [],
        uncoveredBranches: [],
        uncoveredFunctions: [],
        executionTime: timeout,
        passed: false,
        issues: [`Test execution failed: ${error}`],
      };
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise<T>(timeout: number, testName: string): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test '${testName}' timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Calculate run result from individual test results
   */
  private calculateRunResult(
    suiteName: string,
    results: CoverageResult[],
    startTime: number
  ): CoverageRunResult {
    const executionTime = performance.now() - startTime;

    // Count test results
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;
    const skippedTests = 0; // We don't have skipped tests in current results

    // Calculate coverage by area
    const areaCoverage = this.calculateAreaCoverage(results);

    // Calculate weighted total coverage
    const totalCoverage = calculateWeightedCoverage(areaCoverage);

    // Collect issues and recommendations
    const allIssues = results.flatMap(r => r.issues);
    const issues = Array.from(new Set(allIssues)); // Remove duplicates

    const recommendations = this.generateRecommendations(results, areaCoverage);

    return {
      suite: suiteName,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      totalCoverage,
      areaCoverage,
      results,
      executionTime,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate coverage by area
   */
  private calculateAreaCoverage(
    results: CoverageResult[]
  ): Array<{ area: string; coverage: CoverageThresholds }> {
    const areaResults = new Map<string, CoverageResult[]>();

    // Group results by area (inferred from file path)
    results.forEach(result => {
      const area = this.inferAreaFromFile(result.file);
      if (!areaResults.has(area)) {
        areaResults.set(area, []);
      }
      areaResults.get(area)!.push(result);
    });

    // Calculate average coverage for each area
    const areaCoverage: Array<{ area: string; coverage: CoverageThresholds }> = [];

    areaResults.forEach((areaResultList, area) => {
      const avgCoverage = this.averageCoverage(areaResultList.map(r => r.coverage));
      areaCoverage.push({ area, coverage: avgCoverage });
    });

    return areaCoverage;
  }

  /**
   * Infer area from file path
   */
  private inferAreaFromFile(filePath: string): string {
    if (filePath.includes('/components/') || filePath.includes('/hooks/')) return 'components';
    if (filePath.includes('/utils/')) return 'utilities';
    if (filePath.includes('/plugins/')) return 'plugins';
    if (filePath.includes('/types/')) return 'types';
    return 'other';
  }

  /**
   * Calculate average coverage from multiple coverage results
   */
  private averageCoverage(coverages: CoverageThresholds[]): CoverageThresholds {
    if (coverages.length === 0) {
      return { statements: 0, branches: 0, functions: 0, lines: 0 };
    }

    const totals = coverages.reduce(
      (sum, coverage) => ({
        statements: sum.statements + coverage.statements,
        branches: sum.branches + coverage.branches,
        functions: sum.functions + coverage.functions,
        lines: sum.lines + coverage.lines,
      }),
      { statements: 0, branches: 0, functions: 0, lines: 0 }
    );

    const count = coverages.length;

    return {
      statements: Math.round(totals.statements / count),
      branches: Math.round(totals.branches / count),
      functions: Math.round(totals.functions / count),
      lines: Math.round(totals.lines / count),
    };
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    results: CoverageResult[],
    areaCoverage: Array<{ area: string; coverage: CoverageThresholds }>
  ): string[] {
    const recommendations: string[] = [];

    // Analyze overall performance
    const failedResults = results.filter(r => !r.passed);
    if (failedResults.length > results.length * 0.2) {
      recommendations.push(
        'High failure rate detected. Review test configurations and dependencies.'
      );
    }

    // Analyze area-specific coverage
    areaCoverage.forEach(({ area, coverage }) => {
      const areaConfig = COVERAGE_AREAS.find(a => a.name === area);
      if (areaConfig) {
        const threshold = areaConfig.config.thresholds.global;

        if (coverage.statements < threshold.statements) {
          recommendations.push(
            `Improve statement coverage in ${area} area (current: ${coverage.statements}%, target: ${threshold.statements}%)`
          );
        }
        if (coverage.branches < threshold.branches) {
          recommendations.push(
            `Add more branch tests in ${area} area (current: ${coverage.branches}%, target: ${threshold.branches}%)`
          );
        }
      }
    });

    // Analyze execution performance
    const slowTests = results.filter(r => r.executionTime > 5000); // > 5 seconds
    if (slowTests.length > 0) {
      recommendations.push(
        `${slowTests.length} tests are running slowly. Consider optimizing test execution or increasing timeout.`
      );
    }

    return recommendations;
  }

  /**
   * Generate coverage report
   */
  private async generateCoverageReport(runResult: CoverageRunResult): Promise<void> {
    // In a real implementation, this would generate HTML/JSON/XML reports
    // For now, we'll create a simple summary
    const reportData = {
      suite: runResult.suite,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: runResult.totalTests,
        passedTests: runResult.passedTests,
        failedTests: runResult.failedTests,
        executionTime: runResult.executionTime,
      },
      coverage: {
        total: runResult.totalCoverage,
        byArea: runResult.areaCoverage,
      },
      issues: runResult.issues,
      recommendations: runResult.recommendations,
    };

    this.log(`Coverage report generated: ${JSON.stringify(reportData, null, 2)}`);
  }

  /**
   * Log run summary
   */
  private logRunSummary(runResult: CoverageRunResult): void {
    if (runResult.issues.length > 0) {
      logger.info(`Found ${runResult.issues.length} coverage issues`, 'CoverageRunner');
    }

    if (runResult.recommendations.length > 0) {
      logger.info(
        `Generated ${runResult.recommendations.length} recommendations`,
        'CoverageRunner'
      );
    }
  }

  /**
   * Utility method for logging
   */
  private log(message: string): void {
    if (this.options.verbose) {
      logger.debug(message, 'CoverageRunner');
    }
  }

  /**
   * Utility method to chunk array for parallel processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

/**
 * Convenience functions for running coverage tests
 */

/**
 * Run full coverage test suite
 */
export async function runFullCoverage(
  options?: Partial<CoverageRunnerOptions>
): Promise<CoverageRunResult> {
  const runner = new CoverageRunner({ verbose: true, ...options });
  return runner.runTestSuite('full');
}

/**
 * Run core coverage test suite
 */
export async function runCoreCoverage(
  options?: Partial<CoverageRunnerOptions>
): Promise<CoverageRunResult> {
  const runner = new CoverageRunner({ verbose: true, ...options });
  return runner.runTestSuite('core');
}

/**
 * Run coverage for specific areas
 */
export async function runAreasCoverage(
  areas: string[],
  options?: Partial<CoverageRunnerOptions>
): Promise<CoverageRunResult> {
  const runner = new CoverageRunner({ verbose: true, ...options });
  return runner.runAreasTest(areas);
}
