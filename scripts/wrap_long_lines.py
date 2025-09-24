#!/usr/bin/env python3
"""Script to wrap long lines in docstrings, comments, and strings.

This script provides more aggressive line wrapping than standard formatters
for docstrings, comments, and strings while preserving code functionality.
"""

import argparse
import sys
from pathlib import Path


def wrap_text(text: str, max_length: int = 100, indent: str = "") -> str:
    """Wrap text to fit within max_length, preserving indentation."""
    if len(text) <= max_length:
        return text

    # Split on spaces and wrap
    words = text.split()
    lines = []
    current_line = indent

    for word in words:
        if len(current_line + " " + word) <= max_length:
            if current_line != indent:
                current_line += " " + word
            else:
                current_line += word
        else:
            if current_line != indent:
                lines.append(current_line)
            current_line = indent + word

    if current_line != indent:
        lines.append(current_line)

    return "\n".join(lines)


def wrap_docstring(content: str, max_length: int = 100) -> str:
    """Wrap docstring content while preserving structure."""
    lines = content.split("\n")
    wrapped_lines = []

    for line in lines:
        # Detect indentation
        indent = len(line) - len(line.lstrip())
        indent_str = " " * indent

        # Skip empty lines and first/last lines of docstring
        if not line.strip() or line.strip() in ['"""', "'''"]:
            wrapped_lines.append(line)
            continue

        # Wrap long lines
        if len(line) > max_length:
            wrapped_text = wrap_text(line.strip(), max_length, indent_str)
            wrapped_lines.append(wrapped_text)
        else:
            wrapped_lines.append(line)

    return "\n".join(wrapped_lines)


def wrap_comments_and_strings(content: str, max_length: int = 100) -> str:
    """Wrap long comments and strings in Python code."""
    lines = content.split("\n")
    wrapped_lines = []

    for line in lines:
        # Skip if line is not too long
        if len(line) <= max_length:
            wrapped_lines.append(line)
            continue

        # Handle comments
        if line.strip().startswith("#"):
            indent = len(line) - len(line.lstrip())
            indent_str = " " * indent
            comment_text = line.strip()[1:].strip()

            if len(line) > max_length:
                wrapped_text = wrap_text(comment_text, max_length - 2, indent_str + "# ")
                wrapped_lines.append(wrapped_text)
            else:
                wrapped_lines.append(line)
            continue

        # Handle long strings (basic detection)
        if '"""' in line or "'''" in line or ('"' in line and line.count('"') >= 2):
            # For now, just add the line as-is to avoid breaking string literals
            wrapped_lines.append(line)
            continue

        # For other long lines, try to wrap at logical break points
        if len(line) > max_length:
            # Try to wrap at commas, spaces, etc.
            words = line.split()
            if len(words) > 1:
                indent = len(line) - len(line.lstrip())
                indent_str = " " * indent

                current_line = ""
                for word in words:
                    if len(current_line + " " + word) <= max_length:
                        if current_line:
                            current_line += " " + word
                        else:
                            current_line = word
                    else:
                        if current_line:
                            wrapped_lines.append(indent_str + current_line)
                        current_line = word

                if current_line:
                    wrapped_lines.append(indent_str + current_line)
            else:
                wrapped_lines.append(line)
        else:
            wrapped_lines.append(line)

    return "\n".join(wrapped_lines)


def process_file(file_path: Path, max_length: int = 100) -> bool:
    """Process a single Python file for line wrapping."""
    try:
        with Path(file_path).open(encoding="utf-8") as f:
            content = f.read()

        original_content = content

        # Wrap docstrings
        content = wrap_docstring(content, max_length)

        # Wrap comments and strings
        content = wrap_comments_and_strings(content, max_length)

        # Only write if content changed
        if content != original_content:
            with Path(file_path).open("w", encoding="utf-8") as f:
                f.write(content)
            print(f"Wrapped long lines in {file_path}")
            return True

        return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Wrap long lines in Python files")
    parser.add_argument("files", nargs="+", help="Python files to process")
    parser.add_argument("--max-length", type=int, default=100, help="Maximum line length")
    parser.add_argument("--check", action="store_true", help="Check if files need wrapping")

    args = parser.parse_args()

    changed_files = []

    for file_path in args.files:
        path = Path(file_path)
        if not path.exists():
            print(f"File not found: {file_path}")
            continue

        if path.suffix != ".py":
            print(f"Skipping non-Python file: {file_path}")
            continue

        if args.check:
            # Just check if file has long lines
            try:
                with Path(path).open(encoding="utf-8") as f:
                    content = f.read()

                long_lines = [
                    i + 1
                    for i, line in enumerate(content.split("\n"))
                    if len(line) > args.max_length
                ]

                if long_lines:
                    print(f"{file_path}: {len(long_lines)} long lines at {long_lines}")
                else:
                    print(f"{file_path}: OK")

            except Exception as e:
                print(f"Error checking {file_path}: {e}")
        # Process the file
        elif process_file(path, args.max_length):
            changed_files.append(file_path)

    if changed_files:
        print(f"\nWrapped long lines in {len(changed_files)} files")
        return 1
    print("No files needed wrapping")
    return 0


if __name__ == "__main__":
    sys.exit(main())
