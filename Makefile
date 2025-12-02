.PHONY: help install-dev lint lint-check format test clean pre-commit-install pre-commit-run pre-commit-test

# Conda environment configuration
CONDA_ENV = VectorBTPro
CONDA_ACTIVATE = source $$(conda info --base)/etc/profile.d/conda.sh && conda activate $(CONDA_ENV)

help:  ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install-dev:  ## Install development dependencies
	$(CONDA_ACTIVATE) && pip install -e ".[dev]"

lint:  ## Run all linting tools and fix issues
	$(CONDA_ACTIVATE) && python lint.py --fix

lint-check:  ## Check for linting issues without fixing
	$(CONDA_ACTIVATE) && python lint.py --check

format:  ## Format code with black and isort
	$(CONDA_ACTIVATE) && isort --float-to-top streamlit_lightweight_charts_pro examples tests
	$(CONDA_ACTIVATE) && black streamlit_lightweight_charts_pro examples tests

format-wrap:  ## Wrap long lines in docstrings, comments, and strings
	$(CONDA_ACTIVATE) && python scripts/wrap_long_lines.py streamlit_lightweight_charts_pro examples tests

format-all: format format-wrap  ## Run all formatting including line wrapping

test:  ## Run tests
	$(CONDA_ACTIVATE) && pytest tests/ -v

test-cov:  ## Run tests with coverage
	$(CONDA_ACTIVATE) && pytest tests/ --cov=streamlit_lightweight_charts_pro --cov-report=html --cov-report=term

test-parallel:  ## Run tests with parallel execution (auto workers)
	$(CONDA_ACTIVATE) && pytest tests/ -n auto --dist=loadfile -v

test-parallel-fast:  ## Run tests with parallel execution (4 workers)
	$(CONDA_ACTIVATE) && pytest tests/ -n 4 --dist=loadfile -v

test-parallel-max:  ## Run tests with maximum parallel execution
	$(CONDA_ACTIVATE) && pytest tests/ -n logical --dist=loadfile -v

test-parallel-cov:  ## Run tests with parallel execution and coverage
	$(CONDA_ACTIVATE) && pytest tests/ -n auto --dist=loadfile --cov=streamlit_lightweight_charts_pro --cov-report=html --cov-report=term -v

test-unit-parallel:  ## Run unit tests with parallel execution
	$(CONDA_ACTIVATE) && pytest tests/unit/ -n auto --dist=loadfile -v

test-integration-parallel:  ## Run integration tests with parallel execution
	$(CONDA_ACTIVATE) && pytest tests/integration/ -n auto --dist=loadfile -v

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
	@$(CONDA_ACTIVATE) && if command -v pre-commit >/dev/null 2>&1; then \
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
	@$(CONDA_ACTIVATE) && pre-commit run --all-files --hook-stage manual

pre-commit-fix:  ## Run pre-commit and auto-fix issues
	@echo "Running pre-commit with auto-fix..."
	@$(CONDA_ACTIVATE) && pre-commit run --all-files --hook-stage manual

pre-commit-update:  ## Update pre-commit hooks to latest versions
	@echo "Updating pre-commit hooks..."
	@$(CONDA_ACTIVATE) && pre-commit autoupdate

pre-commit-clean:  ## Clean pre-commit cache
	@echo "Cleaning pre-commit cache..."
	@$(CONDA_ACTIVATE) && pre-commit clean

verify-ci:  ## Verify CI/CD setup and branch protection
	@echo "Verifying CI/CD setup..."
	@bash scripts/verify_ci_setup.sh

setup-branch-protection:  ## Setup GitHub branch protection rules
	@echo "Setting up branch protection..."
	@bash scripts/setup_branch_protection.sh

test-frontend:  ## Run frontend tests and checks
	@echo "Running frontend tests..."
	@cd packages/streamlit/src/streamlit_lightweight_charts_pro/frontend && npm run test:all

format-frontend:  ## Format frontend code
	@echo "Formatting frontend code..."
	@cd packages/streamlit/src/streamlit_lightweight_charts_pro/frontend && npm run format

lint-frontend:  ## Lint frontend code
	@echo "Linting frontend code..."
	@cd packages/streamlit/src/streamlit_lightweight_charts_pro/frontend && npm run lint

# Documentation commands
docs-serve:  ## Serve documentation locally
	@echo "Serving documentation at http://localhost:8000..."
	@$(CONDA_ACTIVATE) && mkdocs serve

docs-build:  ## Build documentation
	@echo "Building documentation..."
	@$(CONDA_ACTIVATE) && mkdocs build

docs-deploy:  ## Deploy documentation to GitHub Pages
	@echo "Deploying documentation..."
	@$(CONDA_ACTIVATE) && mkdocs gh-deploy

docs-clean:  ## Clean documentation build artifacts
	@echo "Cleaning documentation build artifacts..."
	@rm -rf site/

docs-install:  ## Install documentation dependencies
	@echo "Installing documentation dependencies..."
	@$(CONDA_ACTIVATE) && pip install -e ".[docs]"

docs-check:  ## Check documentation for issues
	@echo "Checking documentation..."
	@$(CONDA_ACTIVATE) && mkdocs build --strict

# Smart commit workflow (handles formatting automatically)
commit:  ## Format code and commit with auto-staging
	@echo "🔧 Formatting and committing..."
	@make format
	@git add -A
	@echo "✅ Code formatted and staged. Ready to commit!"
	@echo "💡 Run 'git commit -m \"your message\"' to commit"

commit-force:  ## Force commit without pre-commit checks
	@echo "⚠️  Force committing without pre-commit checks..."
	@git commit --no-verify -m "$(MSG)"

smart-commit:  ## Smart commit with pre-commit hooks and auto-staging
	@echo "🧠 Smart commit workflow..."
	@echo "🔧 Running pre-commit checks (will auto-stage changes)..."
	@.git/hooks/pre-commit
	@echo "✅ Pre-commit checks passed. Ready to commit!"
	@echo "💡 Run 'git commit -m \"your message\"' to commit"

# Quick development workflow
dev-setup:  ## Complete development setup
	@echo "🚀 Setting up development environment..."
	@make install-dev
	@make pre-commit-install
	@echo "✅ Development environment ready!"

quick-commit:  ## Quick commit with auto-formatting and staging
	@echo "⚡ Quick commit workflow..."
	@make format
	@git add -A
	@echo "✅ Staged and formatted. Run 'git commit -m \"your message\"'"

# Clean commit workflow (recommended)
clean-commit:  ## Clean commit: format, stage, and commit in one go
	@echo "✨ Clean commit workflow..."
	@make format
	@git add -A
	@if [ -n "$(MSG)" ]; then \
		echo "📝 Committing with message: $(MSG)"; \
		$(CONDA_ACTIVATE) && git commit -m "$(MSG)"; \
		echo "✅ Commit successful!"; \
	else \
		echo "⚠️  No commit message provided. Use: make clean-commit MSG=\"your message\""; \
		echo "💡 Or run 'git commit -m \"your message\"' manually"; \
	fi
