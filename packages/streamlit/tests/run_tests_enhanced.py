#!/usr/bin/env python3
"""
Enhanced test runner for Streamlit Lightweight Charts Pro.

This script provides comprehensive test execution with improved reporting,
performance monitoring, and test categorization.
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional


class EnhancedTestRunner:
    """Enhanced test runner with comprehensive reporting and monitoring."""

    def __init__(self):
        self.test_results = {}
        self.performance_metrics = {}
        self.test_categories = {
            "unit": "Unit tests for individual components",
            "integration": "Integration tests for component interactions",
            "performance": "Performance and scalability tests",
            "e2e": "End-to-end workflow tests",
            "property": "Property-based tests using hypothesis",
        }

        self.unit_subcategories = {
            "data": "Data classes and structures",
            "series": "Chart series implementations",
            "options": "Configuration and styling options",
            "frontend": "Frontend integration and rendering",
            "type_definitions": "Type definitions and enums",
            "utils": "Utility functions and helpers",
            "component": "Component module functionality",
            "logging_tests": "Logging and debugging features",
        }

    def run_tests(
        self,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        test_file: Optional[str] = None,
        verbose: bool = False,
        coverage: bool = False,
        html_report: bool = False,
        parallel: bool = False,
        markers: Optional[str] = None,
        performance: bool = False,
        property_based: bool = False,
        output_format: str = "text",
    ) -> int:
        """Run tests with enhanced options and reporting."""
        print("🚀 Enhanced Test Runner for Streamlit Lightweight Charts Pro")
        print("=" * 70)

        # Build command
        cmd = self._build_command(
            category,
            subcategory,
            test_file,
            verbose,
            coverage,
            html_report,
            parallel,
            markers,
            performance,
            property_based,
        )

        print(f"📋 Command: {' '.join(cmd)}")
        print(f"📁 Working Directory: {Path(__file__).parent}")
        print("-" * 70)

        # Run tests with timing
        start_time = time.perf_counter()
        # Validate cmd to prevent injection
        if not cmd or not isinstance(cmd, list):
            raise TypeError("Invalid command: must be a non-empty list")
        for arg in cmd:
            if not isinstance(arg, str):
                raise TypeError(f"Invalid command argument: {arg} must be a string")

        result = subprocess.run(
            cmd,
            check=False,
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )
        end_time = time.perf_counter()

        execution_time = end_time - start_time

        # Parse and display results
        self._display_results(result, execution_time, output_format)

        return result.returncode

    def _build_command(
        self,
        category: Optional[str],
        subcategory: Optional[str],
        test_file: Optional[str],
        verbose: bool,
        coverage: bool,
        html_report: bool,
        parallel: bool,
        markers: Optional[str],
        performance: bool,
        property_based: bool,
    ) -> List[str]:
        """Build the pytest command with all options."""
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

        # Add performance markers
        if performance:
            cmd.extend(["-m", "performance"])

        # Add property-based test markers
        if property_based:
            cmd.extend(["-m", "hypothesis"])

        # Add coverage if requested
        if coverage:
            cmd.extend(["--cov=streamlit_lightweight_charts_pro"])
            if html_report:
                cmd.append("--cov-report=html")
            else:
                cmd.append("--cov-report=term-missing")

        # Determine test path
        test_path = self._determine_test_path(category, subcategory, test_file)
        if test_path:
            cmd.append(test_path)

        return cmd

    def _determine_test_path(
        self,
        category: Optional[str],
        subcategory: Optional[str],
        test_file: Optional[str],
    ) -> Optional[str]:
        """Determine the test path based on category and subcategory."""
        if test_file:
            return test_file

        if category is None:
            return "."

        if category in self.test_categories:
            if subcategory and category == "unit" and subcategory in self.unit_subcategories:
                return f"unit/{subcategory}/"
            return f"{category}/"

        return None

    def _display_results(
        self,
        result: subprocess.CompletedProcess,
        execution_time: float,
        output_format: str,
    ):
        """Display test results in the specified format."""
        print(f"⏱️  Execution Time: {execution_time:.2f} seconds")
        print(f"📊 Exit Code: {result.returncode}")
        print("-" * 70)

        if output_format == "json":
            self._display_json_results(result, execution_time)
        else:
            self._display_text_results(result, execution_time)

        # Display summary
        self._display_summary(result, execution_time)

    def _display_text_results(self, result: subprocess.CompletedProcess, _execution_time: float):
        """Display results in text format."""
        if result.stdout:
            print("📤 STDOUT:")
            print(result.stdout)

        if result.stderr:
            print("⚠️  STDERR:")
            print(result.stderr)

    def _display_json_results(self, result: subprocess.CompletedProcess, execution_time: float):
        """Display results in JSON format."""
        output = {
            "exit_code": result.returncode,
            "execution_time": execution_time,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "success": result.returncode == 0,
        }

        print("📋 JSON Output:")
        print(json.dumps(output, indent=2))

    def _display_summary(self, result: subprocess.CompletedProcess, execution_time: float):
        """Display test execution summary."""
        print("=" * 70)
        if result.returncode == 0:
            print("✅ All tests passed successfully!")
        else:
            print("❌ Some tests failed.")

        print(f"⏱️  Total execution time: {execution_time:.2f} seconds")
        print("=" * 70)

    def list_categories(self):
        """List all available test categories and subcategories."""
        print("📚 Available Test Categories:")
        print("=" * 50)

        for category, description in self.test_categories.items():
            print(f"\n🔹 {category.upper()}")
            print(f"   {description}")

            if category == "unit":
                print("   Subcategories:")
                for subcat, subdesc in self.unit_subcategories.items():
                    print(f"     • {subcat}: {subdesc}")

    def run_performance_tests(self, verbose: bool = False) -> int:
        """Run performance tests specifically."""
        print("🚀 Running Performance Tests")
        print("=" * 40)

        return self.run_tests(
            category="performance",
            verbose=verbose,
            performance=True,
            output_format="text",
        )

    def run_property_based_tests(self, verbose: bool = False) -> int:
        """Run property-based tests specifically."""
        print("🔬 Running Property-Based Tests")
        print("=" * 40)

        return self.run_tests(
            category="unit",
            verbose=verbose,
            property_based=True,
            output_format="text",
        )

    def generate_test_report(self, output_file: str = "test_report.json"):
        """Generate a comprehensive test report."""
        print(f"📊 Generating test report: {output_file}")

        # Run all tests to collect data
        result = self.run_tests(category=None, verbose=False, coverage=True, output_format="json")

        # Save report
        report_data = {
            "timestamp": time.time(),
            "exit_code": result,
            "test_categories": self.test_categories,
            "unit_subcategories": self.unit_subcategories,
        }

        with Path(output_file).open("w") as f:
            json.dump(report_data, f, indent=2)

        print(f"✅ Test report saved to: {output_file}")


def main():
    """Main entry point for the enhanced test runner."""
    parser = argparse.ArgumentParser(
        description="Enhanced test runner for Streamlit Lightweight Charts Pro",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all tests
  python run_tests_enhanced.py

  # Run unit tests only
  python run_tests_enhanced.py --category unit

  # Run specific unit subcategory
  python run_tests_enhanced.py --category unit --subcategory series

  # Run performance tests
  python run_tests_enhanced.py --performance

  # Run property-based tests
  python run_tests_enhanced.py --property-based

  # Generate test report
  python run_tests_enhanced.py --generate-report

  # List all categories
  python run_tests_enhanced.py --list-categories
        """,
    )

    # Test execution options
    parser.add_argument(
        "--category",
        choices=["unit", "integration", "performance", "e2e"],
        help="Test category to run",
    )

    parser.add_argument("--subcategory", help="Unit test subcategory (e.g., data, series, options)")

    parser.add_argument("--test-file", help="Specific test file to run")

    # Output and reporting options
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")

    parser.add_argument("--coverage", action="store_true", help="Generate coverage report")

    parser.add_argument("--html-report", action="store_true", help="Generate HTML coverage report")

    parser.add_argument("--parallel", action="store_true", help="Run tests in parallel")

    parser.add_argument("--markers", help="Run tests with specific markers")

    parser.add_argument(
        "--output-format",
        choices=["text", "json"],
        default="text",
        help="Output format for results",
    )

    # Special test types
    parser.add_argument("--performance", action="store_true", help="Run performance tests")

    parser.add_argument("--property-based", action="store_true", help="Run property-based tests")

    # Utility options
    parser.add_argument(
        "--list-categories",
        action="store_true",
        help="List all available test categories",
    )

    parser.add_argument(
        "--generate-report",
        action="store_true",
        help="Generate comprehensive test report",
    )

    args = parser.parse_args()

    runner = EnhancedTestRunner()

    # Handle special commands
    if args.list_categories:
        runner.list_categories()
        return 0

    if args.generate_report:
        runner.generate_test_report()
        return 0

    if args.performance:
        return runner.run_performance_tests(verbose=args.verbose)

    if args.property_based:
        return runner.run_property_based_tests(verbose=args.verbose)

    # Run regular tests
    return runner.run_tests(
        category=args.category,
        subcategory=args.subcategory,
        test_file=args.test_file,
        verbose=args.verbose,
        coverage=args.coverage,
        html_report=args.html_report,
        parallel=args.parallel,
        markers=args.markers,
        performance=args.performance,
        property_based=args.property_based,
        output_format=args.output_format,
    )


if __name__ == "__main__":
    sys.exit(main())
