# Claude Code Instructions for streamlit-lightweight-charts-pro

This document provides comprehensive guidance for AI assistants working on the streamlit-lightweight-charts-pro codebase.

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Code Conventions](#code-conventions)
- [Development Workflows](#development-workflows)
- [Testing Requirements](#testing-requirements)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

**streamlit-lightweight-charts-pro** is a Streamlit wrapper for TradingView's lightweight-charts library, providing professional financial charting with an intuitive Python API.

### Key Characteristics
- **Dual-language**: Python backend + TypeScript/React frontend
- **Streamlit integration**: Custom bidirectional component
- **Production-ready**: Comprehensive testing, documentation, type safety
- **Trading-focused**: Quantitative trading features (avoid lookahead bias)

### Core Dependencies
- **Python**: `lightweight-charts-pro` (framework-agnostic core)
- **TypeScript**: `@lightweight-charts-pro/core` (shared utilities)
- **Streamlit**: Custom component with bidirectional communication
- **React 19**: Latest concurrent features

---

## Architecture

### High-Level Structure

```
User's Streamlit App (Python)
        ↓
streamlit_lightweight_charts_pro (Python wrapper)
    ├── Chart/ChartManager (extends lightweight-charts-pro)
    ├── ChartRenderer (config generation)
    └── SessionStateManager (persistence)
        ↓ JSON config
Streamlit Component Bridge
        ↓
React Frontend (TypeScript)
    ├── LightweightCharts component (2500+ lines)
    ├── UnifiedSeriesFactory (descriptor-driven)
    ├── Services (primitives, dialogs, state)
    └── TradingView lightweight-charts API
        ↓
@lightweight-charts-pro/core (shared TypeScript)
```

### Directory Structure

```
streamlit-lightweight-charts-pro/
├── streamlit_lightweight_charts_pro/    # Python package
│   ├── __init__.py                      # Package exports
│   ├── component.py                     # Streamlit component bridge
│   ├── cli.py                          # CLI tools
│   ├── exceptions.py                    # Custom exceptions
│   ├── charts/                         # Chart implementation
│   │   ├── chart.py                   # Chart (extends BaseChart)
│   │   ├── chart_manager.py           # ChartManager
│   │   ├── series_settings_api.py     # Series config API
│   │   └── managers/                   # Rendering & state
│   ├── data/                           # Data models (re-exports)
│   ├── type_definitions/               # Type definitions (re-exports)
│   ├── utils/                          # Utilities (re-exports)
│   └── frontend/                       # React/TypeScript
│       ├── src/                        # Source code
│       │   ├── index.tsx              # Streamlit integration
│       │   ├── LightweightCharts.tsx  # Main component
│       │   ├── types.ts               # Type definitions
│       │   ├── components/            # React components
│       │   ├── hooks/                 # React hooks
│       │   ├── series/                # Series factory
│       │   ├── services/              # Core services
│       │   ├── primitives/            # Custom primitives
│       │   ├── utils/                 # Utilities
│       │   └── __tests__/             # 97 test files
│       ├── build/                      # Built assets (production)
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── examples/                           # 60+ examples
├── pyproject.toml                      # Python config
└── README.md
```

### Data Flow

**Chart Creation**:
1. User creates `Chart()` in Python
2. `Chart.render(key)` → loads stored configs → generates frontend config
3. `ChartRenderer` → serializes to JSON
4. Streamlit component bridge → passes to React
5. React renders chart → `UnifiedSeriesFactory` creates series
6. User interactions → updates sent back to Python
7. Python stores config in session state

---

## Code Conventions

### Python Code Standards

#### Documentation
- **Google-style docstrings** (Sphinx napoleon compatible)
- **Line width**: ≤ 99 characters
- **Type hints**: Required for all functions/methods
- **Inline comments**: Explain complex logic for novices

```python
def generate_frontend_config(
    self,
    series_configs: list[dict[str, Any]],
    chart_options: Optional[ChartOptions] = None,
) -> dict[str, Any]:
    """Generate complete frontend configuration dictionary.

    This method transforms Python chart configuration into a JSON-serializable
    format that the React frontend can consume. It handles options serialization,
    series configuration, and metadata assembly.

    Args:
        series_configs (list[dict[str, Any]]): List of serialized series configs.
        chart_options (Optional[ChartOptions]): Chart styling and behavior options.
            Defaults to None for basic configuration.

    Returns:
        dict[str, Any]: Complete frontend configuration dictionary containing:
            - chartId: Unique identifier
            - chart: Serialized chart options
            - series: List of series configurations
            - panes: Multi-pane configuration

    Example:
        >>> renderer = ChartRenderer()
        >>> config = renderer.generate_frontend_config(
        ...     series_configs=[line_series.asdict()],
        ...     chart_options=ChartOptions(height=600)
        ... )
    """
    # Implementation with detailed inline comments
    pass
```

#### Import Organization
**Always use absolute imports, organized as:**
```python
# Standard Imports
import json
from datetime import datetime
from typing import Any, Optional

# Third Party Imports
import pandas as pd
import streamlit as st

# Local Imports
from lightweight_charts_pro.charts.options import ChartOptions
from streamlit_lightweight_charts_pro.component import get_component_func
```

#### Formatting Pipeline
**After editing Python files, always run:**
```bash
isort --float-to-top <file>
autoflake --in-place --remove-unused-variables <file>
black --line-length 99 --enable-unstable-feature=string_processing --preview <file>
ruff check --fix <file>
```

#### Code Quality
- **Prefer explicit over implicit**: Production-ready code
- **Type safety**: Use type hints, validate inputs
- **Error handling**: Clear exceptions with helpful messages
- **Avoid premature optimization**: Simple, readable code first
- **Small functions**: Single responsibility principle

### TypeScript Code Standards

#### Documentation
- **Google-style JSDoc/TSDoc**
- **Line width**: ≤ 100 characters
- **Type annotations**: Required (TypeScript strict mode)
- **Inline comments**: Explain "why" not "what"

```typescript
/**
 * Creates a unified series instance based on configuration.
 *
 * This factory method uses the descriptor pattern to support both builtin
 * and custom series types. It handles property mapping, validation, and
 * API compatibility.
 *
 * @param chart - Chart API instance to attach series to
 * @param config - Series configuration from Python backend
 * @param logger - Logger instance for debugging
 * @returns Created series instance or null if creation fails
 *
 * @example
 * ```typescript
 * const series = createSeriesWithConfig(
 *   chartApi,
 *   { type: 'Line', data: [...], color: '#2962FF' },
 *   logger
 * );
 * ```
 */
export function createSeriesWithConfig(
  chart: IChartApi,
  config: SeriesConfig,
  logger: Logger
): ISeriesApi<SeriesType> | null {
  // Get descriptor for series type
  const descriptor = getSeriesDescriptor(config.type);

  // Implementation...
}
```

#### Import Organization
```typescript
// Standard Imports (Node.js built-ins)
import { useEffect, useRef } from 'react';

// Third Party Imports
import { IChartApi, createChart } from 'lightweight-charts';
import { Streamlit } from 'streamlit-component-lib';

// Local Imports
import { SeriesConfig } from '../types';
import { UnifiedSeriesFactory } from '../series/UnifiedSeriesFactory';
import { logger } from '@lightweight-charts-pro/core';
```

#### Formatting Pipeline
**After editing TypeScript files, always run:**
```bash
cd streamlit_lightweight_charts_pro/frontend
npx prettier --write <file>
npx eslint --fix <file>
npx tsc --noEmit  # Verify no type errors
```

#### Code Quality
- **React 19 patterns**: Use concurrent features (`useTransition`, `useDeferredValue`)
- **Memory management**: Always cleanup (ResizeObserver, event listeners)
- **Type safety**: No `any` unless absolutely necessary
- **Performance**: Memoize expensive computations
- **Error boundaries**: Wrap components that might throw

---

## Development Workflows

### Setup Development Environment

```bash
# 1. Clone repository
git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git
cd streamlit-lightweight-charts-pro

# 2. Install Python package in editable mode
pip install -e ".[dev,test]"

# 3. Install frontend dependencies
cd streamlit_lightweight_charts_pro/frontend
npm install

# 4. Verify setup
cd ../..
make check  # Runs linters and type checks
```

### Development Mode

**Frontend Development with Hot Reload:**
```bash
# Terminal 1: Start frontend dev server
cd streamlit_lightweight_charts_pro/frontend
npm run start  # Port 3000

# Terminal 2: Run Streamlit app
streamlit run examples/quick_start/minimal_example.py

# Note: Set _RELEASE = False in component.py for dev mode
```

**Features in Dev Mode:**
- Hot module reloading (HMR)
- Source maps for debugging
- Fast rebuild times
- TypeScript type checking
- ESLint + Prettier

### Production Build

```bash
# Build frontend first
cd streamlit_lightweight_charts_pro/frontend
npm run build  # Outputs to frontend/build/

# Build Python package
cd ../..
python -m build  # Outputs to dist/

# Verify build
ls -la streamlit_lightweight_charts_pro/frontend/build/
ls -la dist/
```

### Making Changes

#### Python Changes
1. Edit Python file
2. Add/update docstrings (Google style)
3. Add inline comments
4. Run formatters: `isort`, `autoflake`, `black`, `ruff`
5. Run tests: `pytest tests/`
6. Update examples if API changed

#### TypeScript Changes
1. Edit TypeScript file
2. Add/update JSDoc comments
3. Run formatters: `prettier`, `eslint`
4. Check types: `npx tsc --noEmit`
5. Run tests: `npm run test`
6. Update snapshots if needed: `npm run test:update-snapshots`

#### Both Languages
1. Update version in `pyproject.toml` and `package.json` (keep in sync)
2. Update `CHANGELOG.md`
3. Update `README.md` if user-facing
4. Build frontend before committing: `npm run build`

---

## Testing Requirements

### Python Testing

**Framework**: pytest with extensive markers

```bash
# Run all tests
pytest tests/ -v

# Run specific markers
pytest tests/ -m unit
pytest tests/ -m integration
pytest tests/ -m performance

# With coverage
pytest tests/ --cov=streamlit_lightweight_charts_pro
```

**Test Structure**:
```python
import pytest
from streamlit_lightweight_charts_pro import Chart, LineSeries

class TestChart:
    """Test suite for Chart class."""

    def test_chart_creation(self):
        """Test basic chart creation."""
        chart = Chart()
        assert chart is not None
        assert isinstance(chart, Chart)

    @pytest.mark.integration
    def test_chart_rendering(self):
        """Test chart rendering with Streamlit."""
        # Integration test logic
        pass
```

### Frontend Testing

**Framework**: Vitest (unit/integration) + Playwright (e2e/visual)

```bash
cd streamlit_lightweight_charts_pro/frontend

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual

# All tests
npm run test

# Watch mode (development)
npm run test:watch

# Coverage
npm run test:coverage
```

**Test Structure**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LightweightCharts } from '../LightweightCharts';

describe('LightweightCharts Component', () => {
  it('should render without crashing', () => {
    const config = { charts: [] };
    render(<LightweightCharts config={config} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('should create series from config', () => {
    // Test series creation
  });
});
```

### Test Requirements

**When writing code, ALWAYS:**
1. Write tests alongside implementation
2. Aim for >80% coverage
3. Test happy paths AND error cases
4. Include edge cases
5. Run tests until all pass
6. Update snapshots if visual changes expected

**Never commit:**
- Failing tests
- Skipped tests without reason
- Code without tests (for new features)

---

## Common Tasks

### Task 1: Add New Series Type

**Python Side** (if adding Python API):
```python
# In lightweight-charts-pro (core package)
class NewSeries(Series):
    """New series type."""

    def __init__(self, data: list, **options):
        super().__init__(type="New", data=data, **options)
```

**TypeScript Side**:
```typescript
// 1. Add descriptor in series/descriptors/
export const NewSeriesDescriptor: UnifiedSeriesDescriptor = {
  seriesType: 'New',
  apiMethod: 'addNewSeries',
  isCustomSeries: false,
  properties: {
    color: { pythonProp: 'color', apiProp: 'color', isNested: false },
    // ... other properties
  }
};

// 2. Register in series/descriptors/index.ts
export const BUILTIN_SERIES_DESCRIPTORS = {
  // ... existing
  New: NewSeriesDescriptor,
};

// 3. Add tests in __tests__/series/
describe('NewSeries', () => {
  it('should create New series', () => {
    // Test logic
  });
});
```

### Task 2: Add New Chart Option

**Python Side** (in lightweight-charts-pro):
```python
# In charts/options/chart_options.py
@dataclass
class ChartOptions(SerializableMixin):
    new_option: Optional[int] = None

    def asdict(self) -> dict:
        # Include new_option in serialization
```

**TypeScript Side**:
```typescript
// In types.ts
export interface ChartOptions {
  // ... existing
  newOption?: number;
}

// In LightweightCharts.tsx
const chartOptions: DeepPartial<ChartOptions> = {
  // ... existing
  newOption: config.newOption,
};
```

### Task 3: Fix Session State Issue

**Check these locations:**
1. `managers/session_state_manager.py` - Storage/retrieval
2. `managers/chart_renderer.py` - handle_response()
3. `charts/chart.py` - render() method
4. Frontend: Series update logic

**Debug approach:**
```python
# Add logging
from lightweight_charts_pro.logging_config import get_logger
logger = get_logger(__name__)

logger.debug(f"Stored configs: {st.session_state.get(key)}")
logger.debug(f"Applied config to series: {series.asdict()}")
```

### Task 4: Update Dependency Versions

**Python dependencies** (pyproject.toml):
```toml
[project]
dependencies = [
    "streamlit>=1.0",  # Update minimum version if needed
    "pandas>=1.0",
    "numpy>=1.19",
    "lightweight-charts-pro @ git+https://github.com/nandkapadia/lightweight-charts-pro-python.git@dev",
]
```

**Frontend dependencies** (package.json):
```json
{
  "dependencies": {
    "lightweight-charts": "^5.0.8",  // Update TradingView library
    "react": "^19.1.1",
    // ... others
  }
}
```

**After updating:**
1. Test thoroughly
2. Update version in pyproject.toml
3. Update CHANGELOG.md
4. Build and test distribution

### Task 5: Add Example File

**Create in appropriate examples/ subdirectory:**
```python
"""Example: <Feature Name>

This example demonstrates <what it shows>.
"""

# Standard Imports
import pandas as pd

# Third Party Imports
import streamlit as st

# Local Imports
from streamlit_lightweight_charts_pro import Chart, LineSeries
from streamlit_lightweight_charts_pro.data import SingleValueData

# Page configuration
st.set_page_config(page_title="Feature Name", layout="wide")
st.title("Feature Name Example")

# Create data
data = [SingleValueData(time=f"2024-01-{i:02d}", value=100 + i) for i in range(1, 31)]

# Create and render chart
chart = Chart()
chart.add_series(LineSeries(data=data, color="#2962FF"))
chart.render(key="example_chart")
```

**Add to launcher.py navigation.**

---

## Troubleshooting

### Frontend Not Loading

**Symptoms**: Blank component, "Component not available" error

**Solutions**:
1. Check frontend build exists: `ls streamlit_lightweight_charts_pro/frontend/build/`
2. Build frontend: `cd frontend && npm run build`
3. Check `_RELEASE` flag in `component.py`
4. Check browser console for errors
5. Verify Streamlit version: `pip show streamlit`

### Session State Not Persisting

**Symptoms**: Config resets on rerun

**Debug**:
```python
import streamlit as st

# Check what's in session state
st.write("Session state:", st.session_state)

# Check specific key
key = "_chart_series_configs_my_chart"
st.write(f"Stored configs: {st.session_state.get(key)}")
```

**Common causes**:
- Key mismatch between save/load
- Session state cleared by user code
- Config not being saved in handle_response()

### Type Errors in TypeScript

**Symptoms**: `tsc` compilation fails

**Solutions**:
1. Check `types.ts` for type definitions
2. Run `npx tsc --noEmit` to see all errors
3. Add proper types (avoid `any`)
4. Check imported types from dependencies
5. Clear build cache: `rm -rf node_modules/.vite`

### Tests Failing

**Python**:
```bash
# Run with verbose output
pytest tests/ -vv --tb=long

# Run specific test
pytest tests/test_chart.py::TestChart::test_creation -vv

# Debug with pdb
pytest tests/ --pdb
```

**TypeScript**:
```bash
# Run with debugging
npm run test -- --reporter=verbose

# Run specific test
npm run test -- LightweightCharts.test.tsx

# Update snapshots
npm run test:update-snapshots
```

### Build Failures

**Frontend build**:
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
rm -rf build
npm run build
```

**Python build**:
```bash
# Clean and rebuild
rm -rf dist/ build/ *.egg-info
python -m build
```

---

## Trading Code Guidelines

When working with trading-related features:

1. **Avoid Lookahead Bias**
   - Don't use future data in calculations
   - Be explicit about when data is available
   - Document time assumptions

2. **Data Integrity**
   - Validate OHLCV data consistency (Open ≤ High, Close ≥ Low, etc.)
   - Check for missing/duplicate timestamps
   - Handle timezone conversions explicitly

3. **Performance Assumptions**
   - Document slippage assumptions
   - Be explicit about trading fees
   - Clarify execution assumptions (market/limit orders)

4. **Backtesting**
   - Separate backtest logic from live trading
   - Document data sources
   - Include risk disclaimers in examples

---

## Version Management

### Version Synchronization

**Keep these in sync:**
- `pyproject.toml`: `version = "0.3.0"`
- `streamlit_lightweight_charts_pro/__init__.py`: `__version__ = "0.3.0"`
- `frontend/package.json`: `"version": "0.3.0"`

### Semantic Versioning

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

### Release Checklist

1. ✓ All tests pass
2. ✓ Frontend built (`npm run build`)
3. ✓ Versions synchronized
4. ✓ CHANGELOG.md updated
5. ✓ Git tag created: `git tag v0.3.0`
6. ✓ Documentation updated
7. ✓ Examples work with new version

---

## Additional Resources

- **Main Repo**: https://github.com/nandkapadia/streamlit-lightweight-charts-pro
- **Core Python Package**: https://github.com/nandkapadia/lightweight-charts-pro-python
- **Core TypeScript Package**: https://github.com/nandkapadia/lightweight-charts-pro-frontend
- **TradingView Charts**: https://tradingview.github.io/lightweight-charts/
- **Streamlit Components**: https://docs.streamlit.io/library/components

---

## Quick Reference

### File Locations Cheat Sheet

| What | Where |
|------|-------|
| Chart class | `streamlit_lightweight_charts_pro/charts/chart.py` |
| Component bridge | `streamlit_lightweight_charts_pro/component.py` |
| Main React component | `frontend/src/LightweightCharts.tsx` |
| Series factory | `frontend/src/series/UnifiedSeriesFactory.ts` |
| Type definitions | `frontend/src/types.ts` |
| Session state | `charts/managers/session_state_manager.py` |
| Renderer | `charts/managers/chart_renderer.py` |
| Tests (Python) | `tests/` |
| Tests (TypeScript) | `frontend/src/__tests__/` |
| Examples | `examples/` |

### Command Cheat Sheet

```bash
# Development
make dev              # Start dev environment
make test            # Run all tests
make format          # Format all code
make lint            # Lint all code
make check           # Format + lint + test

# Frontend
npm run start        # Dev server
npm run build        # Production build
npm run test         # Run tests
npm run code-quality # Format + lint + type-check

# Python
pytest tests/ -v     # Run tests
black .              # Format
ruff check .         # Lint
mypy .               # Type check

# Build & Release
make build           # Build package
make publish-test    # Publish to TestPyPI
make publish         # Publish to PyPI
```

---

**Remember**: This is a production-grade library for quantitative trading. Code quality, testing, and documentation are non-negotiable. When in doubt, ask clarifying questions before implementing.
