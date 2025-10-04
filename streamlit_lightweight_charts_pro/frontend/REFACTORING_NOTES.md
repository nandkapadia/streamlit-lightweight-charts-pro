# Series Refactoring Notes

## Overview
Refactoring Band, Ribbon, and Gradient Ribbon series to follow the hybrid pattern established in TrendFill series.

## Pattern: Hybrid (ICustomSeries + Optional ISeriesPrimitive)

### Benefits
1. **Autoscaling**: ICustomSeries provides built-in autoscaling
2. **Z-order control**: Optional primitive for background rendering
3. **Consistent API**: Same pattern across all series
4. **Code reuse**: Shared rendering utilities

### Trade-offs from Current Implementation
- **Lost**: Built-in Line series features (crosshair markers, line types)
- **Gained**: Full control, z-order, consistency, simpler codebase

## Current vs New Architecture

### Ribbon Series
**Current**: ISeriesPrimitive + 2 Line Series
- Upper/Lower as actual Line series
- Primitive draws fill between them
- Rich Line series features

**New**: ICustomSeries + Optional ISeriesPrimitive
- ICustomSeries renders lines + fill directly
- Optional primitive for z-order control
- Simpler, more consistent

### Band Series
**Current**: ISeriesPrimitive + 3 Line Series
- Upper/Middle/Lower as Line series
- Primitive draws fills

**New**: ICustomSeries + Optional ISeriesPrimitive
- ICustomSeries renders 3 lines + 2 fills
- Optional primitive for background

### Gradient Ribbon
**Current**: ISeriesPrimitive + gradient fills
**New**: ICustomSeries + Optional ISeriesPrimitive
- Gradient rendering in both modes
- Color interpolation utilities

## Implementation Status

- [x] Base classes created
  - [x] BasePrimitiveAxisView
  - [x] commonRendering utilities

- [ ] Ribbon Series (IN PROGRESS)
- [ ] Band Series
- [ ] Gradient Ribbon Series
- [ ] Test suites
- [ ] Lint/Type checking
- [ ] Streamlit test harness

## Notes
- Keeping implementation focused on core features
- Can add advanced features (crosshair markers, line types) later if needed
- Priority is consistency and code quality
