# @lightweight-charts-pro/core

Framework-agnostic core library for TradingView Lightweight Charts Pro.

## Status: Work in Progress

This package is being extracted from the Streamlit frontend to enable Vue 3 and other framework integrations.

## Structure

```
packages/core/
├── src/
│   ├── plugins/          # Custom series plugins (Band, Ribbon, Signal, etc.)
│   ├── primitives/       # UI primitives (Legend, RangeSwitcher, etc.)
│   ├── series/           # Unified series factory
│   ├── services/         # Chart services (coordinates, layout, etc.)
│   ├── types/            # Shared type definitions
│   ├── config/           # Configuration utilities
│   └── utils/            # Utility functions
├── __tests__/            # Framework-agnostic tests
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

## Known Issues (To Be Fixed)

### Type Export Issues
- Missing exports: `TradeConfig`, `TradeVisualizationOptions`, `PaneSize`, `PaneBounds`, `WidgetPosition`, `LayoutWidget`
- Wrong export names: `tooltipPlugin` → `TooltipPlugin`, `rectanglePlugin` → needs check
- Duplicate exports between modules (need explicit re-exports)

### React Dependencies (Moved to Frontend)
The following components require React and remain in the React frontend:
- `ButtonPanelPrimitive` - Uses React for button rendering
- `SeriesDialogManager` - Uses React for dialog rendering
- `ChartPrimitiveManager` - Depends on above components

### Annotation System Issues
- Type mismatches in `annotationSystem.ts`
- Missing type properties (`type`, `fontSize`, `borderWidth`)

## Development

```bash
# Install dependencies
npm install

# Run type check
npm run type-check

# Run tests
npm test

# Build
npm run build
```

## Usage (Planned)

```typescript
import {
  createBandSeries,
  createRibbonSeries,
  UnifiedSeriesFactory,
  ChartCoordinateService,
} from '@lightweight-charts-pro/core';

// Create custom series
const bandSeries = createBandSeries(chart, {
  upperColor: '#26a69a',
  lowerColor: '#ef5350',
});

// Use coordinate service
const coordService = ChartCoordinateService.getInstance();
const paneCoords = coordService.getPaneCoordinates(chart, 0);
```

## Next Steps

1. Fix type exports to match actual implementations
2. Add missing type definitions
3. Resolve duplicate export issues
4. Complete test migration and fixes
5. Set up build pipeline
6. Publish to npm
