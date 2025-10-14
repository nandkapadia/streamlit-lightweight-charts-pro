# Changelog

All notable changes to the Streamlit Lightweight Charts Pro project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-10-15

### Added
- **React 19 Migration:**
  - Upgraded to React 19.1.1 with full concurrent features support
  - Implemented useTransition for smooth non-blocking chart updates
  - Added useOptimistic hook for instant UI feedback with server rollback
  - Integrated useActionState for advanced form state management
  - Enhanced ref patterns with automatic cleanup to prevent memory leaks
  - Added Form Actions with server integration and progressive enhancement
  - Implemented Document Metadata management for SEO optimization
  - Created comprehensive performance monitoring for React 19 concurrent features
  - Built progressive loading strategies with priority queues and asset management
  - Enhanced Suspense integration with lazy loading optimization

- **Advanced Chart Features:**
  - Multi-pane charts with integrated legends and range switchers
  - Dynamic legend functionality with real-time value updates
  - Enhanced range switcher with data timespan filtering
  - Session state management for persistent chart configurations
  - Automatic key generation for improved component lifecycle management
  - Gradient ribbon series with advanced rendering
  - Enhanced signal series implementation with improved visuals

- **Testing Infrastructure:**
  - Added Playwright E2E testing framework with visual regression tests
  - Implemented comprehensive visual testing with node-canvas
  - Created 119 visual regression tests for all series types
  - Added 108 E2E tests with browser automation
  - Enhanced test utilities with centralized mock factories
  - Added test data generators for deterministic testing
  - Implemented visual diff generation for failed tests

- **Developer Experience:**
  - Added ESLint configuration with comprehensive rules
  - Implemented pre-commit hooks for code quality enforcement
  - Created code quality scripts for automated checks
  - Enhanced documentation with architecture guides
  - Added performance monitoring and profiling tools
  - Implemented intelligent caching for chart data
  - Created background task scheduler with priority queues

- **New Components & Utilities:**
  - ChartProfiler with DevTools integration
  - ChartSuspenseWrapper for better loading states
  - ProgressiveChartLoader with priority-based loading
  - ChartFormActions with server-integrated forms
  - react19PerformanceMonitor for comprehensive tracking
  - Asset loader for intelligent resource management
  - Chart scheduler for background task processing

### Fixed
- **Test Suite Improvements:**
  - Fixed 46+ test implementation bugs across frontend test suite
  - Improved test pass rate from ~504 tests to 736/782 passing (94% pass rate)
  - Fixed color case sensitivity test expectations (lowercase hex colors)
  - Fixed logger console method spies (debug/info/warn/error)
  - Fixed React19 performance monitor console spy expectations
  - Added console.debug polyfill for Node.js test environment
  - Fixed ResizeObserverManager test environment (added jsdom pragma)
  - Fixed Jest-DOM integration for Vitest compatibility
  - Fixed Streamlit API mock lifecycle and stability
  - Fixed SeriesSettingsDialog hook mocks (added missing methods)

- **Critical Bug Fixes:**
  - Fixed padding issue causing constant chart re-rendering
  - Fixed pane collapse functionality with widget-based approach
  - Resolved chart re-initialization issues with session state
  - Fixed gradient ribbon rendering logic
  - Improved error handling and validation messages for data types
  - Fixed TypeScript compatibility issues with React 19
  - Resolved ESLint warnings for production-ready code quality

### Changed
- **Code Quality:**
  - Updated frontend test imports to use explicit Vitest imports
  - Improved mock management to preserve stable references between tests
  - Enhanced test documentation and error messages
  - Refactored series systems for better maintainability
  - Streamlined codebase by removing obsolete files
  - Improved error messages for better debugging experience
  - Enhanced TypeScript type safety across components

- **Build & Configuration:**
  - Updated Vite configuration for optimal UMD bundling
  - Enhanced package.json with new scripts and dependencies
  - Updated build configuration for Streamlit compatibility
  - Improved pre-commit workflow for better user experience
  - Optimized frontend build process with code splitting

### Removed
- Removed obsolete TrendFillRenderer and test files
- Cleaned up temporary ribbon series test harness
- Removed debug console files from production builds
- Eliminated gradient band support in favor of gradient ribbon
- Removed deprecated component implementations

## [0.1.0] - 2024-01-15

### Added
- Initial release of Streamlit Lightweight Charts Pro
- Professional-grade financial charting for Streamlit applications
- Built on TradingView's lightweight-charts library
- **Core Features:**
  - Interactive financial charts (candlestick, line, area, bar, histogram, baseline)
  - Fluent API with method chaining for intuitive chart creation
  - Multi-pane synchronized charts with multiple series
  - Advanced trade visualization with markers and P&L display
  - Comprehensive annotation system with text, arrows, and shapes
  - Responsive design with auto-sizing capabilities
- **Advanced Features:**
  - Price-volume chart combinations
  - Professional time range switchers (1D, 1W, 1M, 3M, 6M, 1Y, ALL)
  - Custom styling and theming support
  - Seamless pandas DataFrame integration
- **Developer Experience:**
  - Type-safe API with comprehensive type hints
  - 450+ unit tests with 95%+ coverage
  - Professional logging and error handling
  - CLI tools for development and deployment
  - Production-ready build system with frontend asset management
- **Performance Optimizations:**
  - Optimized React frontend with ResizeObserver
  - Efficient data serialization for large datasets
  - Bundle optimization and code splitting
- **Documentation:**
  - Comprehensive API documentation
  - Multiple usage examples and tutorials
  - Installation and setup guides

### Technical Details
- **Python Compatibility:** 3.7+
- **Dependencies:** Streamlit ≥1.0, pandas ≥1.0, numpy ≥1.19
- **Frontend:** React 18, TypeScript, TradingView Lightweight Charts 5.0
- **Build System:** Modern Python packaging with automated frontend builds
- **Testing:** pytest with comprehensive test coverage
- **Code Quality:** Black formatting, type hints, and linting compliance

### Architecture
- Bi-directional Streamlit component with Python API and React frontend
- Proper component lifecycle management and cleanup
- Theme-aware styling for light/dark mode compatibility
- Advanced height reporting with loop prevention
- Comprehensive error boundaries and logging

[0.1.4]: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/releases/tag/v0.1.4
[0.1.0]: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/releases/tag/v0.1.0
