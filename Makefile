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
	isort --float-to-top streamlit_lightweight_charts_pro examples tests
	black streamlit_lightweight_charts_pro examples tests

format-wrap:  ## Wrap long lines in docstrings, comments, and strings
	python scripts/wrap_long_lines.py streamlit_lightweight_charts_pro examples tests

format-all: format format-wrap  ## Run all formatting including line wrapping

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

pre-commit-install:  ## Install pre-commit hooks with improved setup
	@echo "Installing improved pre-commit configuration..."
	@bash scripts/setup-precommit.sh

pre-commit-setup:  ## Setup pre-commit with all improvements
	@echo "Setting up comprehensive pre-commit configuration..."
	@bash scripts/setup-precommit.sh

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

pre-commit-backend:  ## Run backend pre-commit checks only
	@echo "Running backend pre-commit checks..."
	@bash scripts/run-backend-precommit.sh

pre-commit-frontend:  ## Run frontend pre-commit checks only (basic)
	@echo "Running basic frontend pre-commit checks..."
	@bash scripts/run-frontend-precommit-basic.sh

pre-commit-frontend-full:  ## Run full frontend pre-commit checks (including type checking)
	@echo "Running full frontend pre-commit checks..."
	@bash scripts/run-frontend-precommit.sh

pre-commit-frontend-production:  ## Run frontend pre-commit checks on production code only
	@echo "Running frontend production code pre-commit checks..."
	@bash scripts/run-frontend-precommit-production.sh

pre-commit-both:  ## Run both backend and frontend pre-commit checks
	@echo "Running comprehensive pre-commit checks..."
	@bash .git/hooks/pre-commit

pre-commit-fast:  ## Run only fast pre-commit checks (no tests)
	@echo "Running fast pre-commit checks..."
	@pre-commit run --all-files --hook-stage manual

pre-commit-fix:  ## Run pre-commit and auto-fix issues
	@echo "Running pre-commit with auto-fix..."
	@pre-commit run --all-files --hook-stage manual

pre-commit-update:  ## Update pre-commit hooks to latest versions
	@echo "Updating pre-commit hooks..."
	@pre-commit autoupdate

pre-commit-clean:  ## Clean pre-commit cache
	@echo "Cleaning pre-commit cache..."
	@pre-commit clean

test-frontend:  ## Run frontend tests and checks
	@echo "Running frontend tests..."
	@cd streamlit_lightweight_charts_pro/frontend && npm test -- --watchAll=false

format-frontend:  ## Format frontend code
	@echo "Formatting frontend code..."
	@cd streamlit_lightweight_charts_pro/frontend && npm run format

lint-frontend:  ## Lint frontend code
	@echo "Linting frontend code..."
	@cd streamlit_lightweight_charts_pro/frontend && npm run lint

# Documentation commands
docs-serve:  ## Serve documentation locally
	@echo "Serving documentation at http://localhost:8000..."
	@mkdocs serve

docs-build:  ## Build documentation
	@echo "Building documentation..."
	@mkdocs build

docs-deploy:  ## Deploy documentation to GitHub Pages
	@echo "Deploying documentation..."
	@mkdocs gh-deploy

docs-clean:  ## Clean documentation build artifacts
	@echo "Cleaning documentation build artifacts..."
	@rm -rf site/

docs-install:  ## Install documentation dependencies
	@echo "Installing documentation dependencies..."
	@pip install -e ".[docs]"

docs-check:  ## Check documentation for issues
	@echo "Checking documentation..."
	@mkdocs build --strict
