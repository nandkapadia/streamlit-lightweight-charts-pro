#!/usr/bin/env python3
"""Quick launcher for the Vue3 backend test harness.

Usage:
    python run_vue3_test.py     # Launch visual test
    streamlit run vue3_backend_test.py  # Direct run
"""

import subprocess
import sys
from pathlib import Path


def main():
    """Main launcher function."""
    # Get the directory of this script
    script_dir = Path(__file__).parent
    test_file = script_dir / "vue3_backend_test.py"

    # Check if test file exists
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        return 1

    # Run the test
    print("🔌 Launching Vue3 Backend Test Harness...")
    print("   Tests the FastAPI backend that powers Vue3 components")
    print()
    print("   Make sure the backend is running:")
    print("   cd packages/backend")
    print("   uvicorn lightweight_charts_backend.app:create_app --factory --reload")
    print()

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
