# 🧪 Testing Infrastructure Improvement Strategy

## 📊 Current State Analysis

### Coverage Metrics (Critical Issues)
- **Overall Coverage**: 9.05% (Target: 80%+)
- **Statement Coverage**: 9.05%
- **Branch Coverage**: 10.64%
- **Function Coverage**: 8.38%
- **Line Coverage**: 9.4%

### Test Failure Summary
- **Failed Tests**: 7/27 test suites
- **Main Issues**: Performance monitoring, mocking, async patterns
- **Critical Components**: Almost entirely untested

## 🎯 Infrastructure Improvement Plan

### **Phase 1: Foundation Fixes (Week 1)**

#### Immediate Test Fixes
```bash
# Fix failing performance tests
npm test src/utils/__tests__/performance.test.ts
```

**Key Issues to Address:**
1. **Performance Mock Issues**: Performance.now() mocking failures
2. **Async Test Patterns**: Proper async/await handling
3. **Mock Configuration**: LightweightCharts mock alignment

#### Test Environment Enhancement
```javascript
// Enhanced jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Enhanced coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/react-app-env.d.ts',
    '!src/setupTests.ts',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/__mocks__/**'
  ],

  // Stricter coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    './src/utils/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Enhanced test matching
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],

  // Better error reporting
  errorOnDeprecated: true,
  verbose: true,
  testTimeout: 15000
};
```

### **Phase 2: Critical Component Testing (Week 2-3)**

#### Priority Test Coverage Areas

**1. Core Chart Components (0% → 70%)**
- `LightweightCharts.tsx` (Currently 15.08%)
- `ChartSeriesManager.tsx` (Currently 0%)
- `ChartSyncManager.tsx` (Currently 0%)

**2. Primitive System (1.67% → 60%)**
- `ButtonPrimitive.ts` (Currently 0%)
- `LegendPrimitive.ts` (Currently 1.07%)
- `RangeSwitcherPrimitive.ts` (Currently 0.45%)

**3. Service Layer (4.86% → 65%)**
- `ChartCoordinateService.ts` (Currently 1.97%)
- `ChartPrimitiveManager.ts` (Currently 1.28%)
- `SeriesConfigurationService.ts` (Currently 0%)

#### Enhanced Mock Strategy
```typescript
// src/__mocks__/enhanced-lightweight-charts.ts
export const mockChart = {
  addAreaSeries: jest.fn(() => mockSeries),
  addLineSeries: jest.fn(() => mockSeries),
  addCandlestickSeries: jest.fn(() => mockSeries),
  addHistogramSeries: jest.fn(() => mockSeries),
  timeScale: jest.fn(() => mockTimeScale),
  priceScale: jest.fn(() => mockPriceScale),
  subscribeCrosshairMove: jest.fn(),
  unsubscribeCrosshairMove: jest.fn(),
  subscribeClick: jest.fn(),
  unsubscribeClick: jest.fn(),
  resize: jest.fn(),
  remove: jest.fn(),
  applyOptions: jest.fn(),
  options: jest.fn(() => ({}))
};

export const createChart = jest.fn(() => mockChart);
```

### **Phase 3: Advanced Testing Patterns (Week 4)**

#### Integration Testing Framework
```typescript
// src/__tests__/integration/chartIntegration.test.tsx
describe('Chart Integration Tests', () => {
  it('should handle complete chart lifecycle', async () => {
    const { container } = render(
      <LightweightCharts
        data={mockData}
        options={mockOptions}
      />
    );

    // Test mounting
    await waitFor(() => {
      expect(container.querySelector('.tv-lightweight-charts')).toBeTruthy();
    });

    // Test data updates
    rerender(<LightweightCharts data={updatedData} options={mockOptions} />);

    // Test unmounting
    unmount();
    expect(mockChart.remove).toHaveBeenCalled();
  });
});
```

#### Performance Testing Suite
```typescript
// src/__tests__/performance/chartPerformance.test.ts
describe('Chart Performance Tests', () => {
  it('should render large datasets efficiently', async () => {
    const largeDataset = generateMockData(10000);
    const startTime = performance.now();

    render(<LightweightCharts data={largeDataset} />);

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(1000); // 1 second max
  });

  it('should handle rapid updates without memory leaks', () => {
    const component = render(<LightweightCharts />);

    for (let i = 0; i < 100; i++) {
      component.rerender(<LightweightCharts data={generateMockData(100)} />);
    }

    // Memory usage assertions
    expect(mockChart.remove).not.toHaveBeenCalled();
  });
});
```

### **Phase 4: Quality Automation (Week 5-6)**

#### Test Automation Scripts
```json
// package.json additions
{
  "scripts": {
    "test:unit": "react-scripts test --watchAll=false",
    "test:integration": "react-scripts test --watchAll=false src/__tests__/integration",
    "test:performance": "react-scripts test --watchAll=false src/__tests__/performance",
    "test:coverage": "npm run test:unit -- --coverage",
    "test:coverage:watch": "npm run test:unit -- --coverage --watch",
    "test:ci": "npm run test:coverage && npm run test:integration",
    "test:mutation": "stryker run",
    "test:visual": "chromatic --build-script-name=build:storybook"
  }
}
```

#### Continuous Integration Enhancement
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Test performance benchmarks
        run: npm run test:performance
```

## 🛠️ Implementation Roadmap

### **Week 1: Foundation**
- [ ] Fix 7 failing tests
- [ ] Enhance Jest configuration
- [ ] Improve mock setup
- [ ] Add error boundaries for tests

### **Week 2-3: Core Coverage**
- [ ] Write comprehensive tests for `LightweightCharts.tsx`
- [ ] Test all primitive components
- [ ] Cover service layer functionality
- [ ] Add plugin system tests

### **Week 4: Advanced Patterns**
- [ ] Integration test suite
- [ ] Performance testing framework
- [ ] Visual regression tests
- [ ] E2E test foundation

### **Week 5-6: Automation**
- [ ] CI/CD pipeline enhancement
- [ ] Automated coverage reporting
- [ ] Mutation testing setup
- [ ] Performance benchmarking

## 📈 Success Metrics

### Coverage Targets
| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| **Overall** | 9.05% | 80% | 🔴 Critical |
| **Utils** | 15.34% | 90% | 🟡 High |
| **Services** | 4.86% | 75% | 🔴 Critical |
| **Primitives** | 1.67% | 70% | 🔴 Critical |
| **Plugins** | 8.79% | 65% | 🟡 Medium |

### Quality Gates
- [ ] All tests pass (currently 7 failing)
- [ ] Coverage > 80% overall
- [ ] No critical performance regressions
- [ ] Integration tests cover key user flows
- [ ] Memory leak tests pass

## 🔧 Tools & Dependencies

### Testing Libraries Enhancement
```bash
# Additional testing tools
npm install --save-dev \
  @testing-library/user-event@^14.5.0 \
  @testing-library/jest-dom@^6.8.0 \
  jest-performance-testing \
  stryker-cli \
  chromatic \
  jest-canvas-mock \
  resize-observer-polyfill
```

### Development Tools
- **Visual Testing**: Chromatic for component screenshots
- **Mutation Testing**: Stryker for test quality validation
- **Performance**: Jest performance testing utilities
- **Accessibility**: @testing-library/jest-dom a11y matchers

## 🚨 Risk Mitigation

### Test Reliability
- **Flaky Test Detection**: Retry failed tests 3x
- **Async Testing**: Proper async/await patterns
- **Mock Stability**: Comprehensive mock verification

### Performance Impact
- **Test Execution Time**: Target <30s for full suite
- **CI/CD Integration**: Parallel test execution
- **Resource Usage**: Memory and CPU monitoring

## 📋 Immediate Action Items

### Phase 1 Implementation (Next 3 Days)
1. **Fix Performance Tests**
   - Debug performance.now() mocking issues
   - Fix async test patterns
   - Verify mock configurations

2. **Enhanced Test Configuration**
   - Update jest.config.js with stricter thresholds
   - Add better error reporting
   - Configure coverage exclusions

3. **Mock Infrastructure**
   - Enhance LightweightCharts mocks
   - Add performance mock utilities
   - Create reusable test helpers

This strategy addresses the critical 9.05% test coverage issue and establishes a robust testing foundation for the React 19 migration and ongoing development.