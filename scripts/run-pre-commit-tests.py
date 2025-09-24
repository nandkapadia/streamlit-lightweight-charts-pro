#!/usr/bin/env python3
"""Pre-commit test runner for streamlit-lightweight-charts-pro.

This script runs a focused set of tests for pre-commit hooks to ensure
fast feedback while maintaining code quality.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Optional


def run_command(cmd: List[str], description: str, allow_failure: bool = False) -> bool:
    """Run a command and return success status."""
    print(f"🔍 {description}...")
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=not allow_failure,
            timeout=300,  # 5 minute timeout
            shell=False,  # Explicitly disable shell to prevent command injection
        )
        if result.returncode == 0:
            print(f"✅ {description} passed!")
            return True
        print(f"❌ {description} failed!")
        if result.stdout:
            print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} timed out!")
        return False
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}!")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False
    except Exception as e:
        print(f"💥 {description} failed with error: {e}")
        return False


def check_environment() -> bool:
    """Check if the environment is properly set up."""
    if not Path("pyproject.toml").exists():
        print("❌ Not in project root directory!")
        return False

    if not Path("tests").exists():
        print("❌ No tests directory found!")
        return False

    return True


def run_code_formatting() -> bool:
    """Run code formatting in the correct order: isort, autoflake, black."""
    print("\n📝 Running code formatting...")

    # Step 1: Run isort with --float-to-top
    print("🔧 Step 1: Organizing imports with isort (--float-to-top)...")
    if not run_command(
        ["python", "-m", "isort", "tests/", "--float-to-top"],
        "Import organization (isort with --float-to-top)",
    ):
        print("❌ isort failed!")
        return False

    # Step 2: Run autoflake
    print("🔧 Step 2: Removing unused imports and variables with autoflake...")
    if not run_command(
        [
            "python",
            "-m",
            "autoflake",
            "tests/",
            "--remove-all-unused-imports",
            "--remove-unused-variables",
            "--recursive",
            "--in-place",
        ],
        "Unused imports removal (autoflake)",
    ):
        print("❌ autoflake failed!")
        return False

    # Step 3: Run black
    print("🔧 Step 3: Formatting code with black...")
    if not run_command(
        ["python", "-m", "black", "tests/"],
        "Code formatting (black)",
    ):
        print("❌ black failed!")
        return False

    print("✅ All code formatting steps completed successfully!")
    return True


def run_unit_tests() -> bool:
    """Run unit tests with appropriate configuration (excluding performance tests)."""
    print("\n🧪 Running unit tests...")

    # Check if we're in CI
    ci_mode = os.getenv("CI") == "true" or os.getenv("GITHUB_ACTIONS") == "true"

    if ci_mode:
        # CI mode - run with coverage, exclude performance tests
        cmd = [
            "python",
            "-m",
            "pytest",
            "tests/unit/",
            "--tb=short",
            "-q",
            "--maxfail=3",
            "--cov=streamlit_lightweight_charts_pro",
            "--cov-report=term-missing",
            "--cov-fail-under=75",
            "--ignore=tests/performance/",
        ]
        description = "Unit tests with coverage (CI mode, no performance tests)"
    else:
        # Local mode - run quickly, exclude performance tests
        cmd = [
            "python",
            "-m",
            "pytest",
            "tests/unit/",
            "--tb=short",
            "-q",
            "--maxfail=3",
            "--ignore=tests/performance/",
        ]
        description = "Unit tests (local mode, no performance tests)"

    return run_command(cmd, description)


def run_critical_tests() -> bool:
    """Run critical tests that must pass (excluding performance tests)."""
    print("\n🔥 Running critical tests...")

    critical_test_files = [
        "tests/unit/test_chart.py",
        "tests/unit/data/test_annotation.py",
        "tests/unit/options/test_base_options.py",
        "tests/unit/series/test_series_base.py",
        "tests/unit/utils/test_chainable_comprehensive.py",
    ]

    # Check which test files exist
    existing_tests = [f for f in critical_test_files if Path(f).exists()]

    if not existing_tests:
        print("⚠️  No critical test files found!")
        return True

    cmd = [
        "python",
        "-m",
        "pytest",
        *existing_tests,
        "--tb=short",
        "-q",
        "--ignore=tests/performance/",
    ]
    return run_command(cmd, "Critical tests (no performance tests)")


def main() -> int:
    """Main function."""
    print("🚀 Starting pre-commit test suite...")

    # Check environment
    if not check_environment():
        return 1

    # Run code formatting
    if not run_code_formatting():
        print("\n❌ Code formatting failed!")
        return 1

    # Run unit tests
    if not run_unit_tests():
        print("\n❌ Unit tests failed!")
        return 1

    # Run critical tests
    if not run_critical_tests():
        print("\n❌ Critical tests failed!")
        return 1

    print("\n🎉 All pre-commit checks passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
