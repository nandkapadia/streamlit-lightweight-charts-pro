"""Pytest configuration for lightweight_charts_core tests."""

import sys
from pathlib import Path

# Ensure the package is on the path
package_path = Path(__file__).parent.parent
if str(package_path) not in sys.path:
    sys.path.insert(0, str(package_path))
