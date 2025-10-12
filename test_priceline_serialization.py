"""Test price line serialization"""

import sys

sys.path.insert(0, ".")

# Create a mock for pandas to avoid import error
import sys
from unittest.mock import MagicMock

sys.modules["pandas"] = MagicMock()

# NOTE: Imports after mock setup to avoid pandas import error
from streamlit_lightweight_charts_pro.charts.options.price_line_options import (  # noqa: E402
    PriceLineOptions,
)
from streamlit_lightweight_charts_pro.type_definitions.enums import LineStyle  # noqa: E402

# Create a price line with axis_label_visible set
price_line = PriceLineOptions(
    price=100.0,
    color="#ff0000",
    axis_label_visible=True,
    title="Test Price Line",
)

# Serialize it
serialized = price_line.asdict()

print("Python field name: axis_label_visible")
print("Serialized output:", serialized)
print("\nChecking if 'axisLabelVisible' is in serialized output:", "axisLabelVisible" in serialized)
if "axisLabelVisible" in serialized:
    print("Value of axisLabelVisible:", serialized["axisLabelVisible"])
else:
    print("ERROR: axisLabelVisible NOT FOUND in serialized output!")
    print("Available keys:", list(serialized.keys()))
