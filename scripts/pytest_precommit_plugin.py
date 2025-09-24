"""Pytest plugin to exclude performance and large dataset tests from pre-commit runs."""

import pytest


def pytest_collection_modifyitems(config, items):
    """Filter out performance and large dataset tests from pre-commit runs.

    This plugin ensures that pre-commit hooks only run functionality tests,
    not performance tests, for faster development cycles.
    """
    filtered_items = []

    for item in items:
        # Skip if test is in performance directory
        if "performance" in str(item.fspath):
            continue

        # Skip if test name contains performance keywords
        test_name = item.name.lower()
        if any(
            keyword in test_name
            for keyword in [
                "performance",
                "large_dataset",
                "benchmark",
                "load_test",
                "stress_test",
                "memory_test",
                "timeout_test",
            ]
        ):
            continue

        # Skip if test class name contains performance keywords
        if hasattr(item, "cls") and item.cls:
            class_name = item.cls.__name__.lower()
            if any(
                keyword in class_name
                for keyword in [
                    "performance",
                    "benchmark",
                    "load",
                    "stress",
                    "memory",
                ]
            ):
                continue

        # Skip if test has performance, slow, or benchmark markers
        if any(
            item.get_closest_marker(marker)
            for marker in [
                "performance",
                "slow",
                "benchmark",
                "load",
                "stress",
            ]
        ):
            continue

        # Skip tests that use large dataset fixtures
        if hasattr(item, "fixturenames"):
            large_fixtures = ["large_dataset", "wide_dataset", "stress_data"]
            if any(fixture in item.fixturenames for fixture in large_fixtures):
                continue

        filtered_items.append(item)

    # Replace the items list with filtered items
    items[:] = filtered_items


def pytest_configure(config):
    """Configure pytest to use this plugin."""
    config.addinivalue_line(
        "markers",
        "performance: Performance tests (excluded from pre-commit)",
    )
    config.addinivalue_line(
        "markers",
        "slow: Slow running tests (excluded from pre-commit)",
    )
