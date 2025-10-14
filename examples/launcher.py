#!/usr/bin/env python3
"""Streamlit Lightweight Charts Pro - Examples Launcher

This launcher provides an interactive way to browse and run all examples
in the examples directory. It organizes examples by category and provides
descriptions for each example.
"""

import subprocess
import sys
from pathlib import Path

import streamlit as st

# Page configuration
st.set_page_config(
    page_title="Examples Launcher",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Get the examples directory
EXAMPLES_DIR = Path(__file__).parent

# Example categories and their descriptions
EXAMPLE_CATEGORIES = {
    "🚀 Getting Started": {
        "description": "Perfect for beginners. Start here to learn the basics!",
        "examples": {
            "minimal_example.py": {
                "title": "Minimal Example",
                "description": "The absolute minimum code needed to create a chart.",
                "path": "quick_start/minimal_example.py",
            },
            "basic_line_chart.py": {
                "title": "Basic Line Chart",
                "description": "Learn how to create your first line chart with sample data.",
                "path": "getting_started/basic_line_chart.py",
            },
            "data_formats.py": {
                "title": "Data Formats",
                "description": "Learn different ways to provide data to charts.",
                "path": "getting_started/data_formats.py",
            },
        },
    },
    "📊 Chart Types": {
        "description": "Comprehensive examples for each chart type with all features.",
        "examples": {
            "line_chart.py": {
                "title": "Line Chart",
                "description": "Comprehensive line chart with styling, price lines, and markers.",
                "path": "chart_types/line_chart.py",
            },
            "candlestick_chart.py": {
                "title": "Candlestick Chart",
                "description": "Professional OHLC candlestick chart with volume analysis.",
                "path": "chart_types/candlestick_chart.py",
            },
            "area_chart.py": {
                "title": "Area Chart",
                "description": "Filled area chart with customization options.",
                "path": "area_charts/basic_area_chart.py",
            },
            "bar_chart.py": {
                "title": "Bar Chart",
                "description": "Volume and OHLC bar chart with DataFrame integration.",
                "path": "bar_charts/basic_bar_chart.py",
            },
            "histogram_chart.py": {
                "title": "Histogram Chart",
                "description": "Volume and distribution chart with sample data.",
                "path": "histogram_charts/basic_histogram_chart.py",
            },
        },
    },
    "🔗 Chart Management": {
        "description": "Advanced chart positioning, linking, and management features.",
        "examples": {
            "chart_positioning_example.py": {
                "title": "Chart Positioning",
                "description": (
                    "Learn how to position charts anywhere using different layout approaches."
                ),
                "path": "chart_management/chart_positioning_example.py",
            },
            "linked_charts_example.py": {
                "title": "Linked Charts",
                "description": (
                    "Create synchronized charts with crosshair and time range interactions."
                ),
                "path": "chart_management/linked_charts_example.py",
            },
            "z_index_ordering_example.py": {
                "title": "Z-Index Ordering",
                "description": "Control the layering order of chart elements.",
                "path": "chart_management/z_index_ordering_example.py",
            },
        },
    },
    "🎯 Trading Features": {
        "description": "Trading-specific features and financial chart examples.",
        "examples": {
            "supertrend_example.py": {
                "title": "Supertrend Indicator",
                "description": (
                    "Supertrend indicator with TrendFill series for smooth trend visualization."
                ),
                "path": "trading_features/supertrend_example.py",
            },
            "signal_example.py": {
                "title": "Signal Series",
                "description": "Background coloring based on trading signals.",
                "path": "trading_features/signal_example.py",
            },
            "signal_series_example.py": {
                "title": "Advanced Signal Series",
                "description": "Advanced signal series with multiple signal types.",
                "path": "trading_features/signal_series_example.py",
            },
            "test_trend_fill_frontend.py": {
                "title": "Trend Fill Testing",
                "description": "Test the TrendFill series functionality.",
                "path": "trading_features/test_trend_fill_frontend.py",
            },
        },
    },
    "🎨 Advanced Features": {
        "description": (
            "Advanced functionality including customization, "
            "multi-pane charts, and interactive features."
        ),
        "examples": {
            "chart_customization.py": {
                "title": "Chart Customization",
                "description": "Learn how to customize charts with colors, styles, and options.",
                "path": "advanced_features/chart_customization.py",
            },
            "multi_pane_charts.py": {
                "title": "Multi-Pane Charts",
                "description": "Create professional multi-pane charts with different series types.",
                "path": "advanced_features/multi_pane_charts.py",
            },
            "interactive_features.py": {
                "title": "Interactive Features",
                "description": "Tooltips, legends, and interactive chart elements.",
                "path": "advanced_features/tooltip_examples.py",
            },
            "real_time_updates.py": {
                "title": "Real-Time Updates",
                "description": "Dynamic data updates and chart refreshing.",
                "path": "advanced_features/update_methods_example.py",
            },
        },
    },
    "🧪 Test Harness": {
        "description": "Comprehensive testing tools for all series types and features.",
        "examples": {
            "simple_series_test.py": {
                "title": "Simple Series Test",
                "description": "Quick test of all series types with minimal configuration - perfect for development testing.",
                "path": "test_harness/simple_series_test.py",
            },
            "comprehensive_series_test.py": {
                "title": "Comprehensive Series Test",
                "description": "Complete test harness with all features, annotations, and advanced configurations (lint-free).",
                "path": "test_harness/comprehensive_series_test.py",
            },
        },
    },
}


def run_example(example_path):
    """Run a Streamlit example."""
    full_path = EXAMPLES_DIR / example_path
    if full_path.exists():
        try:
            # Run the example in a subprocess
            # Validate paths to prevent command injection
            def _raise_invalid_python_path():
                raise ValueError("Invalid Python executable path")  # noqa: TRY301

            def _raise_invalid_file_path():
                raise ValueError(f"Invalid example file path: {full_path}")  # noqa: TRY301

            if not sys.executable or not Path(sys.executable).exists():
                _raise_invalid_python_path()
            if not full_path.exists() or not full_path.is_file():
                _raise_invalid_file_path()

            cmd = [sys.executable, "-m", "streamlit", "run", str(full_path)]
            subprocess.run(cmd, check=True, shell=False)
        except subprocess.CalledProcessError as e:
            st.error(f"Error running example: {e}")
        except Exception as e:
            st.error(f"Unexpected error: {e}")
    else:
        st.error(f"Example file not found: {example_path}")


def get_directory_examples(directory_path):
    """Get examples from a directory."""
    examples = {}
    dir_path = EXAMPLES_DIR / directory_path
    if dir_path.exists() and dir_path.is_dir():
        for file_path in dir_path.glob("*.py"):
            if file_path.name != "__init__.py" and not file_path.name.startswith("launcher"):
                examples[file_path.name] = {
                    "title": file_path.stem.replace("_", " ").title(),
                    "description": f"Example: {file_path.stem}",
                    "path": str(file_path.relative_to(EXAMPLES_DIR)),
                }
    return examples


def main():
    """Main launcher interface."""
    st.title("🚀 Streamlit Lightweight Charts Pro - Examples Launcher")

    st.markdown(
        """
    Welcome to the Examples Launcher! This interactive tool helps you browse and run
    all available examples organized by category. Click on any example to run it.
    """,
    )

    # Sidebar for navigation
    st.sidebar.title("📚 Categories")

    # Create tabs for each category
    tabs = st.tabs(list(EXAMPLE_CATEGORIES.keys()))

    for i, (category_name, category_info) in enumerate(EXAMPLE_CATEGORIES.items()):
        with tabs[i]:
            st.header(category_name)
            st.markdown(category_info["description"])

            # Handle directory examples
            for example_name, example_info in category_info["examples"].items():
                if example_info.get("is_directory"):
                    st.subheader(f"📁 {example_info['title']}")
                    st.markdown(example_info["description"])

                    # Get examples from directory
                    dir_examples = get_directory_examples(example_info["path"])
                    if dir_examples:
                        for file_name, file_info in dir_examples.items():
                            col1, col2 = st.columns([3, 1])
                            with col1:
                                st.markdown(f"**{file_info['title']}**")
                                st.caption(file_info["description"])
                            with col2:
                                if st.button(f"Run {file_name}", key=f"run_{file_name}"):
                                    run_example(file_info["path"])
                    else:
                        st.info("No examples found in this directory.")
                else:
                    # Handle individual file examples
                    col1, col2 = st.columns([3, 1])
                    with col1:
                        st.markdown(f"**{example_info['title']}**")
                        st.caption(example_info["description"])
                    with col2:
                        if st.button(f"Run {example_name}", key=f"run_{example_name}"):
                            run_example(example_info["path"])

            st.markdown("---")

    # Footer
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 📖 Documentation")
    st.sidebar.markdown("- [Main README](../README.md)")
    st.sidebar.markdown("- [Quick Reference](QUICK_REFERENCE.md)")
    st.sidebar.markdown("- [Examples README](README.md)")

    st.sidebar.markdown("### 🛠️ Development")
    st.sidebar.markdown("- [Installation Guide](../README.md#installation)")
    st.sidebar.markdown("- [API Documentation](../docs/)")
    st.sidebar.markdown("- [GitHub Repository](https://github.com/your-repo)")


if __name__ == "__main__":
    main()
