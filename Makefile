.PHONY: help install-dev lint lint-check format test clean pre-commit-install pre-commit-run pre-commit-test

help:  ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install-dev:  ## Install development dependencies
	pip install -e ".[dev]"

lint:  ## Run all linting tools and fix issues
	python lint.py --fix

lint-check:  ## Check for linting issues without fixing
	python lint.py --check

format:  ## Format code with black and isort
	isort streamlit_lightweight_charts_pro examples tests
	black streamlit_lightweight_charts_pro examples tests

test:  ## Run tests
	pytest tests/ -v

test-cov:  ## Run tests with coverage
	pytest tests/ --cov=streamlit_lightweight_charts_pro --cov-report=html --cov-report=term

test-parallel:  ## Run tests with parallel execution (auto workers)
	pytest tests/ -n auto --dist=loadfile -v

test-parallel-fast:  ## Run tests with parallel execution (4 workers)
	pytest tests/ -n 4 --dist=loadfile -v

test-parallel-max:  ## Run tests with maximum parallel execution
	pytest tests/ -n logical --dist=loadfile -v

test-parallel-cov:  ## Run tests with parallel execution and coverage
	pytest tests/ -n auto --dist=loadfile --cov=streamlit_lightweight_charts_pro --cov-report=html --cov-report=term -v

test-unit-parallel:  ## Run unit tests with parallel execution
	pytest tests/unit/ -n auto --dist=loadfile -v

test-integration-parallel:  ## Run integration tests with parallel execution
	pytest tests/integration/ -n auto --dist=loadfile -v

clean:  ## Clean up build artifacts
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

pre-commit-install:  ## Install pre-commit hooks
	@echo "Installing pre-commit hooks..."
	@if command -v pre-commit >/dev/null 2>&1; then \
		pip install pre-commit; \
		pre-commit install; \
		echo "✅ Pre-commit hooks installed successfully!"; \
	else \
		echo "Installing pre-commit framework..."; \
		pip install pre-commit; \
		pre-commit install; \
		echo "✅ Pre-commit hooks installed successfully!"; \
	fi

pre-commit-run:  ## Run pre-commit hooks manually
	@echo "Running pre-commit hooks..."
	@if [ -f ".git/hooks/pre-commit" ]; then \
		.git/hooks/pre-commit; \
	else \
		echo "❌ Pre-commit hooks not installed. Run 'make pre-commit-install' first."; \
		exit 1; \
	fi

pre-commit-test:  ## Test pre-commit setup without installing
	@echo "Testing pre-commit configuration..."
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit run --all-files; \
	else \
		echo "Installing pre-commit for testing..."; \
		pip install pre-commit; \
		pre-commit run --all-files; \
	fi 