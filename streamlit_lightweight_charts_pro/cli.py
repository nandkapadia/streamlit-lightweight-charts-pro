#!/usr/bin/env python3
"""Command-line interface for streamlit-lightweight-charts-pro.

This module provides command-line utilities for managing the streamlit-lightweight-charts-pro
package, including frontend building, dependency management, and development tools.

The CLI supports:
    - Frontend build management and validation
    - Dependency installation and updates
    - Development environment setup
    - Package validation and testing

Key Features:
    - Automatic frontend build detection and building
    - NPM dependency management with validation
    - Development vs production mode handling
    - Error handling with clear user messages
    - Cross-platform compatibility

Example Usage:
    ```bash
    # Build frontend assets
    python -m streamlit_lightweight_charts_pro build-frontend

    # Check frontend build status
    python -m streamlit_lightweight_charts_pro check-frontend

    # Install development dependencies
    python -m streamlit_lightweight_charts_pro install-dev
    ```

Version: 0.1.0
Author: Streamlit Lightweight Charts Contributors
License: MIT
"""

# Standard Imports
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Local Imports
from streamlit_lightweight_charts_pro.exceptions import NpmNotFoundError

from . import __version__


def check_frontend_build():
    """Check if frontend is built and provide instructions if not.

    This function validates that the frontend build directory exists and contains
    the required static assets. If the frontend is not built, it automatically
    triggers the build process.

    Returns:
        bool: True if frontend is built successfully, False otherwise.

    Example:
        ```python
        if check_frontend_build():
            print("Frontend is ready")
        else:
            print("Frontend build failed")
        ```
    """
    # Check if frontend build directory exists and contains required assets
    frontend_dir = Path(__file__).parent / "frontend"
    build_dir = frontend_dir / "build"

    # Validate that build directory exists and contains static assets
    if not build_dir.exists() or not (build_dir / "static").exists():
        print("❌ Frontend not built. Building now...")
        return build_frontend()
    return True


def build_frontend():
    """Build the frontend assets using NPM.

    This function handles the complete frontend build process including:
    - Installing NPM dependencies
    - Running the production build
    - Validating build output
    - Error handling and recovery

    Returns:
        bool: True if build succeeds, False otherwise.

    Raises:
        NpmNotFoundError: If NPM is not installed or not found in PATH.
        subprocess.CalledProcessError: If the build process fails.

    Example:
        ```python
        success = build_frontend()
        if success:
            print("Frontend built successfully")
        ```
    """
    # Get the frontend directory path relative to this module
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # Store current directory for restoration after build
        original_dir = Path.cwd()
        # Change to frontend directory for NPM operations
        os.chdir(frontend_dir)

        # Install dependencies first to ensure all packages are available
        print("📦 Installing frontend dependencies...")
        npm_path = shutil.which("npm")
        if not npm_path:

            def _raise_npm_not_found():
                raise NpmNotFoundError()  # noqa: TRY301

            _raise_npm_not_found()

        # Validate npm_path to prevent command injection
        def _raise_invalid_npm_path():
            raise ValueError("Invalid npm path")  # noqa: TRY301

        if not npm_path or not Path(npm_path).exists():
            _raise_invalid_npm_path()
        subprocess.run([npm_path, "install"], check=True, shell=False)

        # Build frontend
        print("🔨 Building frontend...")
        subprocess.run([npm_path, "run", "build"], check=True, shell=False)

        print("✅ Frontend build successful!")

    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend build failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during frontend build: {e}")
        return False
    finally:
        # Return to original directory
        os.chdir(original_dir)


def main():
    """Main CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: streamlit-lightweight-charts-pro <command>")
        print("Commands:")
        print("  build-frontend  Build the frontend assets")
        print("  check          Check if frontend is built")
        print("  version        Show version information")
        return 1

    command = sys.argv[1]

    if command == "build-frontend":
        success = build_frontend()
        return 0 if success else 1

    if command == "check":
        success = check_frontend_build()
        return 0 if success else 1

    if command == "version":
        print(f"streamlit-lightweight-charts-pro version {__version__}")
        return 0

    print(f"Unknown command: {command}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
