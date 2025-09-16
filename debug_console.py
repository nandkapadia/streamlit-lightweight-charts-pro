#!/usr/bin/env python3
"""
Debug script to capture browser console logs for legend issue debugging
"""

import subprocess
import time
import os

def main():
    print("Starting debug session for legend issues...")
    print("1. Make sure you have the browser open to http://localhost:8503")
    print("2. Open browser console (F12)")
    print("3. Hover over the chart to trigger crosshair updates")
    print("4. Copy console logs and paste them into console.log file")
    print("\nWaiting for you to interact with the chart...")

    # Simple wait loop
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nDebug session ended.")

if __name__ == "__main__":
    main()