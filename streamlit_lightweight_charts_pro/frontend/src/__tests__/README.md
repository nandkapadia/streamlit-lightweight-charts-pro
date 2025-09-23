# Frontend Test Organization

This document describes the organized test structure for the Streamlit LightWeight Charts Pro frontend.

## 📁 Directory Structure

```
src/__tests__/
├── README.md                    # This documentation
├── setup/                       # Test configuration and utilities
│   ├── testSetup.ts            # Global test setup
│   ├── mockHelpers.ts          # Shared mock utilities
│   └── jest.config.categories.js # Category-based Jest config
├── unit/                       # Unit tests (isolated functionality)
│   ├── index.test.tsx          # Main app component tests
│   └── simple.test.ts          # Basic functionality tests
├── components/                 # Component-specific tests
│   ├── ErrorBoundary.test.tsx  # Error boundary component tests
│   └── LightweightCharts.test.tsx # Main chart component tests
├── hooks/                      # Custom hooks tests
│   └── useOptimizedChart.test.ts # Chart optimization hook tests
├── utils/                      # Utility function tests
│   ├── performance.test.ts     # Performance utilities tests
│   └── seriesFactory.test.ts   # Series factory tests
├── plugins/                    # Plugin system tests
│   ├── plugins.test.ts         # General plugin tests
│   └── tooltip.test.ts         # Tooltip plugin tests
├── integration/                # Integration tests
│   └── integration.test.tsx    # Cross-component integration tests
├── e2e/                        # End-to-end tests (future)
└── services/                   # Service layer tests (future)
```

## 🧪 Test Categories

### Unit Tests (`src/__tests__/unit/`)
- **Purpose**: Test individual functions, components, or modules in isolation
- **Scope**: Single responsibility, focused testing
- **Examples**: Component rendering, utility functions, hooks behavior
- **Run**: `npm run test:unit`

### Component Tests (`src/__tests__/components/`)
- **Purpose**: Test React components with their full lifecycle
- **Scope**: Component props, state, user interactions, rendering
- **Examples**: Chart components, UI components, error boundaries
- **Run**: `npm run test:components`

### Plugin Tests (`src/__tests__/plugins/`)
- **Purpose**: Test plugin system functionality
- **Scope**: Plugin registration, lifecycle, chart integration
- **Examples**: Tooltip plugins, overlay plugins, series plugins
- **Run**: `npm run test:plugins`

### Hook Tests (`src/__tests__/hooks/`)
- **Purpose**: Test custom React hooks
- **Scope**: Hook state management, effects, return values
- **Examples**: Chart optimization hooks, data fetching hooks
- **Run**: `npm run test:hooks` (included in unit tests)

### Utility Tests (`src/__tests__/utils/`)
- **Purpose**: Test utility functions and helpers
- **Scope**: Pure functions, data transformations, calculations
- **Examples**: Series factories, performance utilities, formatters
- **Run**: `npm run test:utils` (included in unit tests)

### Integration Tests (`src/__tests__/integration/`)
- **Purpose**: Test interactions between multiple components/systems
- **Scope**: Component communication, data flow, complex workflows
- **Examples**: Chart + plugins, multi-chart sync, data processing pipelines
- **Run**: `npm run test:integration`

### End-to-End Tests (`src/__tests__/e2e/`)
- **Purpose**: Test complete user workflows (future implementation)
- **Scope**: Full application behavior, user scenarios
- **Examples**: Chart creation to export, complex interactions
- **Run**: `npm run test:e2e` (when implemented)

## 🚀 Available Test Commands

```bash
# Run all tests (watch mode)
npm test

# Run all tests once with verbose output
npm run test:all

# Run specific test categories
npm run test:unit         # Unit, hooks, and utilities
npm run test:components   # React components
npm run test:plugins      # Plugin system
npm run test:integration  # Cross-component integration

# Run with coverage report
npm run test:coverage

# Run for CI/CD (with reports)
npm run test:ci
```

## 🛠 Test Utilities & Setup

### Global Test Setup (`setup/testSetup.ts`)
Automatically loaded by Jest, provides:
- DOM mocking (ResizeObserver, IntersectionObserver, etc.)
- Canvas and rendering context mocks
- Performance API mocks
- Global error suppression for expected test errors

### Mock Helpers (`setup/mockHelpers.ts`)
Reusable mocking utilities:
- `createMockRenderData()` - Streamlit component data
- `createMockChartConfig()` - Chart configurations
- `createStreamlitMocks()` - Streamlit library mocks
- `createMockLightweightCharts()` - Chart component mocks
- `testData` - Common test datasets
- `waitForAsync()`, `advanceTimersAndWait()` - Async test helpers

### Unified Mocking System (`test-utils/lightweightChartsMocks.ts`)
Centralized mocking for LightWeight Charts library:
- Consistent chart API mocks across all tests
- `mockChart`, `mockSeries` objects
- `resetMocks()` utility for test isolation

## 📝 Writing Tests

### Test File Naming Convention
```
ComponentName.test.(ts|tsx)    # Component tests
functionName.test.ts           # Function/utility tests
featureName.test.(ts|tsx)      # Feature-based tests
integration.test.tsx           # Integration tests
```

### Basic Test Template
```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMockRenderData } from '../setup/mockHelpers';

// Import component to test
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render correctly with props', () => {
      const mockData = createMockRenderData();

      render(<MyComponent data={mockData} />);

      expect(screen.getByTestId('my-component')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle user interactions', () => {
      // Test user interactions
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // Test error scenarios
    });
  });
});
```

## 🎯 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking Strategy
- Use the unified mock system for consistent LightWeight Charts mocking
- Mock external dependencies at the module level
- Use helper functions for common mock setups

### 3. Async Testing
- Use `waitFor()` for asynchronous operations
- Use `advanceTimersAndWait()` for timer-based code
- Always await async operations in tests

### 4. Component Testing
- Test component behavior, not implementation details
- Focus on user interactions and expected outcomes
- Use data-testid attributes for reliable element selection

### 5. Coverage Goals
- Aim for >90% code coverage
- Focus on critical paths and edge cases
- Don't test third-party library code

## 🔧 Troubleshooting

### Common Issues

1. **Timer-based Tests Failing**
   ```typescript
   // Use fake timers and advance them
   jest.useFakeTimers();
   jest.advanceTimersByTime(1500);
   ```

2. **Async Operations Not Completing**
   ```typescript
   // Wait for async operations
   await waitFor(() => {
     expect(mockFunction).toHaveBeenCalled();
   });
   ```

3. **DOM Mocking Issues**
   ```typescript
   // Use the global setup or add specific mocks
   Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
     configurable: true,
     value: 600,
   });
   ```

4. **Console Warnings in Tests**
   - Expected errors are suppressed in `testSetup.ts`
   - Add new suppressions there if needed

### Debug Tips

1. **Use screen.debug()** to see rendered output:
   ```typescript
   render(<MyComponent />);
   screen.debug(); // Prints current DOM
   ```

2. **Check test coverage**:
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

3. **Run specific tests**:
   ```bash
   npm test -- --testNamePattern="specific test name"
   npm test -- --testPathPattern="ComponentName.test"
   ```

## 📊 Test Metrics

Current test statistics:
- **Total Tests**: 170+
- **Unit Tests**: ~50
- **Component Tests**: ~45
- **Plugin Tests**: ~60
- **Integration Tests**: ~25
- **Coverage**: >85% (target: >90%)

## 🔄 Continuous Improvement

### Future Enhancements
1. **E2E Testing**: Implement Playwright/Cypress tests
2. **Visual Regression**: Add screenshot comparison tests
3. **Performance Testing**: Add performance benchmark tests
4. **Accessibility Testing**: Expand a11y test coverage
5. **API Testing**: Add service layer tests

### Maintenance
- Review and update tests when adding new features
- Refactor tests when components change significantly
- Monitor test performance and optimize slow tests
- Keep mock implementations up to date with real APIs
