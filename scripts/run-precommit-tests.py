#!/usr/bin/env python3
"""Pre-commit test runner that excludes performance and large dataset tests.
This script provides a clean way to run tests for pre-commit hooks.
"""

import subprocess
import sys
from pathlib import Path


def run_tests(test_paths, extra_args=None):
    """Run tests with performance exclusions."""
    if extra_args is None:
        extra_args = []

    # Base arguments for excluding performance tests
    base_args = [
        sys.executable,
        "-m",
        "pytest",
        "--ignore=tests/performance/",
        "-p",
        "scripts.pytest_precommit_plugin",
        "--tb=short",
        "-q",
    ]

    # Add test paths
    args = base_args + test_paths + extra_args

    print(f"Running: {' '.join(args)}")

    try:
        result = subprocess.run(
            args,
            check=False,
            cwd=Path(__file__).parent.parent,
            shell=False,  # Explicitly disable shell to prevent command injection
        )
        return result.returncode
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python run-precommit-tests.py <test_paths> [extra_args...]")
        print("Example: python run-precommit-tests.py tests/unit/ --maxfail=3 -x")
        return 1

    test_paths = sys.argv[1].split()
    extra_args = sys.argv[2:] if len(sys.argv) > 2 else []

    return run_tests(test_paths, extra_args)


if __name__ == "__main__":
    sys.exit(main())
