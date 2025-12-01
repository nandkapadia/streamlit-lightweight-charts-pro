#!/usr/bin/env python3
"""
Test runner script for Streamlit Lightweight Charts Pro.

This script provides easy access to run different categories of tests.
"""

import argparse
import subprocess
import sys
from pathlib import Path


def run_tests(
    category=None,
    verbose=False,
    coverage=False,
    html_report=False,
    parallel=False,
    markers=None,
    test_file=None,
):
    """Run tests for the specified category."""
    # Base command
    cmd = ["python", "-m", "pytest"]

    # Add verbose flag
    if verbose:
        cmd.append("-v")

    # Add parallel execution
    if parallel:
        cmd.extend(["-n", "auto"])

    # Add markers if specified
    if markers:
        cmd.extend(["-m", markers])

    # Add coverage if requested
    if coverage:
        cmd.extend(["--cov=streamlit_lightweight_charts_pro"])
        if html_report:
            cmd.append("--cov-report=html")
        else:
            cmd.append("--cov-report=term-missing")

    # Determine test path based on category
    if test_file:
        # Run specific test file
        cmd.append(test_file)
    elif category is None:
        # Run all tests
        cmd.append(".")
    elif category in ["unit", "integration", "performance", "e2e"]:
        # Run specific test type
        cmd.append(f"{category}/")
    elif category in [
        "data",
        "series",
        "options",
        "frontend",
        "type_definitions",
        "utils",
        "component",
        "logging_tests",
    ]:
        # Run specific unit test category
        cmd.append(f"unit/{category}/")
    else:
        print(f"Unknown category: {category}")
        print("Available categories:")
        print("  Test Types: unit, integration, performance, e2e")
        print(
            "  Unit Categories: data, series, options, frontend, type_definitions, utils,"
            " component, logging_tests",
        )
        return 1

    # Run the tests
    print(f"Running tests: {' '.join(cmd)}")
    # Validate cmd to prevent injection
    if not cmd or not isinstance(cmd, list):
        raise TypeError("Invalid command: must be a non-empty list")
    for arg in cmd:
        if not isinstance(arg, str):
            raise TypeError(f"Invalid command argument: {arg} must be a string")

    result = subprocess.run(cmd, check=False, cwd=Path(__file__).parent, shell=False)

    return result.returncode


def list_categories():
    """List all available test categories."""
    print("Available test categories:")
    print()
    print("Test Types:")
    print("  unit              - All unit tests")
    print("  integration       - Integration tests")
    print("  performance       - Performance tests")
    print("  e2e               - End-to-end tests")
    print()
    print("Unit Test Categories:")
    print("  data              - Data classes tests")
    print("  series            - Series classes tests")
    print("  options           - Options classes tests")
    print("  frontend          - Frontend integration tests")
    print("  type_definitions  - Type definitions tests")
    print("  utils             - Utils module tests")
    print("  component         - Component module tests")
    print("  logging_tests     - Logging module tests")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Run tests for Streamlit Lightweight Charts Pro",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tests/run_tests.py                    # Run all tests
  python tests/run_tests.py unit               # Run all unit tests
  python tests/run_tests.py data               # Run data tests only
  python tests/run_tests.py data -v            # Run data tests with verbose output
  python tests/run_tests.py data -c            # Run data tests with coverage
  python tests/run_tests.py data -c --html     # Run data tests with HTML coverage report
  python tests/run_tests.py --list             # List all available categories
  python tests/run_tests.py --file test_file.py # Run specific test file
        """,
    )

    parser.add_argument(
        "category",
        nargs="?",
        help="Test category to run (default: all tests). Use --list to see all categories",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("-c", "--coverage", action="store_true", help="Generate coverage report")
    parser.add_argument("--html", action="store_true", help="Generate HTML coverage report")
    parser.add_argument("-p", "--parallel", action="store_true", help="Run tests in parallel")
    parser.add_argument("-m", "--markers", help="Run tests with specific markers")
    parser.add_argument("-f", "--file", help="Run specific test file")
    parser.add_argument("--list", action="store_true", help="List all available categories")

    args = parser.parse_args()

    if args.list:
        list_categories()
        return 0

    return run_tests(
        category=args.category,
        verbose=args.verbose,
        coverage=args.coverage,
        html_report=args.html,
        parallel=args.parallel,
        markers=args.markers,
        test_file=args.file,
    )


if __name__ == "__main__":
    sys.exit(main())
