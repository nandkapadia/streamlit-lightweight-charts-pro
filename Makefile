.PHONY: help install install-dev test lint format type-check clean build publish build-frontend

help:
	@echo "Available commands:"
	@echo "  make install         - Install package"
	@echo "  make install-dev     - Install package with dev dependencies"
	@echo "  make test            - Run tests"
	@echo "  make lint            - Run linters"
	@echo "  make format          - Format code with black and isort"
	@echo "  make type-check      - Run type checking with mypy"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make build           - Build distribution packages"
	@echo "  make publish         - Publish to PyPI"
	@echo "  make build-frontend  - Build frontend component"

install:
	pip install -e .

install-dev:
	pip install -e ".[dev,test]"

test:
	pytest tests/ -v --tb=short

lint:
	ruff check streamlit_lightweight_charts_pro
	pylint streamlit_lightweight_charts_pro

format:
	black streamlit_lightweight_charts_pro tests
	isort streamlit_lightweight_charts_pro tests

type-check:
	mypy streamlit_lightweight_charts_pro --ignore-missing-imports

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf streamlit_lightweight_charts_pro/frontend/build
	rm -rf streamlit_lightweight_charts_pro/frontend/node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
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
