.PHONY: help install install-dev test lint format type-check clean build publish build-frontend docs docs-python docs-typescript docs-serve docs-clean pre-commit pre-commit-install

help:
	@echo "Streamlit Lightweight Charts Pro - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install         - Install package"
	@echo "  make install-dev     - Install package with dev dependencies"
	@echo "  make test            - Run all tests (Python + TypeScript)"
	@echo "  make test-python     - Run Python tests only"
	@echo "  make test-typescript - Run TypeScript tests only"
	@echo "  make lint            - Run linters"
	@echo "  make format          - Format code with black and isort"
	@echo "  make type-check      - Run type checking with mypy"
	@echo "  make pre-commit      - Run pre-commit hooks on all files"
	@echo "  make pre-commit-install - Install pre-commit hooks"
	@echo ""
	@echo "Documentation:"
	@echo "  make docs            - Build all documentation (Python + TypeScript)"
	@echo "  make docs-python     - Build Python API docs with Sphinx"
	@echo "  make docs-typescript - Build TypeScript API docs with TypeDoc"
	@echo "  make docs-serve      - Serve documentation locally"
	@echo "  make docs-clean      - Clean documentation build files"
	@echo ""
	@echo "Build:"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make build           - Build distribution packages"
	@echo "  make build-frontend  - Build frontend component"
	@echo "  make publish         - Publish to PyPI"
	@echo ""

install:
	pip install -e .

install-dev:
	pip install -e ".[dev,test]"

test: test-python test-typescript
	@echo "✅ All tests passed"

test-python:
	pytest tests/ -v --tb=short

test-typescript:
	cd streamlit_lightweight_charts_pro/frontend && npm test

lint:
	ruff check streamlit_lightweight_charts_pro
	pylint streamlit_lightweight_charts_pro

format:
	black streamlit_lightweight_charts_pro tests
	isort streamlit_lightweight_charts_pro tests

type-check:
	mypy streamlit_lightweight_charts_pro --ignore-missing-imports

clean: docs-clean
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf streamlit_lightweight_charts_pro/frontend/build
	rm -rf streamlit_lightweight_charts_pro/frontend/node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete

build-frontend:
	cd streamlit_lightweight_charts_pro/frontend && npm install && npm run build

build: clean build-frontend
	python -m build

publish: build
	python -m twine upload dist/*

publish-test: build
	python -m twine upload --repository testpypi dist/*

# Documentation targets
docs: docs-python docs-typescript
	@echo "✅ Documentation built successfully"
	@echo "📂 Python docs: docs/build/html/index.html"
	@echo "📂 TypeScript docs: docs/typescript/index.html"

docs-python:
	@echo "Building Python documentation with Sphinx..."
	cd docs && sphinx-build -b html source build/html --keep-going
	@echo "✅ Python docs built: docs/build/html/index.html"

docs-typescript:
	@echo "Building TypeScript documentation with TypeDoc..."
	cd streamlit_lightweight_charts_pro/frontend && npm run docs
	@echo "✅ TypeScript docs built: docs/typescript/index.html"

docs-serve:
	@echo "Serving documentation at http://localhost:8000"
	cd docs/build/html && python -m http.server 8000

docs-clean:
	@echo "Cleaning documentation build files..."
	rm -rf docs/build docs/typescript
	@echo "✅ Documentation cleaned"

# Pre-commit targets
pre-commit:
	@echo "Running pre-commit hooks on all files..."
	pre-commit run --all-files
	@echo "✅ Pre-commit checks passed"

pre-commit-install:
	@echo "Installing pre-commit hooks..."
	pre-commit install
	@echo "✅ Pre-commit hooks installed"
