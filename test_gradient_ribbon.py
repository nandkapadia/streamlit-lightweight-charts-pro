#!/usr/bin/env python3
"""Simple test for gradient ribbon series."""

import random

import streamlit as st

from streamlit_lightweight_charts_pro import Chart, GradientRibbonSeries
from streamlit_lightweight_charts_pro.data import GradientRibbonData

st.title("Gradient Ribbon Test")

# Create simple test data with explicit gradient values
data = []
for i in range(20):
    gradient_value = i / 19.0  # Gradient from 0 to 1
    data.append(
        GradientRibbonData(
            time=f"2024-01-{i + 1:02d}",
            upper=110 + i * 0.5,
            lower=90 + i * 0.5,
            gradient=gradient_value,  # Explicit gradient values
        ),
    )

# Create gradient ribbon series
gradient_ribbon_series = GradientRibbonSeries(
    data=data,
    gradient_start_color="#00FF00",  # Bright green
    gradient_end_color="#FF0000",  # Bright red
    normalize_gradients=False,  # Use gradient values as-is (0-1)
)

# Create chart and render
chart = Chart(series=gradient_ribbon_series)
chart.render(key="gradient_test")

st.write("**Expected**: Gradient should go from green (left) to red (right)")
st.write(f"**Data points**: {len(data)}")
