#!/usr/bin/env python3
"""
Quick launcher for the series test harness.

Usage:
    python run_test.py              # Run simple test
    python run_test.py --complete   # Run complete test harness
    python run_test.py --help       # Show help
"""

import subprocess
import sys
from pathlib import Path


def main():
    """Main launcher function."""
    # Get the directory of this script
    script_dir = Path(__file__).parent

    # Determine which test to run
    if len(sys.argv) > 1 and sys.argv[1] == "--complete":
        test_file = script_dir / "comprehensive_series_test.py"
        print("🚀 Launching Comprehensive Series Test...")
    elif len(sys.argv) > 1 and sys.argv[1] == "--help":
        print(__doc__)
        return None
    else:
        test_file = script_dir / "simple_series_test.py"
        print("🚀 Launching Simple Series Test...")

    # Check if test file exists
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        print("Available tests:")
        print("  - simple_series_test.py")
        print("  - comprehensive_series_test.py")
        return 1

    # Run the test
    try:
        cmd = [sys.executable, "-m", "streamlit", "run", str(test_file)]
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running test: {e}")
        return 1
    except KeyboardInterrupt:
        print("\n👋 Test interrupted by user")
        return 0
    else:
        return 0


if __name__ == "__main__":
    sys.exit(main())
