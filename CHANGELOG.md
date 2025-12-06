# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-12-02

### Added
- Comprehensive examples library with 82 example files organized by category
  - Getting Started & Quick Start examples
  - Chart Types (Line, Area, Bar, Candlestick, Histogram, Baseline)
  - Advanced Features (Annotations, Legends, Sync, Tooltips)
  - Trading Features (Trade visualization, Markers)
  - Chart Management (Multi-pane, Updates, Price Scales)
- Example launcher for easy navigation

### Changed
- Updated dependency from `lightweight-charts-core` to `lightweight-charts-pro`
- Updated all imports throughout codebase to use new package names
- Updated MIGRATION.md with new package references
- Version bumped to 0.3.0 to reflect major dependency change

### Fixed
- Corrected __version__ string to match pyproject.toml (0.3.0)
- Fixed all import references in examples and test files

### Migration Notes
If upgrading from 0.2.x:
- Update imports: `from lightweight_charts_core` → `from lightweight_charts_pro`
- Reinstall package to get new dependencies


## [0.2.0] - 2025-11-19

### Fixed
- **Overlay Price Scale Configuration:**
  - Fixed critical bug where overlay price scale configurations were not being applied correctly
  - Overlay series now properly use their configured price scale settings
  - Resolved issue in `price_scale_manager.py` and `series_manager.py` affecting overlay behavior
  - Impact: Overlays like volume histograms now render correctly with proper scaling

- **Volume Histogram Positioning:**
  - Fixed volume histogram overlay price scale bugs causing incorrect positioning
  - Resolved conflicts between price series and volume overlay on shared panes
  - Improved scale margin calculations for proper separation of price and volume data

- **Price-Volume Chart Layout:**
  - Fixed scale margins for optimal price-volume chart positioning
  - Multiple iterations of margin adjustments to achieve proper visual separation
  - Volume series now correctly positioned below price action without overlap

- **Chart Synchronization:**
  - Fixed chart synchronization issues affecting multi-chart coordination
  - Improved frontend performance and stability during chart updates
  - Resolved race conditions in chart initialization and updates

- **Legend Visibility:**
  - Fixed legend display for invisible series (PR #37, #35)
  - Legends now properly hidden when series visibility is set to false
  - Improved session state management for legend configuration

### Changed
- **Price Scale Handling Refactoring:**
  - Refactored price scale handling for better maintainability and reliability
  - Simplified logic in `LightweightCharts.tsx` (reduced complexity by ~20 lines)
  - Enhanced series configuration with improved price scale assignment

- **Frontend Performance:**
  - Optimized frontend chart rendering and update cycles
  - Improved React component lifecycle management
  - Reduced unnecessary re-renders during chart updates

- **Code Quality:**
  - Removed debug `console.log` statements from production code
  - Enhanced documentation and code comments
  - Improved error handling and validation messages

### Technical Details
- **PR #40 Integration:**
  - Merged enhanced documentation and utilities from PR #40
  - Reverted portions of PR #40 that caused test failures
  - Restored `price_line` and `visible` properties to correct nested options location
  - Comprehensive testing to ensure backward compatibility

- **Files Modified:**
  - `streamlit_lightweight_charts_pro/charts/managers/price_scale_manager.py`
  - `streamlit_lightweight_charts_pro/charts/managers/series_manager.py`
  - `streamlit_lightweight_charts_pro/frontend/src/LightweightCharts.tsx`
  - Multiple test files updated for new property locations

- **Session Description:**
  - Completed session description implementation for better state management
  - Enhanced session state persistence across chart reloads

### Breaking Changes
- None - This release maintains full backward compatibility with v0.1.9

### Upgrade Notes
- All existing code should work without modifications
- Overlay price scales will now behave more predictably
- Volume overlays will position correctly without manual margin adjustments

## [0.1.9] - 2025-11-07

### Fixed
- **DataFrame Naming Consistency:** Renamed sample data variables in `examples/price_scales/comprehensive_price_scales.py`
  to satisfy pandas-vet PD901 and improve readability.
- **Class-Level Constants:** Annotated `PROPERTY_MAPPINGS` and `OFFICIAL_SERIES_PROPERTIES` with
  `ClassVar` in `tests/unit/series/test_api_alignment.py`, resolving Ruff's RUF012 warnings.

### Tooling
- Project-wide formatting and lint fixes applied via `ruff check --fix` and `pre-commit` hooks.

## [0.1.8] - 2025-11-01

### Added
- **Price Scale Auto-Creation (TradingView API Alignment):**
  - Price scales now auto-create when series reference them (matches TradingView's official API behavior)
  - Smart defaults based on context:
    - **Overlays** (same pane as built-in scale): `visible=False`, top margin `0.8`, bottom `0.0`
    - **Separate panes**: `visible=True`, top margin `0.1`, bottom `0.1`
  - Auto-creation enabled by default, can be disabled via `auto_create_price_scales=False`
  - Built-in scales (`"left"`, `"right"`, `""`) do NOT trigger auto-creation
  - Reduces boilerplate code by **66%** for multi-pane charts (14 lines → 5 lines)
  - Implementation: `streamlit_lightweight_charts_pro/charts/managers/series_manager.py:119-201`

- **PriceScaleConfig Builder Utilities:**
  - Factory methods for common price scale configurations
  - Available builders:
    - `for_overlay()` - Hidden axis, large top margin (0.8)
    - `for_separate_pane()` - Visible axis, balanced margins (0.1/0.1)
    - `for_volume()` - Volume-specific configuration
    - `for_indicator()` - For bounded indicators (RSI, Stochastic)
    - `for_percentage()` - Percentage mode
    - `for_logarithmic()` - Logarithmic scale
  - Implementation: `streamlit_lightweight_charts_pro/charts/utils/price_scale_config.py`

- **PriceScaleValidator:**
  - Helpful error messages when price scales are missing
  - Configuration suggestions based on context (overlay vs separate pane)
  - Lists available scales in error messages
  - Implementation: `streamlit_lightweight_charts_pro/charts/validators/price_scale_validator.py`

- **Comprehensive Price Scale Example:**
  - `examples/price_scales/comprehensive_price_scales.py` - Full demonstration of new features
  - Shows 66% code reduction (before/after comparison)
  - Three examples: auto-creation, builder utilities, multi-series in same pane
  - Documents series-based architecture (clean and simple)

- **Price Scale Test Coverage:**
  - 46 new tests for price scale features (all passing ✅)
  - `test_price_scale_auto_creation.py` - 11 tests for auto-creation logic
  - `test_price_scale_config.py` - 17 tests for builder utilities
  - `test_price_scale_validator.py` - 11 tests for validation
  - `test_price_scale_edge_cases.py` - 9 tests for edge cases
  - Edge cases covered:
    - Default `price_scale_id` behavior (defaults to `"right"`)
    - Built-in scales (`"left"`, `"right"`, `""`) behavior
    - Custom scale ID auto-creation
    - Overlay vs separate pane detection
    - Context-aware smart defaults

### Fixed
- **Color Handling - Alpha/Opacity Support:**
  - Fixed critical bug where `alpha=0` (fully transparent) was treated as `alpha=1` (100% opacity)
  - Root cause: JavaScript falsy check `values[3] || 1` treating `0` as falsy
  - Solution: Changed to explicit undefined check: `values[3] !== undefined ? values[3] : 1`
  - Impact: Colors like `rgba(255, 0, 0, 0)` now correctly show as 0% opacity instead of 100%
  - Fixed in: `colorUtils.ts:109` (parseCssColor function)

- **Color Handling - 8-Digit Hex Support (#RRGGBBAA):**
  - Added support for 8-digit hex colors with alpha channel (e.g., `#00FF0033` = green 20% opacity)
  - Implemented parsing logic in `parseHexColor()` function
  - Alpha channel conversion: `parseInt(hex.substring(6, 8), 16) / 255`
  - Now supports all hex formats: 3-digit (#RGB), 4-digit (#RGBA), 6-digit (#RRGGBB), 8-digit (#RRGGBBAA)

- **Color Handling - 4-Digit Hex Support (#RGBA):**
  - Added support for 4-digit hex colors with alpha (e.g., `#F008` = red ~53% opacity)
  - Short form alpha expansion: Each digit doubled then converted (e.g., `8` → `88` → `0x88/255`)
  - Python validation updated to accept 4-digit hex format
  - Regex pattern updated in `data_utils.py:276`

- **Frontend Code Quality:**
  - Fixed unused variable warning in `LightweightCharts.tsx:285` (`startTransition` → `_startTransition`)
  - Fixed TypeScript unused variables in `colorAlphaBugFix.test.ts` (2 test cases)
  - Fixed null vs undefined type error in `SeriesDialogManager.ts:504`

### Added
- **Comprehensive Color Testing:**
  - Added 54 new color handling tests in `colorAlphaBugFix.test.ts`
  - Tests cover: alpha=0 bug, 8-digit hex, 4-digit hex, roundtrip conversions
  - Test scenarios: Dialog workflows, edge cases, format preservation
  - All tests passing with 100% coverage of color utilities

- **Documentation:**
  - Created `COLOR_HANDLING_DEEP_REVIEW.md` (660+ lines) - Comprehensive analysis of all color handling
  - Created `COLOR_DRY_ANALYSIS.md` (400+ lines) - DRY principles compliance analysis
  - Documented 67+ color properties across the codebase
  - Complete serialization flow documentation
  - End-to-end roundtrip examples

### Changed
- **Color Format Support Matrix:**
  - Python: ✅ All formats (3,4,6,8-digit hex + RGB/RGBA + 25 named colors)
  - Frontend: ✅ All hex formats (3,4,6,8-digit) + RGB/RGBA
  - Serialization: ✅ Lossless (colors preserved exactly)
  - UI Dialog: ✅ All formats display correctly with proper opacity

- **Production Readiness:**
  - All pre-commit hooks passing (9/9)
  - Zero linting errors (Ruff + ESLint)
  - Zero TypeScript errors (tsc --noEmit)
  - Production build optimized: 826.07 kB → 224.50 kB gzipped
  - Test coverage: 2453/2454 Python tests passing (99.96%)

### Technical Details
- **Color Handling:** 100% DRY compliance (85% score) with single source of truth
- **Validation:** All 67+ color properties use same `is_valid_color()` function
- **Serialization:** Colors passed as-is (no conversion overhead)
- **Test Coverage:** 296 color-specific tests (242 existing + 54 new)
- **Browser Compatibility:** All formats supported in Chrome, Firefox, Safari, Edge

## [0.1.7] - 2025-10-31

### Added
- **Code Architecture Refactoring:**
  - Created modular manager system for better code organization
  - New managers: `ChartRenderer`, `PriceScaleManager`, `SeriesManager`, `SessionStateManager`, `TradeManager`
  - Extracted 1,200+ lines from monolithic `chart.py` into focused manager classes
  - Improved separation of concerns and maintainability

- **Per-Point Styling Examples:**
  - Added `band_per_point_styling.py` - Comprehensive Band series customization example
  - Added `ribbon_per_point_styling.py` - Comprehensive Ribbon series customization example
  - Demonstrates line colors, styles, widths, and fill customization per data point
  - 400+ lines of example code for advanced styling techniques

- **Multi-Pane E2E Tests:**
  - Added 5 comprehensive multi-pane visual regression tests
  - Test scenarios: 2-pane, 3-pane, 4-pane configurations
  - Covers custom heights, multiple series, price-volume combinations
  - Includes 5 baseline screenshots for visual comparison

- **Visual Test Coverage Expansion:**
  - Added 18 new Band series visual tests (thin/thick lines, per-point styling, fill-only modes)
  - Added 15 new Ribbon series visual tests (line visibility, per-point customization)
  - Added 16 new GradientRibbon series visual tests (gradient variations, line control)
  - Total: 49 new visual regression tests with baseline images

- **Series Default Values System:**
  - Created `charts/series/defaults.py` with centralized default configurations
  - Consistent default values across all series types
  - Easier maintenance and modification of default behaviors

- **Documentation & Code Reviews:**
  - `CODE_REVIEW_AND_REFACTORING_PLAN.md` - Comprehensive refactoring roadmap
  - `CODE_REVIEW_COMPREHENSIVE.md` - Full codebase analysis
  - `CODE_REVIEW_SIGNAL_RIBBON.md` - Signal and Ribbon series review
  - `NAMING_CONVENTIONS.md` - Project-wide naming standards
  - `PRIMITIVE_CODE_DUPLICATION_ANALYSIS.md` - DRY compliance analysis
  - `SERIALIZABLE_MIXIN_ADOPTION_ANALYSIS.md` - Serialization patterns
  - `SIGNAL_SERIES_FIX_SUMMARY.md` - Signal series improvements
  - `11-RENDERING-UTILITIES-GUIDE.mdc` - Rendering utilities documentation

### Changed
- **Chart.py Refactoring:**
  - Reduced `chart.py` from 900+ lines to focused core functionality
  - Extracted rendering logic to `ChartRenderer` (470 lines)
  - Extracted series management to `SeriesManager` (310 lines)
  - Extracted price scale logic to `PriceScaleManager` (176 lines)
  - Extracted session state to `SessionStateManager` (175 lines)
  - Extracted trade visualization to `TradeManager` (95 lines)
  - Improved code readability and testability

- **Frontend Type Safety:**
  - Enhanced type safety in `LightweightCharts.tsx`
  - Improved code cleanliness and removed technical debt
  - Fixed formatting in `useSeriesUpdate.ts`

- **Constants Organization:**
  - Expanded `constants/__init__.py` with 345+ new constant definitions
  - Centralized configuration values
  - Improved consistency across codebase

- **Data Class Enhancements:**
  - Enhanced all data classes with better serialization support
  - Improved type hints and validation
  - More consistent property handling across series types

### Technical Details
- **Code Stats:** 156 files changed, 14,271 insertions, 1,629 deletions
- **Architecture:** Modular manager pattern with single responsibility
- **Testing:** 49 new visual regression tests + 5 multi-pane E2E tests
- **Documentation:** 7 new comprehensive analysis documents
- **Examples:** 2 new advanced per-point styling examples (900+ lines total)
- **Maintainability:** Significantly improved through code organization

## [0.1.6] - 2025-10-23

### Changed
- **Version Bump:**
  - Updated version from 0.1.5 to 0.1.6 across all configuration files
  - Updated `pyproject.toml`, `setup.py`, and `__init__.py` version references
  - Created Git tag `v0.1.6` for release tracking

### Technical Details
- **Package Build:** Successfully built and validated distribution packages
  - Source distribution: `streamlit_lightweight_charts_pro-0.1.6.tar.gz` (3.9MB)
  - Wheel distribution: `streamlit_lightweight_charts_pro-0.1.6-py3-none-any.whl` (4.4MB)
- **Quality Assurance:** All 2,239 unit tests passing with 80% coverage
- **Frontend Assets:** Fresh rebuild with optimized bundle (814KB JS, 221KB gzipped)
- **Validation:** Twine package validation passed for both distributions
- **Git Management:** Version changes committed and tagged for release

## [0.1.5] - 2025-10-22

### Fixed
- **TrendFill Series Line Width Rendering:**
  - Fixed pixel ratio scaling for TrendFill line widths
  - Changed from vertical pixel ratio (`vRatio`) to horizontal pixel ratio (`hRatio`)
  - Now correctly renders `line_width=1` as 1px instead of 2px
  - Affects uptrend, downtrend, and base lines (3 locations in TrendFillPrimitive.ts)
  - Verified Band, Ribbon, and GradientRibbon primitives already use correct `hRatio`

- **React Double-Render Bug:**
  - Fixed critical bug where series were being created twice with different values
  - Root cause: `initializeCharts` was always called with `isInitialRender=true`
  - Solution: Changed to `initializeCharts(isInitializedRef.current === false)`
  - Prevents duplicate series creation and ensures cleanup runs properly
  - Fixes issue where Python custom values were being overwritten by defaults

- **Test Suite Consistency:**
  - Fixed BandPrimitive test property names (`upperFillVisible` → `upperFill`, `lowerFillVisible` → `lowerFill`)
  - Updated Band series JSON structure tests for flattened LineOptions format
  - Fixed 6 test assertions expecting nested structure instead of flat properties
  - All 534 Python unit tests now passing

- **Code Quality:**
  - Fixed 24 unused variable assignments across test files
  - Fixed 2 quote style inconsistencies in Python code
  - Removed all debug `console.log` statements from production code
  - Auto-fixed with Ruff linter

### Added
- **Comprehensive Visual Regression Tests:**
  - Added 13 new visual tests for custom series (total now 94 tests)
  - **Ribbon Series (5 tests):**
    - `ribbon-thin-lines` - Line width validation (1px)
    - `ribbon-thick-lines` - Line width validation (4px)
    - `ribbon-upper-line-hidden` - Upper line visibility toggle
    - `ribbon-lower-line-hidden` - Lower line visibility toggle
    - `ribbon-lines-hidden` - Fill-only rendering
  - **GradientRibbon Series (5 tests):**
    - `gradient-ribbon-thin-lines` - Line width validation (1px)
    - `gradient-ribbon-thick-lines` - Line width validation (4px)
    - `gradient-ribbon-upper-line-hidden` - Upper line visibility
    - `gradient-ribbon-lower-line-hidden` - Lower line visibility
    - `gradient-ribbon-lines-hidden` - Gradient fill-only rendering
  - **Signal Series (3 tests):**
    - `signal-high-opacity` - High opacity color validation (0.5-0.6 alpha)
    - `signal-low-opacity` - Low opacity color validation (0.05 alpha)
    - `signal-monochrome` - Monochrome palette validation

### Changed
- **Code Quality Improvements:**
  - Ran full code review and cleanup of both Python and frontend codebases
  - Applied Ruff formatting to all Python files (1 file reformatted)
  - Applied Prettier formatting to all frontend files (all 175 files already formatted)
  - Zero linting errors across entire codebase

### Technical Details
- **Test Coverage:** 3800+ tests passing (534 Python, 3266+ Frontend)
- **Visual Tests:** 94 comprehensive snapshot tests for all series types
- **Security:** 0 vulnerabilities (npm audit clean)
- **Build:** Production build verified (813.65 kB raw, 221.37 kB gzipped)
- **Code Quality:** 100% linter compliance (Ruff + ESLint + TypeScript)
- **Pixel Ratio Consistency:** All primitives now use `hRatio` for line width scaling

## [0.1.4] - 2025-10-21

### Fixed
- **Series Settings Dialog:**
  - Fixed tab rendering issues in SeriesSettingsDialog
  - Tabs now display properly as clickable buttons instead of plain text
  - Added CSS `!important` flags to ensure proper tab styling
  - Fixed tab colors: gray (#787b86) for inactive, dark (#131722) for active
  - Fixed active tab indicator with blue underline (#2962ff)
  - Improved tab hover effects and transitions

- **Property Consistency:**
  - Fixed Python ↔ Frontend property flow for all series types
  - Ensured all SeriesOptionsCommon properties are correctly passed from Python to Frontend
  - Fixed `visible`, `displayName`, and other standard properties for Signal series
  - Added hidden properties (zIndex, priceLineSource, etc.) to STANDARD_SERIES_PROPERTIES
  - Fixed property preservation during dialog updates

- **Code Quality:**
  - Fixed 10 Python linting errors with Ruff
  - Reformatted Python codebase for consistency
  - Fixed CSS duplicate rules in seriesConfigDialog.css
  - Cleaned up all ESLint warnings and auto-fixed issues

### Changed
- **UI Improvements:**
  - Removed "Defaults" button from Series Settings Dialog footer
  - Simplified dialog footer layout (buttons now right-aligned)
  - Cleaner, more streamlined dialog interface
  - Reduced bundle size by 0.89 kB (804.74 kB → 218.85 kB gzipped)

- **Documentation:**
  - Consolidated `.cursor/rules` from 20 files to 7 organized files (65% reduction)
  - All rule files now use `.mdc` extension
  - Removed `_archive/` directory for cleaner structure
  - Created comprehensive navigation with `00-README.mdc`
  - Added full Python ↔ Frontend property consistency guide (26KB in `01-PYTHON-DEVELOPMENT.mdc`)

- **Build & Deployment:**
  - Production build optimized and verified
  - All code formatted with Prettier and ESLint

### Technical Details
- **Frontend Bundle:** 804.74 kB raw, 218.85 kB gzipped
- **Modules Transformed:** 246
- **Code Quality:** ESLint + Prettier + Ruff formatting applied
- **Documentation:** 7 consolidated rule files in `.cursor/rules/`

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
