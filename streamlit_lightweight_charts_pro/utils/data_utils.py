"""Time helpers for historical ``utils.data_utils`` import paths.

``to_utc_timestamp`` is the name examples use for
``lightweight_charts_pro.utils.normalize_time``.
"""

from typing import Any

from lightweight_charts_pro.utils import normalize_time


def to_utc_timestamp(time_value: Any) -> int:
    """Return a UNIX timestamp in seconds for ``time_value``.

    Args:
        time_value: A timestamp, datetime, or date string accepted by
            ``normalize_time``.

    Returns:
        UNIX time in seconds.
    """
    return normalize_time(time_value)


__all__ = ["to_utc_timestamp"]
