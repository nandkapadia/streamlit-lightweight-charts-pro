#!/usr/bin/env python3
"""
Streamlit Lightweight Charts Pro - Examples Launcher

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
    page_title="Examples Launcher", page_icon="🚀", layout="wide", initial_sidebar_state="expanded"
)

# Get the examples directory
EXAMPLES_DIR = Path(__file__).parent

# Example categories and their descriptions
EXAMPLE_CATEGORIES = {
    "📚 Tutorials": {
        "description": "Step-by-step tutorials for complete beginners. Start here if you're new to the library!",
        "examples": {
            "tutorial_01_hello_world.py": {
                "title": "Tutorial 1: Hello World",
                "description": "Create your very first chart - perfect for absolute beginners.",
                "path": "tutorials/tutorial_01_hello_world.py",
            },
            "tutorial_02_data_formats.py": {
                "title": "Tutorial 2: Data Formats",
                "description": "Learn about different ways to provide data to charts.",
                "path": "tutorials/tutorial_02_data_formats.py",
            },
            "tutorial_03_customizing_charts.py": {
                "title": "Tutorial 3: Customizing Charts",
                "description": "Learn how to customize colors, styles, and layouts.",
                "path": "tutorials/tutorial_03_customizing_charts.py",
            },
        },
    },
    "⚡ Quick Start": {
        "description": "Copy-paste ready examples for immediate use. Perfect for testing your installation!",
        "examples": {
            "minimal_example.py": {
                "title": "Minimal Example",
                "description": "The absolute minimum code needed to create a chart.",
                "path": "quick_start/minimal_example.py",
            },
            "from_csv.py": {
                "title": "Load from CSV",
                "description": "Load data from a CSV file and create a chart.",
                "path": "quick_start/from_csv.py",
            },
            "candlestick_example.py": {
                "title": "Candlestick Chart",
                "description": "Create a professional candlestick chart for financial data.",
                "path": "quick_start/candlestick_example.py",
            },
        },
    },
    "🚀 Getting Started": {
        "description": "Basic examples to get you up and running quickly.",
        "examples": {
            "pane_heights_example.py": {
                "title": "Multi-Pane Charts",
                "description": (
                    "Learn how to create multi-pane charts with custom heights and layouts."
                ),
                "path": "getting_started/pane_heights_example.py",
            },
        },
    },
    "🎯 Common Patterns": {
        "description": "Real-world patterns and solutions for common use cases.",
        "examples": {
            "dashboard_layout.py": {
                "title": "Dashboard Layout",
                "description": "Create professional multi-chart dashboard layouts.",
                "path": "common_patterns/dashboard_layout.py",
            },
        },
    },
    "📊 Chart Types": {
        "description": "Examples for each supported chart type with various configurations.",
        "examples": {
            "line_chart_basic.py": {
                "title": "Basic Line Chart",
                "description": "Simple line chart with default styling and sample data.",
                "path": "line_charts/line_chart_basic.py",
            },
            "line_chart_advanced.py": {
                "title": "Advanced Line Chart",
                "description": "Line chart with markers, price lines, and custom styling.",
                "path": "line_charts/line_chart_advanced.py",
            },
            "line_chart_dataframe.py": {
                "title": "Line Chart from DataFrame",
                "description": "Create line charts from pandas DataFrames with column mapping.",
                "path": "line_charts/line_chart_dataframe.py",
            },
            "basic_candlestick_chart.py": {
                "title": "Basic Candlestick Chart",
                "description": "OHLC data visualization with candlestick series.",
                "path": "candlestick_charts/basic_candlestick_chart.py",
            },
            "customized_candlestick_chart.py": {
                "title": "Customized Candlestick Chart",
                "description": "Advanced candlestick chart with custom colors and styling.",
                "path": "candlestick_charts/customized_candlestick_chart.py",
            },
            "basic_bar_chart.py": {
                "title": "Basic Bar Chart",
                "description": "Bar chart with OHLC data and DataFrame integration.",
                "path": "bar_charts/basic_bar_chart.py",
            },
            "customized_bar_chart.py": {
                "title": "Customized Bar Chart",
                "description": "Advanced bar chart with custom styling and colors.",
                "path": "bar_charts/customized_bar_chart.py",
            },
            "basic_area_chart.py": {
                "title": "Basic Area Chart",
                "description": "Filled area chart with sample data and DataFrame support.",
                "path": "area_charts/basic_area_chart.py",
            },
            "customized_area_chart.py": {
                "title": "Customized Area Chart",
                "description": "Advanced area chart with custom colors and styling.",
                "path": "area_charts/customized_area_chart.py",
            },
            "basic_histogram_chart.py": {
                "title": "Basic Histogram Chart",
                "description": "Volume and distribution chart with sample data.",
                "path": "histogram_charts/basic_histogram_chart.py",
            },
            "customized_histogram_chart.py": {
                "title": "Customized Histogram Chart",
                "description": "Advanced histogram chart with custom styling.",
                "path": "histogram_charts/customized_histogram_chart.py",
            },
            "basic_baseline_chart.py": {
                "title": "Basic Baseline Chart",
                "description": "Baseline comparison chart with sample data.",
                "path": "baseline_charts/basic_baseline_chart.py",
            },
            "customized_baseline_chart.py": {
                "title": "Customized Baseline Chart",
                "description": "Advanced baseline chart with custom styling.",
                "path": "baseline_charts/customized_baseline_chart.py",
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
        "description": "Advanced functionality including legends, tooltips, and custom styling.",
        "examples": {
            "legend_example.py": {
                "title": "Legend Examples",
                "description": "Multi-pane charts with legends and custom HTML templates.",
                "path": "advanced_features/legend_example.py",
            },
            "tooltip_examples.py": {
                "title": "Tooltip Examples",
                "description": "Comprehensive tooltip functionality with various use cases.",
                "path": "advanced_features/tooltip_examples.py",
            },
            "tooltip_demo.py": {
                "title": "Tooltip Demo",
                "description": "Interactive tooltip demonstration.",
                "path": "advanced_features/tooltip_demo.py",
            },
            "ribbon_example.py": {
                "title": "Ribbon Example",
                "description": "Ribbon chart visualization example.",
                "path": "advanced_features/ribbon_example.py",
            },
            "gradient_ribbon_example.py": {
                "title": "Gradient Ribbon Example",
                "description": "Gradient ribbon series with dynamic color transitions based on data values.",
                "path": "advanced_features/gradient_ribbon_example.py",
            },
            "auto_size_example.py": {
                "title": "Auto Sizing",
                "description": "Dynamic chart sizing based on container.",
                "path": "advanced_features/auto_size_example.py",
            },
            "update_methods_example.py": {
                "title": "Update Methods",
                "description": "Real-time data updates and chart refreshing.",
                "path": "advanced_features/update_methods_example.py",
            },
            "multi_pane_legends_example.py": {
                "title": "Multi-Pane Legends",
                "description": "Complex legend configurations for multi-pane charts.",
                "path": "advanced_features/multi_pane_legends_example.py",
            },
        },
    },
    "🧪 Testing": {
        "description": "Test files and validation scripts for development and debugging.",
        "examples": {
            "comprehensive_error_test.py": {
                "title": "Comprehensive Error Test",
                "description": "Test various error scenarios and edge cases.",
                "path": "testing/comprehensive_error_test.py",
            },
            "error_handling_test.py": {
                "title": "Error Handling Test",
                "description": "Test error handling and recovery mechanisms.",
                "path": "testing/error_handling_test.py",
            },
            "fit_content_test.py": {
                "title": "Fit Content Test",
                "description": "Test chart auto-fitting and content sizing.",
                "path": "testing/fit_content_test.py",
            },
            "annotation_structure_test.py": {
                "title": "Annotation Structure Test",
                "description": "Test annotation system and structure validation.",
                "path": "testing/annotation_structure_test.py",
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
            cmd = [sys.executable, "-m", "streamlit", "run", str(full_path)]
            subprocess.run(cmd, check=True)
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
    """
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
