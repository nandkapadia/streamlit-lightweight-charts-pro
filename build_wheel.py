#!/usr/bin/env python3
"""Build script to create a proper wheel with pre-built frontend assets.
This should be run before publishing to ensure the wheel contains all assets.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path


def build_frontend():
    """Build the frontend assets."""
    print("🔨 Building frontend assets...")

    # Get the directory containing this script
    script_dir = Path(__file__).parent
    frontend_dir = script_dir / "streamlit_lightweight_charts_pro" / "frontend"

    if not frontend_dir.exists():
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return False

    try:
        # Change to frontend directory
        os.chdir(frontend_dir)

        # Install dependencies
        print("📦 Installing frontend dependencies...")
        subprocess.run(["npm", "install"], check=True)

        # Build frontend
        print("🔨 Building frontend...")
        subprocess.run(["npm", "run", "build"], check=True)

        # Verify build output
        build_dir = frontend_dir / "build"
        if build_dir.exists() and (build_dir / "static").exists():
            print("✅ Frontend build successful!")
            return True
        print("❌ Frontend build failed - no build output found")
        return False

    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend build failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during frontend build: {e}")
        return False
    finally:
        # Return to original directory
        os.chdir(script_dir)


def build_wheel():
    """Build the wheel distribution."""
    print("🚀 Building wheel distribution...")

    # Ensure frontend is built
    if not build_frontend():
        print("❌ Cannot build wheel without frontend assets")
        return False

    try:
        # Clean previous builds
        print("🧹 Cleaning previous builds...")
        for dir_name in ["build", "dist", "*.egg-info"]:
            for path in Path().glob(dir_name):
                if path.is_dir():
                    shutil.rmtree(path)
                    print(f"   Removed {path}")

        # Build wheel
        print("📦 Building wheel...")
        subprocess.run(
            [sys.executable, "setup.py", "bdist_wheel"],
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        # List created files
        dist_dir = Path("dist")
        if dist_dir.exists():
            print("✅ Wheel created successfully!")
            print("📁 Created files:")
            for file in dist_dir.iterdir():
                print(f"   {file}")
            return True
        print("❌ No wheel files created")
        return False

    except subprocess.CalledProcessError as e:
        print(f"❌ Wheel build failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during wheel build: {e}")
        return False


def test_wheel():
    """Test the created wheel."""
    print("🧪 Testing wheel...")

    dist_dir = Path("dist")
    wheel_files = list(dist_dir.glob("*.whl"))

    if not wheel_files:
        print("❌ No wheel files found to test")
        return False

    wheel_file = wheel_files[0]
    print(f"📦 Testing wheel: {wheel_file}")

    try:
        # Install wheel in a temporary environment
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--force-reinstall", str(wheel_file)],
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        # Test import
        subprocess.run(
            [
                sys.executable,
                "-c",
                'import streamlit_lightweight_charts_pro; print("✅ Import successful!")',
            ],
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        # Test CLI
        subprocess.run(
            ["streamlit-lightweight-charts-pro", "--help"],
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        print("✅ Wheel test successful!")
        return True

    except subprocess.CalledProcessError as e:
        print(f"❌ Wheel test failed: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Starting wheel build process...")

    success = build_wheel()

    if success:
        print("\n🧪 Testing wheel...")
        test_success = test_wheel()

        if test_success:
            print("\n🎉 Wheel build and test completed successfully!")
            print("\n📦 To install the wheel:")
            print("   pip install dist/*.whl")
            print("\n📦 To upload to PyPI:")
            print("   twine upload dist/*")
        else:
            print("\n❌ Wheel test failed!")
            sys.exit(1)
    else:
        print("\n❌ Wheel build failed!")
        sys.exit(1)
