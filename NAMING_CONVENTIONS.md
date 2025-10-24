# Naming Conventions

This document establishes the naming conventions used throughout the streamlit-lightweight-charts-pro codebase to ensure consistency between Python backend and TypeScript frontend.

## General Principles

### Python (Backend)
**Always use `snake_case` for all identifiers**

- **Variables**: `fill_visible`, `upper_line_color`, `price_scale_id`
- **Functions**: `add_opacity()`, `create_upper_line()`, `prepare_index()`
- **Class names**: `PascalCase` (e.g., `SignalSeries`, `LineOptions`)
- **Constants**: `UPPER_CASE_WITH_UNDERSCORES` (e.g., `COLOR_UPPER_GREEN`, `LINE_WIDTH_STANDARD`)
- **Private members**: Prefix with single underscore (`_fill_visible`, `_upper_line`)

### TypeScript (Frontend)
**Always use `camelCase` for all identifiers**

- **Variables**: `fillVisible`, `upperLineColor`, `priceScaleId`
- **Functions**: `addOpacity()`, `createUpperLine()`, `prepareIndex()`
- **Interface names**: `PascalCase` (e.g., `SignalSeriesOptions`, `LineOptions`)
- **Constants**: `UPPER_CASE_WITH_UNDERSCORES` or `camelCase` (e.g., `COLOR_UPPER_GREEN` or `colorUpperGreen`)
- **Private members**: Prefix with underscore (`_fillVisible`, `_upperLine`)

---

## Python ↔ TypeScript Property Mapping

Properties are automatically converted between Python's `snake_case` and TypeScript's `camelCase` during serialization.

### Conversion Rules

| Python (snake_case) | TypeScript (camelCase) |
|---------------------|------------------------|
| `fill_visible` | `fillVisible` |
| `upper_line_color` | `upperLineColor` |
| `price_scale_id` | `priceScaleId` |
| `neutral_color` | `neutralColor` |
| `signal_color` | `signalColor` |
| `alert_color` | `alertColor` |
| `line_width` | `lineWidth` |
| `line_style` | `lineStyle` |
| `line_visible` | `lineVisible` |

### Automatic Conversion

The conversion is handled by the `snake_to_camel()` utility function in the serialization layer:

```python
# Python backend
class SignalSeries:
    def __init__(self, neutral_color: str, signal_color: str):
        self._neutral_color = neutral_color
        self._signal_color = signal_color

# Serializes to:
{
    "neutralColor": "#808080",
    "signalColor": "#4CAF50"
}
```

```typescript
// TypeScript frontend
interface SignalSeriesOptions {
    neutralColor?: string;
    signalColor?: string;
}
```

---

## Common Property Names

### Series Options

| Concept | Python | TypeScript |
|---------|--------|------------|
| Fill visibility | `fill_visible` | `fillVisible` |
| Upper line | `upper_line` | `upperLine` |
| Lower line | `lower_line` | `lowerLine` |
| Middle line | `middle_line` | `middleLine` |
| Fill color | `fill_color` | `fillColor` |
| Upper fill | `upper_fill` | `upperFill` |
| Lower fill | `lower_fill` | `lowerFill` |
| Line width | `line_width` | `lineWidth` |
| Line style | `line_style` | `lineStyle` |
| Line visible | `line_visible` | `lineVisible` |
| Line color | `line_color` | `lineColor` |

### Chart Options

| Concept | Python | TypeScript |
|---------|--------|------------|
| Price scale ID | `price_scale_id` | `priceScaleId` |
| Time scale | `time_scale` | `timeScale` |
| Pane ID | `pane_id` | `paneId` |
| Price format | `price_format` | `priceFormat` |
| Price line | `price_line` | `priceLine` |
| Last value visible | `last_value_visible` | `lastValueVisible` |

### Color Properties

| Concept | Python | TypeScript |
|---------|--------|------------|
| Neutral color | `neutral_color` | `neutralColor` |
| Signal color | `signal_color` | `signalColor` |
| Alert color | `alert_color` | `alertColor` |
| Uptrend fill color | `uptrend_fill_color` | `uptrendFillColor` |
| Downtrend fill color | `downtrend_fill_color` | `downtrendFillColor` |
| Upper fill color | `upper_fill_color` | `upperFillColor` |
| Lower fill color | `lower_fill_color` | `lowerFillColor` |

---

## Special Cases

### Boundary Interfaces

Some TypeScript interfaces intentionally use `snake_case` because they represent data structures coming from Python before conversion:

```typescript
/**
 * IMPORTANT: Uses snake_case to match Python backend data.
 * Converted to camelCase before use in frontend.
 */
export interface SeriesConfigPatch {
  line_width?: number;      // From Python
  line_visible?: boolean;   // From Python
}

// Conversion function
function mapDialogConfigToAPI(configPatch: SeriesConfigPatch): APIConfig {
  return {
    lineWidth: configPatch.line_width,     // Convert to camelCase
    lineVisible: configPatch.line_visible, // Convert to camelCase
  };
}
```

**Rule**: Boundary interfaces that receive raw Python data use `snake_case`. Internal TypeScript interfaces use `camelCase`.

### Nested Options

For nested options objects (like `LineOptions`), the outer property uses the standard conversion:

```python
# Python
class RibbonSeries:
    def __init__(self):
        self._upper_line = LineOptions(...)  # Property name: upper_line
```

```typescript
// TypeScript
interface RibbonSeriesOptions {
    upperLine?: LineOptions;  // Property name: upperLine
}
```

### Boolean Properties

Boolean properties should use clear prefixes:

| Pattern | Python Example | TypeScript Example |
|---------|----------------|-------------------|
| `is_*` | `is_visible` | `isVisible` |
| `has_*` | `has_data` | `hasData` |
| `*_visible` | `fill_visible` | `fillVisible` |
| `*_enabled` | `zoom_enabled` | `zoomEnabled` |

---

## Validation Checklist

When adding new properties:

- [ ] Python property uses `snake_case`
- [ ] TypeScript property uses `camelCase`
- [ ] Conversion is automatic (no manual mapping)
- [ ] Property name is consistent with existing patterns
- [ ] Documentation updated with new property
- [ ] Tests verify both Python and TypeScript sides

---

## Common Mistakes to Avoid

### ❌ Incorrect

```python
# Python
self.fillVisible = True  # Should use snake_case

# TypeScript
interface Options {
    fill_visible: boolean;  // Should use camelCase
}
```

### ✅ Correct

```python
# Python
self.fill_visible = True  # snake_case

# TypeScript
interface Options {
    fillVisible: boolean;  // camelCase
}
```

---

## Tools and Utilities

### Python

- **Serialization**: `utils/serialization.py` - `snake_to_camel()` function
- **Validation**: Use `chainable_property` decorator for automatic validation
- **Linting**: Ruff enforces `snake_case` naming

### TypeScript

- **Linting**: ESLint enforces `camelCase` naming
- **Type checking**: TypeScript compiler catches naming mismatches
- **Interfaces**: All option interfaces use `camelCase`

---

## References

- **Python Style Guide**: [PEP 8](https://peps.python.org/pep-0008/)
- **TypeScript Style Guide**: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- **Project Codebase**: See `utils/serialization.py` for conversion implementation

---

## Version History

- **v0.1.6**: Initial naming conventions documentation
- Establishes `snake_case` for Python, `camelCase` for TypeScript
- Documents automatic conversion process
