/**
 * Jest configuration for running tests by category
 * This allows running specific test suites: npm test -- --config=src/__tests__/jest.config.categories.js --testNamePattern="Unit Tests"
 */

const baseConfig = require('./package.json').jest;

module.exports = {
  ...baseConfig,

  // Test categories
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: [
        '<rootDir>/src/__tests__/unit/**/*.test.(ts|tsx)',
        '<rootDir>/src/__tests__/utils/**/*.test.(ts|tsx)',
        '<rootDir>/src/__tests__/hooks/**/*.test.(ts|tsx)',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/testSetup.ts'],
    },
    {
      displayName: 'Component Tests',
      testMatch: [
        '<rootDir>/src/__tests__/components/**/*.test.(ts|tsx)',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/testSetup.ts'],
    },
    {
      displayName: 'Plugin Tests',
      testMatch: [
        '<rootDir>/src/__tests__/plugins/**/*.test.(ts|tsx)',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/testSetup.ts'],
    },
    {
      displayName: 'Integration Tests',
      testMatch: [
        '<rootDir>/src/__tests__/integration/**/*.test.(ts|tsx)',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/testSetup.ts'],
    },
    {
      displayName: 'E2E Tests',
      testMatch: [
        '<rootDir>/src/__tests__/e2e/**/*.test.(ts|tsx)',
      ],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/testSetup.ts'],
    },
  ],
};