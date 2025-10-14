#!/usr/bin/env python3
"""Build script to create a proper wheel with pre-built frontend assets.

This should be run before publishing to ensure the wheel contains all assets.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

from streamlit_lightweight_charts_pro.exceptions import CliNotFoundError, NpmNotFoundError


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
        npm_path = shutil.which("npm")
        if not npm_path:
            raise NpmNotFoundError()  # noqa: TRY301

        # Validate npm_path to prevent command injection
        def _raise_invalid_npm_path():
            raise ValueError("Invalid npm path")  # noqa: TRY301

        if not npm_path or not Path(npm_path).exists():
            _raise_invalid_npm_path()
        subprocess.run([npm_path, "install"], check=True, shell=False)

        # Build frontend
        print("🔨 Building frontend...")
        subprocess.run([npm_path, "run", "build"], check=True, shell=False)

        # Verify build output
        build_dir = frontend_dir / "build"
        if build_dir.exists() and (build_dir / "static").exists():
            print("✅ Frontend build successful!")
        else:
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

        # Validate sys.executable to prevent command injection
        if not sys.executable or not Path(sys.executable).exists():
            raise ValueError("Invalid Python executable path")  # noqa: TRY301

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
        else:
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
        # Validate wheel_file path to prevent command injection
        wheel_path = Path(wheel_file)
        if not wheel_path.exists() or not wheel_path.is_file():
            raise ValueError(f"Invalid wheel file path: {wheel_file}")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--force-reinstall", str(wheel_file)],
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        # Test import
        # Validate the command to prevent injection
        test_command = [
            sys.executable,
            "-c",
            'import streamlit_lightweight_charts_pro; print("✅ Import successful!")',
        ]
        subprocess.run(
            test_command,
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        # Test CLI
        cli_path = shutil.which("streamlit-lightweight-charts-pro")
        if not cli_path:
            raise CliNotFoundError()
        # Validate cli_path to prevent command injection
        if not cli_path or not Path(cli_path).exists():
            raise ValueError("Invalid CLI path")
        subprocess.run(
            [cli_path, "--help"],
            check=True,
            shell=False,  # Explicitly disable shell to prevent command injection
        )

        print("✅ Wheel test successful!")

    except subprocess.CalledProcessError as e:
        print(f"❌ Wheel test failed: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Starting wheel build process...")

    BUILD_SUCCESS = build_wheel()

    if BUILD_SUCCESS:
        print("\n🧪 Testing wheel...")
        TEST_SUCCESS = test_wheel()

        if TEST_SUCCESS:
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
