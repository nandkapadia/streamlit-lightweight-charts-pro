# 🚀 Simple Development Workflow

## Quick Start

```bash
# 1. Setup (one time only)
make dev-setup

# 2. Make your changes
# ... edit code ...

# 3. Commit (choose one)
make clean-commit MSG="your message"    # ✨ RECOMMENDED: All-in-one
make smart-commit                       # Pre-commit hooks + auto-stage
make quick-commit                       # Format + stage, then commit manually
```

## Available Commands

### 🎯 **Clean Commit Workflow (Recommended)**
```bash
make clean-commit MSG="your message"    # ✨ Format + stage + commit (one command)
make smart-commit                       # Pre-commit hooks + auto-stage
make quick-commit                       # Format + stage, then commit manually
```

### 🔧 **Manual Workflow**
```bash
make commit          # Format + stage, then commit manually
make commit-force    # Skip all checks (emergency only)
```

### 🔧 **Development Setup**
```bash
make dev-setup       # Complete setup (first time)
make install-dev     # Install dependencies only
make pre-commit-install  # Install pre-commit hooks
```

### 🧹 **Code Quality**
```bash
make format          # Format Python code
make lint            # Check code quality
make test            # Run tests
```

## What Changed? ✨

### Before (Complex):
- 15+ pre-commit hooks
- Conflicting formatters
- Mysterious error messages
- 15+ second commit times
- Required Node.js + npm + conda

### After (Simple):
- 3 essential hooks only
- Single formatter (Ruff)
- Clear error messages
- 3-5 second commit times
- Python-only workflow

## Troubleshooting

### If pre-commit fails:
```bash
# Option 1: Auto-fix and retry
make fix-and-commit

# Option 2: Skip checks (emergency)
make commit-force MSG="your message"

# Option 3: Manual fix
make format
git add -A
git commit -m "your message"
```

### If you get stuck:
```bash
# Reset to clean state
git stash
make format
git add -A
git commit -m "your message"
```

## Pre-commit Hooks (Simplified)

1. **File checks** - Basic file validation
2. **Ruff** - Python formatting + linting (replaces Black, isort, flake8)
3. **Tests** - Fast unit tests only

That's it! No more complex tool chains or mysterious failures.
