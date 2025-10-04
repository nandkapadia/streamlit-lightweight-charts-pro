#!/usr/bin/env python3
"""Simple script to run the ribbon series test harness.

This script provides a quick way to launch the ribbon series test harness
without needing to remember the streamlit command.
"""

import subprocess
import sys
from pathlib import Path


def main():
    """Run the ribbon series test harness."""
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    test_file = script_dir / "temp_ribbon_test.py"

    if not test_file.exists():
        print(f"Error: Test file not found at {test_file}")
        sys.exit(1)

    print("🎯 Starting Ribbon Series Test Harness...")
    print("📊 Testing ribbon series with 100 data points")
    print("🌐 Opening browser at http://localhost:8502")
    print("⏹️  Press Ctrl+C to stop the server")
    print()

    try:
        # Run streamlit with the test file
        subprocess.run(
            [
                sys.executable,
                "-m",
                "streamlit",
                "run",
                str(test_file),
                "--server.port",
                "8502",
                "--server.headless",
                "true",
            ],
            check=True,
        )
    except KeyboardInterrupt:
        print("\n🛑 Test harness stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running test harness: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
