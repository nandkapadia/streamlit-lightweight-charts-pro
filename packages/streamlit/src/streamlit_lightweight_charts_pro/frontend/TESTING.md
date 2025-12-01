# Frontend Testing Guide

## Memory Issues and Solutions

The frontend test suite includes 1200+ tests which can cause memory issues when run all at once. This guide explains how to run tests effectively.

## Quick Reference

```bash
# ✅ Pre-commit checks (code quality only, NO tests)
npm run precommit

# ✅ Quick smoke tests (fast, low memory)
npm run test:quick

# ✅ Batched tests (recommended, runs in safe batches)
npm run test:batched

# ⚠️ Full test suite (requires high memory, may fail)
npm test

# ✅ CI/CD tests (optimized for GitHub Actions)
npm run test:unit
```

## Pre-commit Workflow

**IMPORTANT**: Pre-commit hooks do NOT run frontend tests due to memory constraints.

Pre-commit only runs:
- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)

To run pre-commit checks manually:
```bash
cd streamlit_lightweight_charts_pro/frontend
npm run precommit
```

## Running Tests

### 1. Quick Smoke Tests (Fastest)

Runs only config and utils tests - perfect for quick validation:

```bash
npm run test:quick
```

**When to use:**
- Quick sanity check after changes
- Verifying test infrastructure works
- Low memory environment

**Memory:** ~4GB
**Duration:** ~10 seconds

### 2. Batched Tests (Recommended)

Runs all tests in small batches with cleanup between:

```bash
npm run test:batched
```

**When to use:**
- Local development testing
- Pre-push validation
- Memory-constrained environments

**Memory:** ~4GB per batch
**Duration:** ~2-3 minutes

**How it works:**
- Runs one test directory at a time
- Forces cleanup between batches
- Shows progress for each batch
- Reports failures at the end

### 3. Full Test Suite

Runs all tests at once (may fail due to memory):

```bash
npm test
```

**When to use:**
- High-memory machines (16GB+ RAM)
- CI/CD environments with high memory
- Coverage reports needed

**Memory:** ~8GB
**Duration:** ~1-2 minutes

**Common issues:**
- `JavaScript heap out of memory` - Use batched tests instead
- Fork process crashes - Increase NODE_OPTIONS memory
- Hanging tests - Check for memory leaks in tests

### 4. Specific Test Categories

Run specific test directories:

```bash
# Services tests (largest category)
npm run test:services

# Primitives tests
NODE_OPTIONS='--max-old-space-size=4096' npm run test -- src/__tests__/primitives

# Components tests
NODE_OPTIONS='--max-old-space-size=4096' npm run test -- src/__tests__/components

# Single test file
NODE_OPTIONS='--max-old-space-size=4096' npm run test -- src/__tests__/config/positioningConfig.test.ts
```

### 5. Visual Tests

Run visual regression tests separately:

```bash
# All visual tests
npm run test:visual

# Update visual baselines
npm run test:visual:update

# Interactive UI
npm run test:visual:ui
```

### 6. E2E Tests

Run end-to-end tests with Playwright:

```bash
# All E2E tests
npm run test:e2e

# Update snapshots
npm run test:e2e:update

# With UI
npm run test:e2e:ui
```

## Memory Optimization Tips

### For Local Development

1. **Use batched tests** for comprehensive testing
2. **Close memory-intensive applications** before running tests
3. **Run specific test files** when debugging
4. **Use watch mode sparingly** (it keeps everything in memory)

### Increase Memory Allocation

If you have sufficient RAM (16GB+):

```bash
# 8GB heap
NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' npm test

# 12GB heap (for very large machines)
NODE_OPTIONS='--max-old-space-size=12288 --expose-gc' npm test
```

### Monitor Memory Usage

```bash
# Run with heap logging
npm test -- --logHeapUsage
```

## CI/CD Configuration

The CI/CD pipeline uses optimized test commands:

```yaml
# .github/workflows/ci.yml
- name: Run frontend tests
  working-directory: streamlit_lightweight_charts_pro/frontend
  run: npm run test:unit  # Optimized for CI
```

The `test:unit` command:
- Uses forks pool for isolation
- Single fork for memory efficiency
- No coverage during quick runs
- 6GB heap allocation

## Troubleshooting

### Error: "JavaScript heap out of memory"

**Solution 1:** Use batched tests
```bash
npm run test:batched
```

**Solution 2:** Increase memory
```bash
NODE_OPTIONS='--max-old-space-size=8192' npm test
```

**Solution 3:** Run specific test directories
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run test -- src/__tests__/config
```

### Error: "Channel closed" or fork crashes

**Cause:** Worker process ran out of memory

**Solution:** Use single fork mode (already configured in package.json)

### Tests hanging or timeout

**Cause:** Memory leak in test setup/teardown

**Solution:**
1. Check `afterEach` cleanup in test files
2. Ensure mocks are properly reset
3. Run individual test files to isolate the issue

### Flaky tests

**Cause:** Memory pressure causing timing issues

**Solution:**
1. Run tests in batches
2. Increase test timeout for specific tests
3. Add explicit waits for async operations

## Test Organization

```
src/__tests__/
├── config/           # Configuration tests (fast)
├── utils/            # Utility tests (fast)
├── helpers/          # Helper tests (fast)
├── hooks/            # React hooks tests (medium)
├── mocks/            # Mock tests (fast)
├── setup/            # Setup tests (fast)
├── primitives/       # Primitive tests (medium)
├── plugins/          # Plugin tests (medium)
├── components/       # Component tests (slow)
├── services/         # Service tests (slowest)
├── integration/      # Integration tests (slow)
├── visual/           # Visual regression tests
└── e2e-visual/       # E2E tests with Playwright
```

**Test count:** 1200+ tests
**Pass rate:** 99.75%
**Coverage target:** 90%+

## Best Practices

### Writing Tests

1. ✅ **Clean up properly** in `afterEach`
2. ✅ **Mock heavy dependencies** (lightweight-charts)
3. ✅ **Use `vi.clearAllMocks()`** between tests
4. ✅ **Avoid creating large datasets** in tests
5. ✅ **Use deterministic data** (no `Math.random()`)

### Running Tests

1. ✅ **Use batched tests** for full coverage
2. ✅ **Run specific files** when debugging
3. ✅ **Monitor memory usage** if experiencing issues
4. ✅ **Close other applications** before running tests
5. ✅ **Use CI/CD** for comprehensive testing

### Memory Management

1. ✅ **Single fork mode** for large test suites
2. ✅ **Expose GC** with `--expose-gc` flag
3. ✅ **Disable coverage** for quick runs
4. ✅ **Run tests sequentially** when needed
5. ✅ **Cleanup between batches** in custom scripts

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Project Testing Standards](../../.cursor/rules/testing-standards.mdc)

## Quick Commands Summary

```bash
# Development
npm run test:quick         # Quick smoke test
npm run test:batched       # All tests in batches (recommended)
npm run precommit          # Code quality only (no tests)

# CI/CD
npm run test:unit          # Optimized unit tests
npm run test:coverage      # With coverage report

# Specific
npm run test:visual        # Visual regression
npm run test:e2e           # End-to-end tests
npm run test -- <file>     # Single file

# Debug
npm run test:ui            # Interactive UI
npm run test:watch         # Watch mode
```

---

**Last Updated:** October 2024
**Maintained by:** Streamlit Lightweight Charts Pro Team
