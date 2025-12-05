# Installation Guide

Complete installation guide for Streamlit Lightweight Charts Pro.

## Prerequisites

### Required
- Python ≥ 3.9
- pip (latest version recommended)
- Virtual environment (recommended)

### Recommended
- Streamlit ≥ 1.0
- pandas ≥ 1.0
- numpy ≥ 1.19

## Installation Methods

### Method 1: From PyPI (Recommended for Users)

```bash
pip install streamlit-lightweight-charts-pro
```

**Note**: PyPI package will be available after first release. For now, use Method 2.

### Method 2: From GitHub (Development Version)

Install the latest development version:

```bash
pip install git+https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git@dev
```

### Method 3: For Development

Clone and install in editable mode:

```bash
# Clone repository
git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git
cd streamlit-lightweight-charts-pro

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in editable mode with dev dependencies
pip install -e ".[dev,test]"

# Install frontend dependencies and build
cd streamlit_lightweight_charts_pro/frontend
npm install
npm run build
cd ../..
```

## Virtual Environment Setup

### Using venv (Built-in)

```bash
# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install package
pip install streamlit-lightweight-charts-pro
```

### Using conda

```bash
# Create conda environment
conda create -n charts-pro python=3.11
conda activate charts-pro

# Install package
pip install streamlit-lightweight-charts-pro
```

## Verify Installation

```python
# test_installation.py
import streamlit as st
from streamlit_lightweight_charts_pro import renderChart
import pandas as pd
import numpy as np

st.title("Installation Test")

# Generate sample data
dates = pd.date_range('2023-01-01', periods=100)
values = 100 + np.cumsum(np.random.randn(100) * 2)

data = pd.DataFrame({
    'time': dates,
    'value': values
})

# Render chart
renderChart(data, title="Test Chart", height=400)

st.success("✅ Installation successful!")
```

Run the test:

```bash
streamlit run test_installation.py
```

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'streamlit_lightweight_charts_pro'`

**Solution**:
1. Ensure you're in the correct virtual environment
2. Reinstall the package: `pip install --force-reinstall streamlit-lightweight-charts-pro`
3. Check installation: `pip list | grep streamlit-lightweight-charts-pro`

### Issue: Component not rendering (blank screen)

**Possible causes**:
1. Frontend build missing
2. Browser cache issues
3. Streamlit component registration failed

**Solutions**:

```bash
# For development installations
cd streamlit_lightweight_charts_pro/frontend
npm run build

# Clear Streamlit cache
streamlit cache clear

# Force browser refresh (Ctrl+Shift+R or Cmd+Shift+R)
```

### Issue: Import errors for `lightweight-charts-pro`

**Solution**:

The `lightweight-charts-pro` Python package is automatically installed as a dependency. If you get import errors:

```bash
# Reinstall with dependencies
pip install --force-reinstall streamlit-lightweight-charts-pro

# Or manually install dependency
pip install git+https://github.com/nandkapadia/lightweight-charts-pro-python.git@dev
```

### Issue: Version conflicts

**Solution**:

Create a fresh virtual environment:

```bash
# Deactivate current environment
deactivate

# Create new environment
python -m venv venv-clean
source venv-clean/bin/activate

# Install package
pip install streamlit-lightweight-charts-pro
```

### Issue: Permission errors during installation

**Solution**:

```bash
# Use --user flag
pip install --user streamlit-lightweight-charts-pro

# Or use virtual environment (recommended)
python -m venv venv
source venv/bin/activate
pip install streamlit-lightweight-charts-pro
```

## Platform-Specific Notes

### macOS

No special requirements. Use standard installation.

### Windows

1. Use PowerShell or Command Prompt (not Git Bash)
2. Activate virtual environment: `venv\Scripts\activate`
3. Install: `pip install streamlit-lightweight-charts-pro`

### Linux

May need to install build dependencies:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3-dev python3-pip

# Install package
pip install streamlit-lightweight-charts-pro
```

## Docker Installation

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install package
RUN pip install streamlit-lightweight-charts-pro

# Copy application
COPY . .

# Expose Streamlit port
EXPOSE 8501

# Run application
CMD ["streamlit", "run", "app.py"]
```

```bash
# Build and run
docker build -t charts-app .
docker run -p 8501:8501 charts-app
```

## Requirements File

Create `requirements.txt`:

```txt
streamlit>=1.0.0
streamlit-lightweight-charts-pro
pandas>=1.0.0
numpy>=1.19.0
```

Install from requirements file:

```bash
pip install -r requirements.txt
```

## Upgrading

### Upgrade to Latest Version

```bash
pip install --upgrade streamlit-lightweight-charts-pro
```

### Upgrade from Git

```bash
pip install --upgrade git+https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git@dev
```

### Check Current Version

```python
import streamlit_lightweight_charts_pro
print(streamlit_lightweight_charts_pro.__version__)
```

## Uninstalling

```bash
pip uninstall streamlit-lightweight-charts-pro
```

## Next Steps

After successful installation:

1. Read [Quick Start Tutorial](Quick-Start-Tutorial)
2. Try [Your First Chart](Your-First-Chart)
3. Explore [Code Recipes](Code-Recipes)
4. Check [API Documentation](https://nandkapadia.github.io/streamlit-lightweight-charts-pro/)

## Getting Help

- [FAQ](FAQ)
- [Troubleshooting](Troubleshooting)
- [GitHub Issues](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues)
- [Discussions](https://github.com/nandkapadia/streamlit-lightweight-charts-pro/discussions)
