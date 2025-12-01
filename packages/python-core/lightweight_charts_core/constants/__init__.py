"""Global constants for streamlit-lightweight-charts-pro.

This module contains all magic numbers, colors, timeouts, and other hardcoded
values used throughout the library. Centralizing these values makes it easier
to maintain consistency and modify behavior across the codebase.

Author: Nand Kapadia
License: MIT
"""

from typing import Final

# ============================================================================
# COLOR CONSTANTS - RGBA Format
# ============================================================================

# === Primary Material Design Colors ===
# Material Design Green 500 - Used for positive/up movements
COLOR_GREEN_MATERIAL: Final[str] = "#4CAF50"  # rgb(76, 175, 80)
COLOR_GREEN_TEAL: Final[str] = "#26A69A"  # rgb(38, 166, 154)

# Material Design Red 500 - Used for negative/down movements
COLOR_RED_MATERIAL: Final[str] = "#F44336"  # rgb(244, 67, 54)
COLOR_RED_CORAL: Final[str] = "#EF5350"  # rgb(239, 83, 80)

# Material Design Blue 500 - Used for neutral/primary elements
COLOR_BLUE_MATERIAL: Final[str] = "#2196F3"  # rgb(33, 150, 243)
COLOR_BLUE_PRIMARY: Final[str] = "#2962FF"  # rgb(41, 98, 255)

# Gray/Neutral
COLOR_GRAY_NEUTRAL: Final[str] = "#808080"  # rgb(128, 128, 128)

# Black & White
COLOR_BLACK: Final[str] = "#000000"  # rgb(0, 0, 0)
COLOR_WHITE: Final[str] = "#FFFFFF"  # rgb(255, 255, 255)

# === Opacity Levels ===
OPACITY_TRANSPARENT: Final[float] = 0.0  # Fully transparent
OPACITY_VERY_LIGHT: Final[float] = 0.05  # Very subtle
OPACITY_LIGHT: Final[float] = 0.1  # Light transparency
OPACITY_MEDIUM_LIGHT: Final[float] = 0.2  # Medium-light
OPACITY_MEDIUM: Final[float] = 0.3  # Medium transparency
OPACITY_MEDIUM_DARK: Final[float] = 0.4  # Medium-dark
OPACITY_SEMI: Final[float] = 0.5  # Half opacity
OPACITY_DARK: Final[float] = 0.7  # Dark/prominent
OPACITY_VERY_DARK: Final[float] = 0.8  # Very prominent
OPACITY_ALMOST_OPAQUE: Final[float] = 0.9  # Almost fully opaque
OPACITY_SEMI_TRANSPARENT: Final[float] = 0.95  # Very slight transparency
OPACITY_OPAQUE: Final[float] = 1.0  # Fully opaque

# === RGBA Color Combinations ===

# --- Green Variants (Positive/Up/Uptrend) ---
COLOR_GREEN_VERY_LIGHT: Final[str] = "rgba(76, 175, 80, 0.05)"
COLOR_GREEN_LIGHT: Final[str] = "rgba(76, 175, 80, 0.1)"
COLOR_GREEN_MEDIUM: Final[str] = "rgba(76, 175, 80, 0.3)"
COLOR_GREEN_SOLID: Final[str] = "rgba(76, 175, 80, 1)"

COLOR_TEAL_VERY_LIGHT: Final[str] = "rgba(38, 166, 154, 0.05)"
COLOR_TEAL_LIGHT: Final[str] = "rgba(38, 166, 154, 0.28)"
COLOR_TEAL_SEMI: Final[str] = "rgba(38, 166, 154, 0.5)"
COLOR_TEAL_SOLID: Final[str] = "rgba(38, 166, 154, 1)"

# --- Red Variants (Negative/Down/Downtrend) ---
COLOR_RED_VERY_LIGHT: Final[str] = "rgba(244, 67, 54, 0.05)"
COLOR_RED_LIGHT: Final[str] = "rgba(244, 67, 54, 0.1)"
COLOR_RED_MEDIUM: Final[str] = "rgba(244, 67, 54, 0.3)"
COLOR_RED_SOLID: Final[str] = "rgba(244, 67, 54, 1)"

COLOR_CORAL_VERY_LIGHT: Final[str] = "rgba(239, 83, 80, 0.05)"
COLOR_CORAL_LIGHT: Final[str] = "rgba(239, 83, 80, 0.28)"
COLOR_CORAL_SEMI: Final[str] = "rgba(239, 83, 80, 0.5)"
COLOR_CORAL_SOLID: Final[str] = "rgba(239, 83, 80, 1)"

# --- Blue Variants (Neutral/Primary) ---
COLOR_BLUE_TRANSPARENT: Final[str] = "rgba(33, 150, 243, 0.0)"
COLOR_BLUE_VERY_LIGHT: Final[str] = "rgba(33, 150, 243, 0.05)"
COLOR_BLUE_LIGHT: Final[str] = "rgba(33, 150, 243, 0.1)"
COLOR_BLUE_MEDIUM_LIGHT: Final[str] = "rgba(33, 150, 243, 0.2)"
COLOR_BLUE_MEDIUM: Final[str] = "rgba(33, 150, 243, 0.3)"
COLOR_BLUE_MEDIUM_DARK: Final[str] = "rgba(33, 150, 243, 0.4)"
COLOR_BLUE_SOLID: Final[str] = "rgba(33, 150, 243, 1)"

COLOR_BLUE_PRIMARY_LIGHT: Final[str] = "rgba(41, 98, 255, 0.1)"
COLOR_BLUE_PRIMARY_MEDIUM_LIGHT: Final[str] = "rgba(41, 98, 255, 0.28)"
COLOR_BLUE_PRIMARY_MEDIUM: Final[str] = "rgba(41, 98, 255, 0.3)"
COLOR_BLUE_PRIMARY_SEMI: Final[str] = "rgba(41, 98, 255, 0.5)"

# --- Gray/Neutral Variants ---
COLOR_GRAY_LIGHT: Final[str] = "rgba(128, 128, 128, 0.1)"
COLOR_GRAY_MEDIUM: Final[str] = "rgba(128, 128, 128, 0.3)"

# --- Black Variants (Backgrounds/Overlays) ---
COLOR_BLACK_VERY_LIGHT: Final[str] = "rgba(0, 0, 0, 0.1)"
COLOR_BLACK_LIGHT: Final[str] = "rgba(0, 0, 0, 0.2)"
COLOR_BLACK_MEDIUM: Final[str] = "rgba(0, 0, 0, 0.4)"
COLOR_BLACK_DARK: Final[str] = "rgba(0, 0, 0, 0.7)"
COLOR_BLACK_VERY_DARK: Final[str] = "rgba(0, 0, 0, 0.8)"

# --- White Variants (Backgrounds/UI) ---
COLOR_WHITE_VERY_LIGHT: Final[str] = "rgba(255, 255, 255, 0.1)"
COLOR_WHITE_LIGHT: Final[str] = "rgba(255, 255, 255, 0.2)"
COLOR_WHITE_DARK: Final[str] = "rgba(255, 255, 255, 0.8)"
COLOR_WHITE_VERY_DARK: Final[str] = "rgba(255, 255, 255, 0.9)"
COLOR_WHITE_SEMI_TRANSPARENT: Final[str] = "rgba(255, 255, 255, 0.95)"

# === Border Colors ===
COLOR_BORDER_DEFAULT: Final[str] = "rgba(197, 203, 206, 0.8)"

# ============================================================================
# SERIES DEFAULT COLORS
# ============================================================================

# --- Area Series ---
AREA_TOP_COLOR_DEFAULT: Final[str] = COLOR_BLUE_MEDIUM_DARK  # "rgba(33, 150, 243, 0.4)"
AREA_BOTTOM_COLOR_DEFAULT: Final[str] = COLOR_BLUE_TRANSPARENT  # "rgba(33, 150, 243, 0.0)"

# --- Histogram/Volume Series ---
HISTOGRAM_UP_COLOR_DEFAULT: Final[str] = COLOR_TEAL_SEMI  # "rgba(38, 166, 154, 0.5)"
HISTOGRAM_DOWN_COLOR_DEFAULT: Final[str] = COLOR_CORAL_SEMI  # "rgba(239, 83, 80, 0.5)"

# --- Baseline Series ---
BASELINE_TOP_FILL_COLOR1: Final[str] = COLOR_TEAL_LIGHT  # "rgba(38, 166, 154, 0.28)"
BASELINE_TOP_FILL_COLOR2: Final[str] = COLOR_TEAL_VERY_LIGHT  # "rgba(38, 166, 154, 0.05)"
BASELINE_TOP_LINE_COLOR: Final[str] = COLOR_TEAL_SOLID  # "rgba(38, 166, 154, 1)"
BASELINE_BOTTOM_FILL_COLOR1: Final[str] = COLOR_CORAL_VERY_LIGHT  # "rgba(239, 83, 80, 0.05)"
BASELINE_BOTTOM_FILL_COLOR2: Final[str] = COLOR_CORAL_LIGHT  # "rgba(239, 83, 80, 0.28)"
BASELINE_BOTTOM_LINE_COLOR: Final[str] = COLOR_CORAL_SOLID  # "rgba(239, 83, 80, 1)"

# --- Band Series ---
BAND_UPPER_FILL_COLOR: Final[str] = COLOR_GREEN_LIGHT  # "rgba(76, 175, 80, 0.1)"
BAND_LOWER_FILL_COLOR: Final[str] = COLOR_RED_LIGHT  # "rgba(244, 67, 54, 0.1)"

# --- Ribbon Series ---
RIBBON_FILL_COLOR: Final[str] = COLOR_GREEN_LIGHT  # "rgba(76, 175, 80, 0.1)"

# ============================================================================
# UI ELEMENT COLORS
# ============================================================================

# --- Tooltips ---
TOOLTIP_BACKGROUND_COLOR: Final[str] = COLOR_WHITE_SEMI_TRANSPARENT  # "rgba(255, 255, 255, 0.95)"
TOOLTIP_BOX_SHADOW: Final[str] = "0 2px 4px rgba(0, 0, 0, 0.1)"

# --- Annotations ---
ANNOTATION_BACKGROUND_COLOR: Final[str] = COLOR_WHITE_VERY_DARK  # "rgba(255, 255, 255, 0.9)"
ANNOTATION_EXAMPLE_BACKGROUND: Final[str] = "rgba(0, 255, 0, 0.2)"  # Green highlight

# --- Trade Visualization ---
TRADE_ANNOTATION_BACKGROUND: Final[str] = COLOR_WHITE_DARK  # "rgba(255, 255, 255, 0.8)"
TRADE_RECTANGLE_TEXT_BACKGROUND: Final[str] = COLOR_BLACK_DARK  # "rgba(0, 0, 0, 0.7)"

# --- Legends ---
LEGEND_BACKGROUND_COLOR: Final[str] = COLOR_BLACK_VERY_DARK  # "rgba(0, 0, 0, 0.8)"

# --- Layout ---
LAYOUT_WATERMARK_COLOR: Final[str] = COLOR_WHITE_VERY_LIGHT  # "rgba(255, 255, 255, 0.1)"

# ============================================================================
# TIMEOUTS (milliseconds)
# ============================================================================

TIMEOUT_CHART_READY: Final[int] = 100  # Time to wait for chart initialization
TIMEOUT_DEBOUNCE_RESIZE: Final[int] = 100  # Debounce window resize events
TIMEOUT_PRIMITIVE_ATTACH: Final[int] = 50  # Time to wait before attaching primitives

# ============================================================================
# DIMENSIONS
# ============================================================================

# Line widths
LINE_WIDTH_THIN: Final[int] = 1  # Thin line (1 pixel)
LINE_WIDTH_STANDARD: Final[int] = 2  # Standard line width
LINE_WIDTH_THICK: Final[int] = 4  # Thick line (emphasis)

# Padding/Spacing
PADDING_SMALL: Final[int] = 4  # Small padding
PADDING_MEDIUM: Final[int] = 8  # Medium padding
PADDING_LARGE: Final[int] = 12  # Large padding

# ============================================================================
# CHART DIMENSIONS
# ============================================================================

MIN_CHART_WIDTH: Final[int] = 200  # Minimum chart width in pixels
MIN_CHART_HEIGHT: Final[int] = 100  # Minimum chart height in pixels
DEFAULT_CHART_HEIGHT: Final[int] = 400  # Default chart height

# ============================================================================
# Z-INDEX LAYERS
# ============================================================================

Z_INDEX_BASE: Final[int] = 0  # Base layer
Z_INDEX_SERIES: Final[int] = 1  # Series layer
Z_INDEX_PRIMITIVES: Final[int] = 2  # Primitives layer
Z_INDEX_ANNOTATIONS: Final[int] = 3  # Annotations layer
Z_INDEX_UI: Final[int] = 4  # UI elements (legends, tooltips)
Z_INDEX_DIALOG: Final[int] = 5  # Modal dialogs
Z_INDEX_OVERLAY: Final[int] = 6  # Full-screen overlays

# ============================================================================
# PERFORMANCE THRESHOLDS
# ============================================================================

MAX_DATA_POINTS_WARNING: Final[int] = 10000  # Warn when data exceeds this
MAX_SERIES_PER_CHART: Final[int] = 10  # Recommended max series per chart

# ============================================================================
# VALIDATION CONSTANTS
# ============================================================================

COLOR_HEX_REGEX: Final[str] = r"^#(?:[0-9a-fA-F]{3}){1,2}$"
COLOR_RGBA_REGEX: Final[str] = r"^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$"

# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    "ANNOTATION_BACKGROUND_COLOR",
    "ANNOTATION_EXAMPLE_BACKGROUND",
    "AREA_BOTTOM_COLOR_DEFAULT",
    # Series defaults
    "AREA_TOP_COLOR_DEFAULT",
    "BAND_LOWER_FILL_COLOR",
    "BAND_UPPER_FILL_COLOR",
    "BASELINE_BOTTOM_FILL_COLOR1",
    "BASELINE_BOTTOM_FILL_COLOR2",
    "BASELINE_BOTTOM_LINE_COLOR",
    "BASELINE_TOP_FILL_COLOR1",
    "BASELINE_TOP_FILL_COLOR2",
    "BASELINE_TOP_LINE_COLOR",
    "COLOR_BLACK",
    "COLOR_BLACK_DARK",
    "COLOR_BLACK_LIGHT",
    "COLOR_BLACK_MEDIUM",
    "COLOR_BLACK_VERY_DARK",
    # Black variants
    "COLOR_BLACK_VERY_LIGHT",
    "COLOR_BLUE_LIGHT",
    "COLOR_BLUE_MATERIAL",
    "COLOR_BLUE_MEDIUM",
    "COLOR_BLUE_MEDIUM_DARK",
    "COLOR_BLUE_MEDIUM_LIGHT",
    "COLOR_BLUE_PRIMARY",
    "COLOR_BLUE_PRIMARY_LIGHT",
    "COLOR_BLUE_PRIMARY_MEDIUM",
    "COLOR_BLUE_PRIMARY_MEDIUM_LIGHT",
    "COLOR_BLUE_PRIMARY_SEMI",
    "COLOR_BLUE_SOLID",
    # Blue variants
    "COLOR_BLUE_TRANSPARENT",
    "COLOR_BLUE_VERY_LIGHT",
    # Border colors
    "COLOR_BORDER_DEFAULT",
    "COLOR_CORAL_LIGHT",
    "COLOR_CORAL_SEMI",
    "COLOR_CORAL_SOLID",
    "COLOR_CORAL_VERY_LIGHT",
    # Gray variants
    "COLOR_GRAY_LIGHT",
    "COLOR_GRAY_MEDIUM",
    "COLOR_GRAY_NEUTRAL",
    "COLOR_GREEN_LIGHT",
    # Base colors
    "COLOR_GREEN_MATERIAL",
    "COLOR_GREEN_MEDIUM",
    "COLOR_GREEN_SOLID",
    "COLOR_GREEN_TEAL",
    # Green variants
    "COLOR_GREEN_VERY_LIGHT",
    # Validation
    "COLOR_HEX_REGEX",
    "COLOR_RED_CORAL",
    "COLOR_RED_LIGHT",
    "COLOR_RED_MATERIAL",
    "COLOR_RED_MEDIUM",
    "COLOR_RED_SOLID",
    # Red variants
    "COLOR_RED_VERY_LIGHT",
    "COLOR_RGBA_REGEX",
    "COLOR_TEAL_LIGHT",
    "COLOR_TEAL_SEMI",
    "COLOR_TEAL_SOLID",
    "COLOR_TEAL_VERY_LIGHT",
    "COLOR_WHITE",
    "COLOR_WHITE_DARK",
    "COLOR_WHITE_LIGHT",
    "COLOR_WHITE_SEMI_TRANSPARENT",
    "COLOR_WHITE_VERY_DARK",
    # White variants
    "COLOR_WHITE_VERY_LIGHT",
    "DEFAULT_CHART_HEIGHT",
    "HISTOGRAM_DOWN_COLOR_DEFAULT",
    "HISTOGRAM_UP_COLOR_DEFAULT",
    "LAYOUT_WATERMARK_COLOR",
    "LEGEND_BACKGROUND_COLOR",
    "LINE_WIDTH_STANDARD",
    "LINE_WIDTH_THICK",
    # Dimensions
    "LINE_WIDTH_THIN",
    # Performance
    "MAX_DATA_POINTS_WARNING",
    "MAX_SERIES_PER_CHART",
    "MIN_CHART_HEIGHT",
    # Chart dimensions
    "MIN_CHART_WIDTH",
    "OPACITY_ALMOST_OPAQUE",
    "OPACITY_DARK",
    "OPACITY_LIGHT",
    "OPACITY_MEDIUM",
    "OPACITY_MEDIUM_DARK",
    "OPACITY_MEDIUM_LIGHT",
    "OPACITY_OPAQUE",
    "OPACITY_SEMI",
    "OPACITY_SEMI_TRANSPARENT",
    # Opacity levels
    "OPACITY_TRANSPARENT",
    "OPACITY_VERY_DARK",
    "OPACITY_VERY_LIGHT",
    "PADDING_LARGE",
    "PADDING_MEDIUM",
    "PADDING_SMALL",
    "RIBBON_FILL_COLOR",
    # Timeouts
    "TIMEOUT_CHART_READY",
    "TIMEOUT_DEBOUNCE_RESIZE",
    "TIMEOUT_PRIMITIVE_ATTACH",
    # UI elements
    "TOOLTIP_BACKGROUND_COLOR",
    "TOOLTIP_BOX_SHADOW",
    "TRADE_ANNOTATION_BACKGROUND",
    "TRADE_RECTANGLE_TEXT_BACKGROUND",
    "Z_INDEX_ANNOTATIONS",
    # Z-index
    "Z_INDEX_BASE",
    "Z_INDEX_DIALOG",
    "Z_INDEX_OVERLAY",
    "Z_INDEX_PRIMITIVES",
    "Z_INDEX_SERIES",
    "Z_INDEX_UI",
]
