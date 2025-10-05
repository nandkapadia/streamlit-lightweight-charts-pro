/**
 * @fileoverview Coverage Test Configuration
 *
 * Following TradingView's coverage testing patterns, this module provides
 * comprehensive configuration for automated coverage measurement and reporting
 * across the entire codebase with configurable thresholds and detailed analysis.
 */

export interface CoverageThresholds {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface CoverageConfig {
  // Coverage thresholds (percentage)
  thresholds: {
    global: CoverageThresholds;
    perFile: CoverageThresholds;
  };

  // File patterns
  include: string[];
  exclude: string[];

  // Reporting options
  reporters: string[];
  outputDir: string;

  // Analysis options
  enableBranchAnalysis: boolean;
  enableFunctionAnalysis: boolean;
  enableLineAnalysis: boolean;
  enableUncoveredAnalysis: boolean;

  // Performance options
  parallel: boolean;
  maxWorkers: number;
  timeout: number;

  // Integration options
  collectFromDependencies: boolean;
  skipCoverageForTests: boolean;
  instrumentationOptions: {
    compact: boolean;
    esModules: boolean;
    preserveComments: boolean;
  };
}

export const DEFAULT_COVERAGE_CONFIG: CoverageConfig = {
  thresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    perFile: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },

  include: ['src/**/*.{ts,tsx}'],

  exclude: [
    'src/**/*.d.ts',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/__tests__/**',
    'src/__mocks__/**',
    'src/test-utils/**',
    'src/setupTests.ts',
    'src/**/types/**',
    'src/**/constants/**',
  ],

  reporters: ['text', 'html', 'json', 'lcov'],
  outputDir: 'coverage',

  enableBranchAnalysis: true,
  enableFunctionAnalysis: true,
  enableLineAnalysis: true,
  enableUncoveredAnalysis: true,

  parallel: true,
  maxWorkers: 4,
  timeout: 30000,

  collectFromDependencies: false,
  skipCoverageForTests: true,

  instrumentationOptions: {
    compact: false,
    esModules: true,
    preserveComments: false,
  },
};

export const COVERAGE_PRESETS = {
  /**
   * Strict coverage requirements for production code
   */
  strict: (): CoverageConfig => ({
    ...DEFAULT_COVERAGE_CONFIG,
    thresholds: {
      global: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
      perFile: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  }),

  /**
   * Moderate coverage requirements for development
   */
  moderate: (): CoverageConfig => ({
    ...DEFAULT_COVERAGE_CONFIG,
    thresholds: {
      global: {
        statements: 75,
        branches: 70,
        functions: 75,
        lines: 75,
      },
      perFile: {
        statements: 65,
        branches: 60,
        functions: 65,
        lines: 65,
      },
    },
  }),

  /**
   * Lenient coverage requirements for legacy code
   */
  lenient: (): CoverageConfig => ({
    ...DEFAULT_COVERAGE_CONFIG,
    thresholds: {
      global: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
      perFile: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
  }),

  /**
   * Component-specific coverage for React components
   */
  components: (): CoverageConfig => ({
    ...DEFAULT_COVERAGE_CONFIG,
    include: ['src/components/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}'],
    thresholds: {
      global: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
      perFile: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  }),

  /**
   * Utilities and services coverage
   */
  utilities: (): CoverageConfig => ({
    ...DEFAULT_COVERAGE_CONFIG,
    include: ['src/utils/**/*.{ts,tsx}', 'src/services/**/*.{ts,tsx}'],
    thresholds: {
      global: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
      perFile: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  }),

  /**
   * Plugin and extension coverage
   */
  plugins: (): CoverageConfig => ({
    ...DEFAULT_COVERAGE_CONFIG,
    include: ['src/plugins/**/*.{ts,tsx}'],
    thresholds: {
      global: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
      perFile: {
        statements: 75,
        branches: 65,
        functions: 75,
        lines: 75,
      },
    },
  }),
};

export interface CoverageArea {
  name: string;
  description: string;
  config: CoverageConfig;
  weight: number; // For weighted coverage calculation
}

export const COVERAGE_AREAS: CoverageArea[] = [
  {
    name: 'components',
    description: 'React components and hooks',
    config: COVERAGE_PRESETS.components(),
    weight: 0.3,
  },
  {
    name: 'utilities',
    description: 'Utility functions and services',
    config: COVERAGE_PRESETS.utilities(),
    weight: 0.25,
  },
  {
    name: 'plugins',
    description: 'Chart plugins and extensions',
    config: COVERAGE_PRESETS.plugins(),
    weight: 0.15,
  },
  {
    name: 'types',
    description: 'Type definitions and interfaces',
    config: {
      ...DEFAULT_COVERAGE_CONFIG,
      include: ['src/types/**/*.{ts,tsx}'],
      thresholds: {
        global: { statements: 100, branches: 100, functions: 100, lines: 100 },
        perFile: { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
    weight: 0.1,
  },
];

/**
 * Get coverage configuration for specific area
 */
export function getCoverageConfig(area: string): CoverageConfig {
  const coverageArea = COVERAGE_AREAS.find(a => a.name === area);
  return coverageArea ? coverageArea.config : DEFAULT_COVERAGE_CONFIG;
}

/**
 * Get coverage configuration for multiple areas
 */
export function getMergedCoverageConfig(areas: string[]): CoverageConfig {
  const configs = areas.map(area => getCoverageConfig(area));

  // Merge include patterns
  const include = Array.from(new Set(configs.flatMap(c => c.include)));

  // Use the strictest thresholds
  const globalThresholds = configs.reduce(
    (acc, config) => ({
      statements: Math.max(acc.statements, config.thresholds.global.statements),
      branches: Math.max(acc.branches, config.thresholds.global.branches),
      functions: Math.max(acc.functions, config.thresholds.global.functions),
      lines: Math.max(acc.lines, config.thresholds.global.lines),
    }),
    { statements: 0, branches: 0, functions: 0, lines: 0 }
  );

  return {
    ...DEFAULT_COVERAGE_CONFIG,
    include,
    thresholds: {
      global: globalThresholds,
      perFile: DEFAULT_COVERAGE_CONFIG.thresholds.perFile,
    },
  };
}

/**
 * Calculate weighted coverage score
 */
export function calculateWeightedCoverage(
  areaCoverages: Array<{ area: string; coverage: CoverageThresholds }>
): CoverageThresholds {
  const totalWeight = COVERAGE_AREAS.reduce((sum, area) => sum + area.weight, 0);

  return areaCoverages.reduce(
    (weighted, { area, coverage }) => {
      const areaConfig = COVERAGE_AREAS.find(a => a.name === area);
      const weight = areaConfig ? areaConfig.weight / totalWeight : 0;

      return {
        statements: weighted.statements + coverage.statements * weight,
        branches: weighted.branches + coverage.branches * weight,
        functions: weighted.functions + coverage.functions * weight,
        lines: weighted.lines + coverage.lines * weight,
      };
    },
    { statements: 0, branches: 0, functions: 0, lines: 0 }
  );
}
