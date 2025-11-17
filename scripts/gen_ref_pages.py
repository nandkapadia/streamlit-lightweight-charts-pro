"""Generate API reference pages automatically.

This script generates markdown files for the mkdocs-gen-files plugin
to create comprehensive API documentation from Python docstrings.
"""

# Standard Imports
from pathlib import Path

# Third Party Imports
import mkdocs_gen_files

# Configuration
nav = mkdocs_gen_files.Nav()
mod_symbol = '<code class="doc-symbol doc-symbol-nav doc-symbol-module"></code>'

# Root path for the package - use current working directory
root = Path.cwd()
src = root / "streamlit_lightweight_charts_pro"

print(f"Generating API docs from: {src}")
print(f"Root directory: {root}")

# Iterate through all Python files
file_count = 0
for path in sorted(src.rglob("*.py")):
    # Skip test files, pycache, and frontend
    if any(part.startswith("_") and part != "__pycache__" for part in path.parts if part != "__init__.py"):
        if path.name != "__init__.py":
            continue
    if "frontend" in path.parts:
        continue
    if path.name.startswith("_") and path.name != "__init__.py":
        continue

    # Create module path
    module_path = path.relative_to(root).with_suffix("")
    doc_path = path.relative_to(root).with_suffix(".md")
    full_doc_path = Path("api", doc_path)

    # Create parts for navigation
    parts = tuple(module_path.parts)

    # Skip __init__ files in nav but still generate docs
    if parts[-1] == "__init__":
        parts = parts[:-1]
        if not parts:
            continue
        doc_path = doc_path.with_name("index.md")
        full_doc_path = Path("api", doc_path)
    elif parts[-1].startswith("_"):
        continue

    # Add to navigation
    if parts:
        nav[parts] = doc_path.as_posix()

    # Write documentation file
    with mkdocs_gen_files.open(full_doc_path, "w") as fd:
        ident = ".".join(parts)
        fd.write(f"# {ident}\n\n")
        fd.write(f"::: {ident}\n")
        file_count += 1
        print(f"Generated: {full_doc_path} for {ident}")

    # Set edit path
    mkdocs_gen_files.set_edit_path(full_doc_path, path.relative_to(root))

# Write navigation
with mkdocs_gen_files.open("api/SUMMARY.md", "w") as nav_file:
    nav_file.writelines(nav.build_literate_nav())

print(f"\nTotal API pages generated: {file_count}")
