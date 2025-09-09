# Changelog

All notable changes to the Streamlit Lightweight Charts Pro project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/releases/tag/v0.1.0
