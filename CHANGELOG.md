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

## [0.2.0] - Previous Release

See git history for 0.2.0 changes.

[unreleased]: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/nandkapadia/streamlit-lightweight-charts-pro/releases/tag/v0.3.0
