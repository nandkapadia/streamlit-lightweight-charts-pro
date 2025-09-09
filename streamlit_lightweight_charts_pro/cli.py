#!/usr/bin/env python3
"""
Command-line interface for streamlit-lightweight-charts-pro.
"""

import subprocess
import sys
from pathlib import Path


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
        import os

        original_dir = os.getcwd()
        os.chdir(frontend_dir)

        # Install dependencies
        print("📦 Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)

        # Build frontend
        print("🔨 Building frontend...")
        subprocess.run(["npm", "run", "build"], check=True)

        print("✅ Frontend build successful!")
        return True

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

    elif command == "check":
        success = check_frontend_build()
        return 0 if success else 1

    elif command == "version":
        from . import __version__

        print(f"streamlit-lightweight-charts-pro version {__version__}")
        return 0

    else:
        print(f"Unknown command: {command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
