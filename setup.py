#!/usr/bin/env python3
"""
Setup script for streamlit-lightweight-charts-pro package.
Includes pre-built frontend assets in the wheel distribution.
"""

import os
import subprocess
from pathlib import Path

from setuptools import find_packages, setup
from setuptools.command.bdist_wheel import bdist_wheel
from setuptools.command.build_py import build_py
from setuptools.command.sdist import sdist


def check_node_installed():
    """Check if Node.js is installed and available."""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, check=True)
        print(f"✅ Node.js found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js not found. Please install Node.js first.")
        print("   Visit: https://nodejs.org/")
        return False


def check_npm_installed():
    """Check if npm is installed and available."""
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True, check=True)
        print(f"✅ npm found: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm not found. Please install npm first.")
        return False


def build_frontend():
    """Build the frontend assets."""
    print("🔨 Building frontend assets...")

    # Check prerequisites
    if not check_node_installed() or not check_npm_installed():
        print("❌ Cannot build frontend without Node.js/npm")
        return False

    # Get the directory containing this setup.py
    setup_dir = Path(__file__).parent
    frontend_dir = setup_dir / "streamlit_lightweight_charts_pro" / "frontend"

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
        os.chdir(setup_dir)


def ensure_frontend_built():
    """Ensure frontend is built before packaging."""
    frontend_dir = Path(__file__).parent / "streamlit_lightweight_charts_pro" / "frontend"
    build_dir = frontend_dir / "build"

    if not build_dir.exists() or not (build_dir / "static").exists():
        print("🔨 Frontend not built, building now...")
        if not build_frontend():
            raise RuntimeError(
                "Frontend build failed. Cannot create wheel without frontend assets."
            )
    else:
        print("✅ Frontend already built, using existing assets.")


class BuildPyCommand(build_py):
    """Custom build command that ensures frontend is built before building Python package."""

    def run(self):
        print("🚀 Starting build process...")

        # Ensure frontend is built
        ensure_frontend_built()

        # Run the standard build_py command
        super().run()


class SDistCommand(sdist):
    """Custom sdist command that builds frontend before creating source distribution."""

    def run(self):
        print("🚀 Creating source distribution...")

        # Ensure frontend is built
        ensure_frontend_built()

        # Run the standard sdist command
        super().run()


class BDistWheelCommand(bdist_wheel):
    """Custom wheel command that builds frontend before creating wheel."""

    def run(self):
        print("🚀 Creating wheel distribution...")

        # Ensure frontend is built
        ensure_frontend_built()

        # Run the standard bdist_wheel command
        super().run()


# Read the README file
def read_readme():
    readme_path = Path(__file__).parent / "README.md"
    if readme_path.exists():
        return readme_path.read_text(encoding="utf-8")
    return "Enhanced Streamlit wrapper for TradingView's lightweight-charts"


# Read requirements
def read_requirements():
    requirements_path = Path(__file__).parent / "requirements.txt"
    if requirements_path.exists():
        return requirements_path.read_text().strip().split("\n")
    return ["streamlit>=1.0", "pandas>=1.0", "numpy>=1.19"]


if __name__ == "__main__":
    setup(
        name="streamlit_lightweight_charts_pro",
        version="0.1.0",
        description=(
            "Enhanced Streamlit wrapper for TradingView's lightweight-charts with ultra-simplified"
            " API and performance optimizations"
        ),
        long_description=read_readme(),
        long_description_content_type="text/markdown",
        author="Nand Kapadia",
        author_email="nand.kapadia@gmail.com",
        url="https://github.com/nandkapadia/streamlit-lightweight-charts-pro",
        project_urls={
            "Documentation": (
                "https://github.com/nandkapadia/streamlit-lightweight-charts-pro#readme"
            ),
            "Bug Reports": "https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues",
            "Source": "https://github.com/nandkapadia/streamlit-lightweight-charts-pro",
            "Changelog": (
                "https://github.com/nandkapadia/streamlit-lightweight-charts-pro/blob/main/CHANGELOG.md"
            ),
        },
        license="MIT",
        packages=find_packages(),
        include_package_data=True,
        package_data={
            "streamlit_lightweight_charts_pro": [
                "frontend/build/**/*",
                "frontend/build/static/**/*",
            ]
        },
        install_requires=read_requirements(),
        python_requires=">=3.7",
        keywords=["streamlit", "tradingview", "charts", "visualization", "trading", "financial"],
        classifiers=[
            "Development Status :: 4 - Beta",
            "Intended Audience :: Developers",
            "Operating System :: OS Independent",
            "Programming Language :: Python :: 3",
            "Programming Language :: Python :: 3.7",
            "Programming Language :: Python :: 3.8",
            "Programming Language :: Python :: 3.9",
            "Programming Language :: Python :: 3.10",
            "Programming Language :: Python :: 3.11",
            "Topic :: Software Development :: Libraries :: Python Modules",
            "Topic :: Scientific/Engineering :: Visualization",
        ],
        cmdclass={
            "build_py": BuildPyCommand,
            "sdist": SDistCommand,
            "bdist_wheel": BDistWheelCommand,
        },
        entry_points={
            "console_scripts": [
                "streamlit-lightweight-charts-pro=streamlit_lightweight_charts_pro.cli:main",
            ],
        },
    )
