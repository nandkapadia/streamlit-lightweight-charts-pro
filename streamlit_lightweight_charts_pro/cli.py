#!/usr/bin/env python3
"""Command-line interface for streamlit-lightweight-charts-pro."""

import os
import shutil
import subprocess
import sys
from pathlib import Path

from streamlit_lightweight_charts_pro.exceptions import NpmNotFoundError

from . import __version__


def check_frontend_build():
    """Check if frontend is built and provide instructions if not."""
    frontend_dir = Path(__file__).parent / "frontend"
    build_dir = frontend_dir / "build"

    if not build_dir.exists() or not (build_dir / "static").exists():
        print("❌ Frontend not built. Building now...")
        return build_frontend()
    return True


def build_frontend():
    """Build the frontend assets."""
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # Change to frontend directory

        original_dir = Path.cwd()
        os.chdir(frontend_dir)

        # Install dependencies
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
