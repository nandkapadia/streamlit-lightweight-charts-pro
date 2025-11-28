# Three-Repo Restructuring Plan

## Overview

This plan outlines the migration from a single repository to three separate repositories with a shared NPM package.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      lightweight-charts-pro-core                    │
│                    (npm package - framework agnostic)               │
│                                                                     │
│  • Custom series plugins (Band, Ribbon, Signal, etc.)               │
│  • Primitives (TradeRectangle, Legend, RangeSwitcher)               │
│  • Services (TradeVisualization, TemplateProcessor)                 │
│  • Type definitions                                                 │
│  • Data transformers                                                │
└─────────────────────────────────────────────────────────────────────┘
                    ▲                           ▲
                    │ depends on                │ depends on
                    │                           │
┌───────────────────┴───────────┐ ┌─────────────┴───────────────────┐
│  svelte-lightweight-charts-pro │ │ streamlit-lightweight-charts-pro│
│                                │ │                                 │
│  • Svelte components           │ │  • Python package               │
│  • Svelte actions              │ │  • React frontend               │
│  • Svelte-specific hooks       │ │  • Streamlit integration        │
│  • SvelteKit support           │ │                                 │
└────────────────────────────────┘ └─────────────────────────────────┘
```

---

## Repository Definitions

### 1. `nandkapadia/lightweight-charts-pro-core`

**Package name**: `lightweight-charts-pro-core`
**Purpose**: Framework-agnostic TypeScript library for charting primitives

```
lightweight-charts-pro-core/
├── src/
│   ├── index.ts                    # Main exports
│   │
│   ├── plugins/                    # Custom ICustomSeries implementations
│   │   ├── band/
│   │   │   ├── BandSeries.ts       # ICustomSeriesPaneView implementation
│   │   │   ├── BandRenderer.ts     # ICustomSeriesPaneRenderer
│   │   │   ├── types.ts            # BandData, BandSeriesOptions
│   │   │   └── index.ts
│   │   ├── ribbon/
│   │   │   ├── RibbonSeries.ts
│   │   │   ├── RibbonRenderer.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── gradient-ribbon/
│   │   │   ├── GradientRibbonSeries.ts
│   │   │   ├── GradientRibbonRenderer.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── signal/
│   │   │   ├── SignalSeries.ts
│   │   │   ├── SignalRenderer.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── trend-fill/
│   │   │   ├── TrendFillSeries.ts
│   │   │   ├── TrendFillRenderer.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   ├── rendering.ts        # drawMultiLine, drawFillArea, etc.
│   │   │   ├── whitespace.ts       # isWhitespaceData helpers
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── primitives/                 # ISeriesPrimitive implementations
│   │   ├── TradeRectanglePrimitive.ts
│   │   ├── LegendPrimitive.ts
│   │   ├── RangeSwitcherPrimitive.ts
│   │   ├── BandPrimitive.ts        # Optional primitive mode for Band
│   │   └── index.ts
│   │
│   ├── services/                   # Business logic services
│   │   ├── TradeVisualization.ts   # createTradeRectangles, createTradeMarkers
│   │   ├── TemplateProcessor.ts    # $$field$$ template interpolation
│   │   ├── CoordinateService.ts    # Price/time to pixel conversion
│   │   ├── TooltipManager.ts       # Tooltip coordination
│   │   └── index.ts
│   │
│   ├── sync/                       # Synchronization utilities
│   │   ├── CrosshairSync.ts        # Crosshair sync logic
│   │   ├── TimeRangeSync.ts        # Time range sync logic
│   │   ├── SyncManager.ts          # Multi-chart coordination
│   │   └── index.ts
│   │
│   ├── data/                       # Data utilities
│   │   ├── transformers.ts         # Data transformation functions
│   │   ├── validators.ts           # Data validation
│   │   ├── time-utils.ts           # Time parsing, conversion
│   │   └── index.ts
│   │
│   ├── descriptors/                # Series descriptors
│   │   ├── SeriesDescriptor.ts     # Base descriptor interface
│   │   ├── builtinDescriptors.ts   # Line, Area, Candlestick, etc.
│   │   ├── customDescriptors.ts    # Band, Ribbon, etc.
│   │   └── index.ts
│   │
│   ├── factory/                    # Series creation
│   │   ├── SeriesFactory.ts        # Unified series factory
│   │   ├── createBandSeries.ts     # Band factory function
│   │   ├── createRibbonSeries.ts   # Ribbon factory function
│   │   └── index.ts
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── series.ts               # Series types
│   │   ├── options.ts              # Options interfaces
│   │   ├── trades.ts               # Trade data types
│   │   ├── sync.ts                 # Sync config types
│   │   ├── events.ts               # Event types
│   │   ├── primitives.ts           # Primitive types
│   │   └── index.ts
│   │
│   └── utils/                      # Common utilities
│       ├── color.ts                # Color manipulation
│       ├── format.ts               # Number/price formatting
│       ├── lineStyle.ts            # Line style utilities
│       └── index.ts
│
├── tests/
│   ├── plugins/                    # Plugin tests
│   ├── primitives/                 # Primitive tests
│   ├── services/                   # Service tests
│   └── data/                       # Data utility tests
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

**package.json**:
```json
{
  "name": "lightweight-charts-pro-core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./plugins": {
      "types": "./dist/plugins/index.d.ts",
      "import": "./dist/plugins/index.js"
    },
    "./plugins/*": {
      "types": "./dist/plugins/*/index.d.ts",
      "import": "./dist/plugins/*/index.js"
    },
    "./primitives": {
      "types": "./dist/primitives/index.d.ts",
      "import": "./dist/primitives/index.js"
    },
    "./services": {
      "types": "./dist/services/index.d.ts",
      "import": "./dist/services/index.js"
    },
    "./sync": {
      "types": "./dist/sync/index.d.ts",
      "import": "./dist/sync/index.js"
    },
    "./data": {
      "types": "./dist/data/index.d.ts",
      "import": "./dist/data/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "lightweight-charts": "^4.0.0"
  },
  "dependencies": {
    "fancy-canvas": "^2.1.0"
  },
  "devDependencies": {
    "lightweight-charts": "^4.1.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^3.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

### 2. `nandkapadia/svelte-lightweight-charts-pro`

**Package name**: `svelte-lightweight-charts-pro`
**Purpose**: Svelte components and bindings for lightweight-charts

```
svelte-lightweight-charts-pro/
├── src/
│   ├── lib/
│   │   ├── index.ts                    # Main exports
│   │   │
│   │   ├── internal/                   # Svelte-specific utilities
│   │   │   ├── chart.ts                # Chart Svelte action
│   │   │   ├── series.ts               # Series management
│   │   │   ├── context.ts              # Context utilities
│   │   │   └── utils.ts                # Reference, ActionResult types
│   │   │
│   │   ├── components/                 # Svelte components
│   │   │   ├── Chart.svelte            # Main chart component
│   │   │   ├── ChartManager.svelte     # Multi-chart container
│   │   │   │
│   │   │   ├── series/                 # Series components
│   │   │   │   ├── LineSeries.svelte
│   │   │   │   ├── AreaSeries.svelte
│   │   │   │   ├── CandlestickSeries.svelte
│   │   │   │   ├── HistogramSeries.svelte
│   │   │   │   ├── BaselineSeries.svelte
│   │   │   │   ├── BarSeries.svelte
│   │   │   │   ├── BandSeries.svelte       # Uses lightweight-charts-pro-core
│   │   │   │   ├── RibbonSeries.svelte
│   │   │   │   ├── GradientRibbonSeries.svelte
│   │   │   │   ├── SignalSeries.svelte
│   │   │   │   ├── TrendFillSeries.svelte
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── scales/
│   │   │   │   ├── PriceScale.svelte
│   │   │   │   ├── TimeScale.svelte
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── controls/
│   │   │   │   ├── Legend.svelte
│   │   │   │   ├── RangeSwitcher.svelte
│   │   │   │   ├── PriceLine.svelte
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── trades/
│   │   │   │   ├── TradeOverlay.svelte
│   │   │   │   ├── TradeTooltip.svelte
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── internal/
│   │   │       └── ContextProvider.svelte
│   │   │
│   │   └── types/                      # Svelte-specific types
│   │       ├── props.ts                # Component prop types
│   │       ├── events.ts               # Event dispatcher types
│   │       └── index.ts
│   │
│   ├── routes/                         # Demo/docs pages (SvelteKit)
│   │   ├── +page.svelte
│   │   ├── demo/
│   │   │   ├── basic/+page.svelte
│   │   │   ├── multi-chart/+page.svelte
│   │   │   ├── trades/+page.svelte
│   │   │   └── custom-series/+page.svelte
│   │   └── docs/
│   │
│   └── app.html
│
├── tests/
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   ├── visual/                         # Visual regression tests
│   └── e2e/                            # Playwright E2E tests
│
├── package.json
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── README.md
```

**package.json**:
```json
{
  "name": "svelte-lightweight-charts-pro",
  "version": "1.0.0",
  "type": "module",
  "svelte": "./dist/index.js",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "svelte": "./dist/components/index.js"
    },
    "./series": {
      "types": "./dist/components/series/index.d.ts",
      "svelte": "./dist/components/series/index.js"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "svelte": "^4.0.0 || ^5.0.0",
    "lightweight-charts": "^4.0.0"
  },
  "dependencies": {
    "lightweight-charts-pro-core": "^1.0.0"
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/package": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@testing-library/svelte": "^4.0.0",
    "@playwright/test": "^1.40.0",
    "lightweight-charts": "^4.1.0",
    "svelte": "^5.0.0",
    "svelte-check": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

### 3. `nandkapadia/streamlit-lightweight-charts-pro` (Refactored)

**Package name**: `streamlit-lightweight-charts-pro` (PyPI)
**Purpose**: Streamlit component with React frontend

```
streamlit-lightweight-charts-pro/
├── streamlit_lightweight_charts_pro/   # Python package (unchanged structure)
│   ├── charts/
│   │   ├── chart.py
│   │   ├── chart_manager.py
│   │   ├── series/
│   │   ├── options/
│   │   └── managers/
│   ├── data/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── LightweightCharts.tsx   # Uses lightweight-charts-pro-core
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/                  # Re-exports from lightweight-charts-pro-core
│   │   │   └── utils/
│   │   ├── package.json                # Depends on lightweight-charts-pro-core
│   │   └── ...
│   └── ...
├── tests/
├── examples/
├── pyproject.toml
└── README.md
```

**frontend/package.json** (updated):
```json
{
  "name": "streamlit-lightweight-charts-pro-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "lightweight-charts-pro-core": "^1.0.0",
    "lightweight-charts": "^4.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "streamlit-component-lib": "^2.0.0"
  }
}
```

---

## Code Extraction Map

### From Current Frontend → lightweight-charts-pro-core

| Current Path | New Path in Core | Notes |
|-------------|------------------|-------|
| `plugins/series/bandSeriesPlugin.ts` | `plugins/band/BandSeries.ts` | Split into Series + Renderer |
| `plugins/series/ribbonSeriesPlugin.ts` | `plugins/ribbon/RibbonSeries.ts` | Split into Series + Renderer |
| `plugins/series/gradientRibbonSeriesPlugin.ts` | `plugins/gradient-ribbon/GradientRibbonSeries.ts` | Split into Series + Renderer |
| `plugins/series/signalSeriesPlugin.ts` | `plugins/signal/SignalSeries.ts` | Split into Series + Renderer |
| `plugins/series/trendFillSeriesPlugin.ts` | `plugins/trend-fill/TrendFillSeries.ts` | Split into Series + Renderer |
| `plugins/series/base/commonRendering.ts` | `plugins/shared/rendering.ts` | Shared rendering utils |
| `primitives/TradeRectanglePrimitive.ts` | `primitives/TradeRectanglePrimitive.ts` | Direct move |
| `primitives/LegendPrimitive.ts` | `primitives/LegendPrimitive.ts` | Direct move |
| `primitives/RangeSwitcherPrimitive.ts` | `primitives/RangeSwitcherPrimitive.ts` | Direct move |
| `primitives/BandPrimitive.ts` | `primitives/BandPrimitive.ts` | Direct move |
| `services/tradeVisualization.ts` | `services/TradeVisualization.ts` | Direct move |
| `services/TradeTemplateProcessor.ts` | `services/TemplateProcessor.ts` | Direct move |
| `services/ChartCoordinateService.ts` | `services/CoordinateService.ts` | Direct move |
| `plugins/chart/TooltipManager.ts` | `services/TooltipManager.ts` | Move to services |
| `series/UnifiedSeriesFactory.ts` | `factory/SeriesFactory.ts` | Refactored |
| `series/core/UnifiedSeriesDescriptor.ts` | `descriptors/SeriesDescriptor.ts` | Refactored |
| `series/descriptors/builtinSeriesDescriptors.ts` | `descriptors/builtinDescriptors.ts` | Direct move |
| `series/descriptors/customSeriesDescriptors.ts` | `descriptors/customDescriptors.ts` | Direct move |
| `types/ChartInterfaces.ts` | `types/` | Split into multiple files |
| `types.ts` | `types/` | Split into multiple files |
| `utils/renderingUtils.ts` | `utils/lineStyle.ts` | Extract relevant parts |
| `utils/colorUtils.ts` | `utils/color.ts` | Direct move |

### What Stays in Streamlit Repo (React-specific)

| File | Reason |
|------|--------|
| `LightweightCharts.tsx` | React component |
| `components/*.tsx` | React components |
| `hooks/*.ts` | React hooks |
| `services/StreamlitSeriesConfigService.ts` | Streamlit-specific |
| `forms/*.tsx` | React dialog forms |

### What Goes in Svelte Repo (New)

| File | Purpose |
|------|---------|
| `Chart.svelte` | Main chart component |
| `ChartManager.svelte` | Multi-chart sync |
| `*Series.svelte` | Series components |
| `internal/*.ts` | Svelte actions |

---

## Migration Steps

### Phase 1: Create charts-core Repository

```bash
# 1. Create new repository
gh repo create nandkapadia/lightweight-charts-pro-core --public

# 2. Clone and setup
git clone https://github.com/nandkapadia/lightweight-charts-pro-core.git
cd charts-core

# 3. Initialize package
npm init -y
npm install -D typescript vite vite-plugin-dts vitest
npm install -D lightweight-charts fancy-canvas
```

**Tasks**:
- [ ] Create repository structure
- [ ] Setup TypeScript, Vite, Vitest
- [ ] Extract plugin code from current frontend
- [ ] Extract primitive code
- [ ] Extract service code
- [ ] Extract type definitions
- [ ] Create proper exports
- [ ] Add unit tests
- [ ] Setup CI/CD
- [ ] Publish to npm as `lightweight-charts-pro-core`

### Phase 2: Create svelte-lightweight-charts-pro Repository

```bash
# 1. Create new repository
gh repo create nandkapadia/svelte-lightweight-charts-pro --public

# 2. Clone and setup
git clone https://github.com/nandkapadia/svelte-lightweight-charts-pro.git
cd svelte-lightweight-charts-pro

# 3. Initialize SvelteKit library
npm create svelte@latest . -- --template skeleton --typescript
npm install lightweight-charts-pro-core lightweight-charts
```

**Tasks**:
- [ ] Create repository with SvelteKit
- [ ] Setup svelte-package for library mode
- [ ] Implement Svelte components using core
- [ ] Add demo routes
- [ ] Add tests (unit, integration, visual, e2e)
- [ ] Setup CI/CD
- [ ] Publish to npm

### Phase 3: Refactor streamlit-lightweight-charts-pro

**Tasks**:
- [ ] Add `lightweight-charts-pro-core` as dependency
- [ ] Remove extracted code (plugins, primitives, services)
- [ ] Update imports to use `lightweight-charts-pro-core`
- [ ] Update tests
- [ ] Verify all functionality works
- [ ] Release new version

---

## Dependency Flow

```
lightweight-charts (TradingView)
       │
       ▼
lightweight-charts-pro-core
       │
       ├──────────────────────────┐
       ▼                          ▼
svelte-lightweight-charts-pro    streamlit-lightweight-charts-pro
       │                          │
       ▼                          ▼
   User's Svelte App          User's Streamlit App
```

### Version Compatibility Matrix

| lightweight-charts-pro-core | lightweight-charts | svelte | streamlit-lw-charts-pro |
|-------------------|-------------------|--------|------------------------|
| 1.0.x | ^4.0.0 | ^4.0.0 \|\| ^5.0.0 | 1.0.x |
| 1.1.x | ^4.1.0 | ^4.0.0 \|\| ^5.0.0 | 1.1.x |

---

## API Consistency

### Core Package Exports

```typescript
// lightweight-charts-pro-core

// Plugins
export { BandSeries, createBandSeries } from './plugins/band';
export type { BandData, BandSeriesOptions } from './plugins/band';

export { RibbonSeries, createRibbonSeries } from './plugins/ribbon';
export type { RibbonData, RibbonSeriesOptions } from './plugins/ribbon';

// ... other plugins

// Primitives
export { TradeRectanglePrimitive } from './primitives';
export { LegendPrimitive } from './primitives';

// Services
export { createTradeVisualElements, createTradeRectangles, createTradeMarkers } from './services';
export { TemplateProcessor } from './services';
export { TooltipManager } from './services';

// Sync
export { CrosshairSync, TimeRangeSync, SyncManager } from './sync';

// Types
export type * from './types';
```

### Svelte Package Exports

```typescript
// svelte-lightweight-charts-pro

// Components
export { default as Chart } from './components/Chart.svelte';
export { default as ChartManager } from './components/ChartManager.svelte';

// Series
export { default as LineSeries } from './components/series/LineSeries.svelte';
export { default as AreaSeries } from './components/series/AreaSeries.svelte';
export { default as CandlestickSeries } from './components/series/CandlestickSeries.svelte';
export { default as BandSeries } from './components/series/BandSeries.svelte';
// ... etc

// Controls
export { default as Legend } from './components/controls/Legend.svelte';
export { default as RangeSwitcher } from './components/controls/RangeSwitcher.svelte';

// Re-export types from core
export type {
  BandData,
  BandSeriesOptions,
  RibbonData,
  TradeData,
  TradeVisualizationOptions,
  SyncConfig,
} from 'lightweight-charts-pro-core';
```

---

## Testing Strategy

### Core Package Tests

```
tests/
├── plugins/
│   ├── band.test.ts           # BandSeries unit tests
│   ├── ribbon.test.ts         # RibbonSeries unit tests
│   └── ...
├── primitives/
│   ├── trade-rectangle.test.ts
│   └── ...
├── services/
│   ├── trade-visualization.test.ts
│   ├── template-processor.test.ts
│   └── ...
└── visual/
    ├── band-rendering.test.ts  # Canvas snapshot tests
    └── ...
```

### Svelte Package Tests

```
tests/
├── unit/
│   ├── Chart.test.ts
│   ├── series/*.test.ts
│   └── ...
├── integration/
│   ├── chart-manager.test.ts
│   ├── sync.test.ts
│   └── ...
├── visual/
│   └── component-snapshots/
└── e2e/
    ├── basic-chart.test.ts
    ├── multi-chart.test.ts
    └── trades.test.ts
```

### Parity Tests (Cross-repo)

Both Svelte and Streamlit repos should have parity tests that verify:
- Same data produces same visual output
- Same options produce same behavior
- Custom series render identically

---

## CI/CD Pipelines

### Core Package (.github/workflows/release.yml)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build
      - run: npm test

      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Downstream Notifications

When core is released, trigger updates in dependent repos:

```yaml
# In charts-core repo
- name: Trigger downstream updates
  uses: peter-evans/repository-dispatch@v2
  with:
    token: ${{ secrets.REPO_ACCESS_TOKEN }}
    repository: nandkapadia/svelte-lightweight-charts-pro
    event-type: core-updated
    client-payload: '{"version": "${{ github.ref_name }}"}'
```

---

## Timeline

| Week | Tasks |
|------|-------|
| Week 1 | Create charts-core repo, extract plugins & primitives |
| Week 2 | Extract services, add tests, publish v1.0.0-beta |
| Week 3 | Create svelte repo, implement core components |
| Week 4 | Implement all series components, add sync |
| Week 5 | Add tests, demos, documentation |
| Week 6 | Refactor streamlit repo to use core |
| Week 7 | Integration testing, bug fixes |
| Week 8 | Release v1.0.0 of all packages |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking changes in core affect both consumers | Semantic versioning, thorough testing |
| Sync issues between repos | CI triggers, version matrix testing |
| npm publishing delays | Pre-release versions, local linking for dev |
| Type definition drift | Shared types in core, strict exports |

---

## Next Steps

1. **Approve this plan** - Review and confirm approach
2. **Create charts-core repo** - Start extraction
3. **Setup npm publishing** - Configure @nasha scope
4. **Begin extraction** - Move code to core
5. **Create svelte repo** - After core is stable

Shall I proceed with creating the `charts-core` repository and begin the extraction?
