#!/usr/bin/env python3
"""Script to add JSDoc documentation headers to TypeScript files.

This script adds proper file-level JSDoc comments to all TypeScript files
that are missing them, following Google-style documentation standards.
"""

# Standard Imports
import re
from pathlib import Path

# File patterns to process
FRONTEND_SRC = (
    Path(__file__).parent.parent / "streamlit_lightweight_charts_pro" / "frontend" / "src"
)


def has_file_header(content: str) -> bool:
    """Check if file already has a proper fileoverview header.

    Args:
        content: File content to check.

    Returns:
        bool: True if file has proper header, False otherwise.
    """
    # Check for @fileoverview or module-level comment at start
    return bool(re.match(r"^\s*/\*\*\s*\n\s*\*\s*@fileoverview", content, re.MULTILINE))


def get_file_purpose(filepath: Path) -> str:
    """Infer file purpose from name and location.

    Args:
        filepath: Path to the file.

    Returns:
        str: Brief description of file purpose.
    """
    name = filepath.stem
    parent = filepath.parent.name

    # Map common patterns to purposes
    if "Primitive" in name:
        return f"{name.replace('Primitive', '')} primitive for custom chart visualizations"
    if "Service" in name:
        return f"{name.replace('Service', '')} service for managing chart functionality"
    if "Manager" in name:
        return f"{name.replace('Manager', '')} manager for coordinating chart operations"
    if "Component" in name:
        return f"{name.replace('Component', '')} React component"
    if parent == "hooks":
        return f"Custom React hook for {name.replace('use', '').lower()} functionality"
    if parent == "utils":
        return f"Utility functions for {name.lower()} operations"
    if parent == "types":
        return f"TypeScript type definitions for {name.lower()}"
    return f"{name} module"


def add_file_header(filepath: Path) -> bool:
    """Add JSDoc file header to a TypeScript file if missing.

    Args:
        filepath: Path to the TypeScript file.

    Returns:
        bool: True if header was added, False if skipped.
    """
    try:
        content = filepath.read_text()

        # Skip if already has header
        if has_file_header(content):
            return False

        # Get file purpose
        purpose = get_file_purpose(filepath)

        # Create header
        header = f"""/**
 * @fileoverview {purpose}
 *
 * This module provides...
 * [TODO: Add detailed description]
 */

"""

        # Add header before first import or code
        new_content = header + content
        filepath.write_text(new_content)

        print(f"✅ Added header to {filepath.relative_to(FRONTEND_SRC)}")
        return True  # noqa: TRY300

    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False


def main():
    """Main function to process all TypeScript files."""
    print("Adding JSDoc headers to TypeScript files...")
    print("=" * 70)

    count = 0
    updated = 0

    # Process all .ts and .tsx files
    for pattern in ["**/*.ts", "**/*.tsx"]:
        for filepath in FRONTEND_SRC.glob(pattern):
            # Skip test files and node_modules
            if "__tests__" in str(filepath) or "node_modules" in str(filepath):
                continue

            count += 1
            if add_file_header(filepath):
                updated += 1

    print("=" * 70)
    print(f"Processed {count} files")
    print(f"Updated {updated} files")
    print(f"Skipped {count - updated} files (already have headers)")


if __name__ == "__main__":
    main()
