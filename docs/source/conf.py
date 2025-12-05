"""Sphinx configuration file for Streamlit Lightweight Charts Pro documentation.

This configuration sets up Sphinx to generate Python API documentation with:
- Google-style docstring parsing via Napoleon
- Auto-generated API documentation from source code
- ReadTheDocs-compatible HTML theme
- Cross-referencing support
"""

import os
import sys

# Add project root to Python path for autodoc
sys.path.insert(0, os.path.abspath("../.."))

# -- Project information -----------------------------------------------------
project = "Streamlit Lightweight Charts Pro"
copyright = "2025, Nand Kapadia"
author = "Nand Kapadia"
release = "0.3.0"

# -- General configuration ---------------------------------------------------
extensions = [
    "sphinx.ext.autodoc",  # Auto-generate docs from docstrings
    "sphinx.ext.napoleon",  # Google-style docstring support
    "sphinx.ext.viewcode",  # Add source code links
    "sphinx.ext.intersphinx",  # Link to other projects' docs
    "sphinx.ext.autosummary",  # Generate summary tables
    "sphinx_rtd_theme",  # ReadTheDocs theme
]

# Napoleon settings for Google-style docstrings
napoleon_google_docstring = True
napoleon_numpy_docstring = False
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = True
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_preprocess_types = False
napoleon_type_aliases = None
napoleon_attr_annotations = True

# Autodoc settings
autodoc_default_options = {
    "members": True,
    "member-order": "bysource",
    "special-members": "__init__",
    "undoc-members": True,
    "exclude-members": "__weakref__",
}
autodoc_typehints = "description"
autodoc_class_signature = "separated"

# Autosummary settings
autosummary_generate = True

# Intersphinx mapping
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "pandas": ("https://pandas.pydata.org/docs", None),
    "numpy": ("https://numpy.org/doc/stable", None),
    "streamlit": ("https://docs.streamlit.io", None),
}

# Template configuration
templates_path = ["_templates"]
exclude_patterns = []

# -- Options for HTML output -------------------------------------------------
html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]
html_theme_options = {
    "navigation_depth": 4,
    "collapse_navigation": False,
    "sticky_navigation": True,
    "includehidden": True,
    "titles_only": False,
}

# -- Options for LaTeX output ------------------------------------------------
latex_elements = {
    "papersize": "letterpaper",
    "pointsize": "10pt",
    "preamble": "",
    "figure_align": "htbp",
}
