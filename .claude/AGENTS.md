# Agent Guidelines for streamlit-lightweight-charts-pro

This document provides specialized guidance for AI agents (autonomous task executors) working on the streamlit-lightweight-charts-pro codebase.

## Table of Contents
- [Agent Roles](#agent-roles)
- [Task Patterns](#task-patterns)
- [Search Strategies](#search-strategies)
- [Code Modification Patterns](#code-modification-patterns)
- [Testing Strategies](#testing-strategies)
- [Error Recovery](#error-recovery)
- [Performance Guidelines](#performance-guidelines)

---

## Agent Roles

### General Purpose Agent
**Use for**: Multi-step tasks, research, complex searches, planning

**Capabilities**:
- Read multiple files in sequence
- Search codebase with multiple strategies
- Execute multi-step workflows
- Create comprehensive plans
- Coordinate between Python and TypeScript

**Example Tasks**:
- "Investigate how session state persistence works"
- "Find all references to lazy loading and remove them"
- "Research and document the series factory pattern"

### Explore Agent
**Use for**: Quick codebase exploration, finding patterns, understanding architecture

**Capabilities**:
- Fast file pattern matching
- Keyword searches
- Directory tree exploration
- Quick architecture overview

**Example Tasks**:
- "Find all files related to chart rendering"
- "Locate series type definitions"
- "Show me the component initialization flow"

### Plan Agent
**Use for**: Designing implementation strategies before coding

**Capabilities**:
- Architectural analysis
- Trade-off evaluation
- Step-by-step planning
- Critical file identification

**Example Tasks**:
- "Plan implementation for adding new primitive type"
- "Design approach for optimizing re-render performance"
- "Evaluate strategies for adding lazy loading"

---

## Task Patterns

### Pattern 1: Feature Addition

**Typical Flow**:
```
1. Plan Agent: Design approach
2. Explore Agent: Find relevant files
3. General Agent: Implement changes
   - Update Python classes
   - Update TypeScript types
   - Add tests
   - Update documentation
4. Verify: Run tests and formatters
```

**Example**: Adding new series type
```bash
# Step 1: Plan
Plan Agent → "Design implementation for TrendArrow series type"

# Step 2: Explore existing patterns
Explore Agent → "Find all series descriptor files and implementations"

# Step 3: Implement
General Agent →
  - Create TrendArrowSeriesDescriptor.ts
  - Register in descriptors/index.ts
  - Add Python TrendArrowSeries class
  - Add tests
  - Update documentation

# Step 4: Verify
Run: npm run test, pytest tests/, formatters
```

### Pattern 2: Bug Fix

**Typical Flow**:
```
1. Explore Agent: Locate bug source
2. General Agent: Understand root cause
3. General Agent: Implement fix
4. General Agent: Add regression test
5. Verify: Ensure fix works
```

**Example**: Session state not persisting
```bash
# Step 1: Find relevant code
Explore Agent → "Search for session state save/load logic"

# Step 2: Analyze
General Agent → Read session_state_manager.py, chart_renderer.py, chart.py

# Step 3: Fix
General Agent → Update handle_response() to properly save configs

# Step 4: Test
General Agent → Add test_session_state_persistence.py

# Step 5: Verify
Run: pytest tests/test_session_state_persistence.py -v
```

### Pattern 3: Refactoring

**Typical Flow**:
```
1. Plan Agent: Design refactoring strategy
2. Explore Agent: Find all affected files
3. General Agent: Execute refactoring
   - Update imports
   - Rename functions/classes
   - Update tests
   - Update documentation
4. Verify: All tests pass
```

**Example**: Rename component initialization logic
```bash
# Step 1: Plan
Plan Agent → "Design safe refactoring of component initialization"

# Step 2: Find usages
Explore Agent → "Find all files using _initialize_component"

# Step 3: Refactor
General Agent →
  - Rename function
  - Update all call sites
  - Update tests
  - Update comments

# Step 4: Verify
Run: pytest tests/, npm run test, type checks
```

### Pattern 4: Documentation Update

**Typical Flow**:
```
1. Explore Agent: Understand current state
2. General Agent: Update documentation
   - Docstrings
   - README
   - CHANGELOG
   - Examples
3. Verify: Documentation builds, examples run
```

---

## Search Strategies

### Finding Functionality

**Strategy 1: Start with exports**
```python
# Look at __init__.py to find public API
Read: streamlit_lightweight_charts_pro/__init__.py

# Then drill down to implementation
Read: streamlit_lightweight_charts_pro/charts/chart.py
```

**Strategy 2: Search by feature name**
```bash
Grep: "series_settings" → files_with_matches
Read: Top results to understand implementation
```

**Strategy 3: Follow imports**
```python
# Start at entry point
Read: frontend/src/index.tsx

# Follow imports
→ Read: frontend/src/LightweightCharts.tsx
→ Read: frontend/src/series/UnifiedSeriesFactory.ts
```

### Finding Test Files

**Pattern**:
```bash
# Python tests
Glob: tests/**/test_<feature>.py

# TypeScript tests
Glob: frontend/src/__tests__/**/<Component>.test.tsx
```

### Finding Examples

**Pattern**:
```bash
Glob: examples/**/<feature>*.py
```

---

## Code Modification Patterns

### Python Modifications

**Always follow this sequence**:

```python
# 1. Read the file first
Read: path/to/file.py

# 2. Make changes
Edit: path/to/file.py
  old_string: "..."
  new_string: "..."

# 3. Run formatters (in this exact order)
Bash: isort --float-to-top path/to/file.py
Bash: autoflake --in-place --remove-unused-variables path/to/file.py
Bash: black --line-length 99 --enable-unstable-feature=string_processing --preview path/to/file.py
Bash: ruff check --fix path/to/file.py

# 4. Run tests
Bash: pytest tests/test_specific.py -v
```

**Docstring Template**:
```python
def function_name(arg1: Type1, arg2: Type2) -> ReturnType:
    """Short one-line summary.

    Longer description explaining what the function does, why it exists,
    and any important behavioral details.

    Args:
        arg1 (Type1): Description of arg1 with context.
        arg2 (Type2): Description of arg2 with context.

    Returns:
        ReturnType: Description of return value with context.

    Raises:
        ExceptionType: When this exception occurs.

    Example:
        >>> result = function_name(value1, value2)
        >>> print(result)
        expected_output
    """
    # Implementation with inline comments explaining complex logic
    pass
```

### TypeScript Modifications

**Always follow this sequence**:

```typescript
// 1. Read the file first
Read: frontend/src/path/to/file.ts

// 2. Make changes
Edit: frontend/src/path/to/file.ts
  old_string: "..."
  new_string: "..."

// 3. Run formatters
Bash: cd frontend && npx prettier --write src/path/to/file.ts
Bash: cd frontend && npx eslint --fix src/path/to/file.ts
Bash: cd frontend && npx tsc --noEmit

// 4. Run tests
Bash: cd frontend && npm run test path/to/file.test.ts
```

**JSDoc Template**:
```typescript
/**
 * Short one-line summary.
 *
 * Longer description explaining what the function does, why it exists,
 * and any important behavioral details.
 *
 * @param arg1 - Description of arg1 with context
 * @param arg2 - Description of arg2 with context
 * @returns Description of return value with context
 *
 * @example
 * ```typescript
 * const result = functionName(value1, value2);
 * console.log(result);
 * ```
 */
export function functionName(arg1: Type1, arg2: Type2): ReturnType {
  // Implementation with inline comments
}
```

### Multi-File Changes

**Strategy**: Process files in dependency order

```bash
# Example: Adding new option

# 1. Core type definition (Python)
Read: lightweight-charts-pro-python/charts/options/chart_options.py
Edit: Add new option field

# 2. Wrapper re-export (Python)
Read: streamlit_lightweight_charts_pro/__init__.py
# Usually no change needed (re-exports from core)

# 3. Frontend type definition (TypeScript)
Read: frontend/src/types.ts
Edit: Add new option to interface

# 4. Frontend usage (TypeScript)
Read: frontend/src/LightweightCharts.tsx
Edit: Use new option in chart creation

# 5. Tests (both)
Edit: tests/test_options.py
Edit: frontend/src/__tests__/components/LightweightCharts.test.tsx

# 6. Examples
Edit: examples/options/new_option_example.py

# 7. Documentation
Edit: README.md
Edit: CHANGELOG.md
```

---

## Testing Strategies

### Test-Driven Development

**Recommended approach** for new features:

```bash
# 1. Write failing test first
Edit: tests/test_new_feature.py

"""Test new feature."""

def test_new_feature():
    # Arrange
    chart = Chart()

    # Act
    result = chart.new_feature()

    # Assert
    assert result is not None
    assert result.property == expected_value

# 2. Run test (should fail)
Bash: pytest tests/test_new_feature.py -v

# 3. Implement feature
Edit: streamlit_lightweight_charts_pro/charts/chart.py

# 4. Run test (should pass)
Bash: pytest tests/test_new_feature.py -v

# 5. Refactor if needed
# 6. Re-run tests to ensure still passing
```

### Test Coverage Gaps

**Find untested code**:
```bash
# Python coverage
Bash: pytest tests/ --cov=streamlit_lightweight_charts_pro --cov-report=html
Read: htmlcov/index.html

# TypeScript coverage
Bash: cd frontend && npm run test:coverage
Read: frontend/coverage/index.html
```

### Visual Regression Tests

**When to update snapshots**:
```typescript
// After intentional visual changes
Bash: cd frontend && npm run test:update-snapshots

// Always review changes before committing
Bash: git diff frontend/src/__tests__/**/*-snapshots/
```

---

## Error Recovery

### Common Error Patterns

#### Error: "Component not available"

**Diagnosis**:
```bash
# Check frontend build
Bash: ls -la streamlit_lightweight_charts_pro/frontend/build/

# If missing, build it
Bash: cd streamlit_lightweight_charts_pro/frontend && npm run build
```

#### Error: "Module not found"

**Python**:
```bash
# Check imports are absolute
Read: <file_with_error>
# Verify import paths start with package name

# Reinstall in editable mode
Bash: pip install -e .
```

**TypeScript**:
```bash
# Check tsconfig paths
Read: frontend/tsconfig.json

# Clear cache and reinstall
Bash: cd frontend && rm -rf node_modules/.vite && npm install
```

#### Error: Type checking failures

**TypeScript**:
```bash
# Run type checker
Bash: cd frontend && npx tsc --noEmit

# Fix issues one by one
# Common fixes:
# - Add missing type imports
# - Fix any usage
# - Add type guards
# - Update interface definitions
```

#### Error: Test failures

**Strategy**:
```bash
# Run with verbose output
Bash: pytest tests/ -vv --tb=long  # Python
Bash: cd frontend && npm run test -- --reporter=verbose  # TypeScript

# Run specific test
Bash: pytest tests/test_file.py::test_function -vv

# Use debugger
Bash: pytest tests/ --pdb  # Python
Bash: cd frontend && npm run test:ui  # TypeScript (interactive)
```

### Recovery Procedures

#### Corrupted Session State

```python
# Clear session state in app
import streamlit as st

if st.button("Clear Session State"):
    st.session_state.clear()
    st.rerun()
```

#### Build Issues

```bash
# Nuclear option: Clean everything
Bash: cd frontend && rm -rf node_modules build .vite
Bash: npm install
Bash: npm run build

# Python
Bash: rm -rf dist/ build/ *.egg-info
Bash: pip install -e .
```

---

## Performance Guidelines

### Minimize File Reads

**Bad**:
```bash
# Reading same file multiple times
Read: file.py  # Check structure
Read: file.py  # Get function definition
Read: file.py  # Find imports
```

**Good**:
```bash
# Read once, analyze in memory
Read: file.py
# Use content for all analysis
```

### Batch Operations

**Bad**:
```bash
# Format files one by one
Bash: black file1.py
Bash: black file2.py
Bash: black file3.py
```

**Good**:
```bash
# Format all at once
Bash: black file1.py file2.py file3.py
# Or use glob
Bash: black streamlit_lightweight_charts_pro/**/*.py
```

### Parallel Tool Calls

**When operations are independent, run in parallel**:
```bash
# Multiple independent tool calls in single message
Read: file1.py
Read: file2.py
Read: file3.py

# Not:
# Message 1: Read file1.py
# Message 2: Read file2.py
# Message 3: Read file3.py
```

### Smart Search

**Progressive refinement**:
```bash
# Start broad
Grep: "render" → files_with_matches

# Narrow down
Read: <most promising files>

# Specific search
Grep: "render.*chart" → content
```

---

## Agent-Specific Patterns

### General Purpose Agent

**Strengths**:
- Multi-step workflows
- Complex problem solving
- Cross-file changes
- Documentation updates

**Use for**:
```bash
# Task: "Refactor series creation to use factory pattern"
1. Plan: Identify all series creation points
2. Design: Create factory interface
3. Implement: Update all call sites
4. Test: Ensure all series types still work
5. Document: Update architecture docs
```

**Anti-patterns**:
- Don't use for simple file searches (use Explore Agent)
- Don't use for quick architecture questions (use Explore Agent)

### Explore Agent

**Strengths**:
- Fast codebase navigation
- Pattern discovery
- Quick architecture understanding

**Use for**:
```bash
# Task: "Find all error handling code"
Grep: "raise.*Error|except.*Error" → files_with_matches

# Task: "Show frontend component structure"
Glob: frontend/src/components/**/*.tsx
```

**Anti-patterns**:
- Don't use for code modifications
- Don't use for multi-step workflows

### Plan Agent

**Strengths**:
- Architecture design
- Implementation strategy
- Trade-off analysis
- Critical path identification

**Use for**:
```bash
# Task: "Plan migration from React 18 to React 19"
→ Identify breaking changes
→ Find affected components
→ Design migration strategy
→ List testing requirements
→ Suggest rollback plan
```

**Anti-patterns**:
- Don't use for simple tasks
- Don't use for execution (only planning)

---

## Decision Trees

### "Should I use TodoWrite?"

```
Is this a multi-step task (≥3 steps)?
├─ Yes → Use TodoWrite
│  └─ Update on each step completion
└─ No → Skip TodoWrite
   └─ Just complete the task
```

### "Which agent should I use?"

```
What's the task?
├─ Implement feature
│  ├─ Complex (multiple files, cross-cutting) → General Purpose
│  └─ Simple (single file, localized) → General Purpose
├─ Find information
│  ├─ Quick lookup → Explore
│  └─ Research/analysis → General Purpose
├─ Design approach
│  └─ Plan
└─ Fix bug
   ├─ Unknown location → Explore first, then General Purpose
   └─ Known location → General Purpose
```

### "Should I run tests?"

```
Did I modify code?
├─ Yes
│  ├─ Python → pytest tests/ -v
│  └─ TypeScript → npm run test
└─ No → Skip tests
```

### "Should I format code?"

```
Did I modify code?
├─ Yes
│  ├─ Python → isort, autoflake, black, ruff
│  └─ TypeScript → prettier, eslint
└─ No → Skip formatters
```

---

## Best Practices Summary

### DO

✅ **Read files before editing**
✅ **Run formatters after every code change**
✅ **Write tests for new features**
✅ **Update documentation when APIs change**
✅ **Use absolute imports**
✅ **Follow Google-style docstrings**
✅ **Keep line width ≤ 100 characters**
✅ **Run tests before committing**
✅ **Use type hints (Python) and types (TypeScript)**
✅ **Add inline comments for complex logic**

### DON'T

❌ **Don't skip formatters**
❌ **Don't commit failing tests**
❌ **Don't use relative imports**
❌ **Don't hardcode values without constants**
❌ **Don't ignore type errors**
❌ **Don't skip documentation**
❌ **Don't use `any` in TypeScript (unless necessary)**
❌ **Don't modify core dependencies directly**
❌ **Don't forget to update version numbers**
❌ **Don't skip changelog updates**

---

## Example Agent Workflows

### Example 1: Add New Custom Primitive

```bash
# Agent: Plan
Task: "Design implementation for custom TooltipPrimitive"

Output:
1. Create primitive class in frontend/src/primitives/
2. Implement ISeriesPrimitive interface
3. Add attachment logic in LightweightCharts.tsx
4. Add Python wrapper in lightweight-charts-pro
5. Add tests
6. Add example

# Agent: General Purpose
Task: "Implement TooltipPrimitive following the plan"

Step 1: Create primitive
Edit: frontend/src/primitives/TooltipPrimitive.ts
[Implement primitive class]

Step 2: Register primitive
Edit: frontend/src/LightweightCharts.tsx
[Add attachment logic]

Step 3: Add tests
Edit: frontend/src/__tests__/primitives/TooltipPrimitive.test.ts
[Write tests]

Step 4: Format and verify
Bash: cd frontend && npm run code-quality
Bash: npm run test primitives/TooltipPrimitive
```

### Example 2: Debug Performance Issue

```bash
# Agent: Explore
Task: "Find performance-critical rendering code"

Grep: "render|useEffect|useMemo" → files_with_matches
Read: frontend/src/LightweightCharts.tsx
Read: frontend/src/hooks/useSeriesUpdate.ts

# Agent: General Purpose
Task: "Analyze rendering performance"

Read: [critical files identified above]
Analysis:
- Series updates triggering full re-renders
- Missing memoization on expensive computations
- ResizeObserver firing too frequently

Recommendations:
1. Add useMemo to series factory
2. Debounce ResizeObserver
3. Use React.memo on child components

# Agent: General Purpose
Task: "Implement performance optimizations"

Edit: [Apply memoization]
Edit: [Add debouncing]
Edit: [Wrap components with React.memo]

Verify:
Bash: cd frontend && npm run test
Bash: npm run test:performance
```

### Example 3: Migration Task

```bash
# Agent: Plan
Task: "Plan migration to use dev branch for dependencies"

Output:
1. Update pyproject.toml dependency URL
2. Verify dev branch exists
3. Test installation
4. Update documentation
5. Update CI/CD if needed

# Agent: General Purpose
Task: "Execute migration plan"

Step 1: Update dependency
Edit: pyproject.toml
  old: "@master"
  new: "@dev"

Step 2: Verify
Bash: git ls-remote https://github.com/nandkapadia/lightweight-charts-pro-python.git dev

Step 3: Test
Bash: pip install -e .

Step 4: Document
Edit: README.md
[Update installation instructions]

Edit: .claude/CLAUDE.md
[Update dependency information]
```

---

## Troubleshooting Agent Tasks

### Agent getting stuck

**Symptoms**: Repeating same actions, not making progress

**Recovery**:
1. Simplify the task into smaller steps
2. Provide explicit file paths
3. Use more specific search terms
4. Switch agent types (Explore → General Purpose)

### Agent missing context

**Symptoms**: Making wrong assumptions, missing files

**Recovery**:
1. Provide architecture overview explicitly
2. List relevant files upfront
3. Give more context in task description
4. Use Plan Agent first to scope the work

### Agent making too many changes

**Symptoms**: Touching unnecessary files, over-engineering

**Recovery**:
1. Be more specific in task description
2. Explicitly state "only modify X, don't touch Y"
3. Provide constraints upfront
4. Review plan before execution

---

## Agent Collaboration Patterns

### Sequential Agents

```
Plan Agent → Explore Agent → General Purpose Agent
1. Design approach
2. Find relevant files
3. Execute implementation
```

### Parallel Agents

```
Multiple General Purpose Agents in parallel:
- Agent 1: Update Python code
- Agent 2: Update TypeScript code
- Agent 3: Update tests
- Agent 4: Update documentation

(Coordinate results at end)
```

### Iterative Agents

```
General Purpose Agent (loop):
1. Implement feature chunk
2. Run tests
3. If tests fail, fix
4. Repeat until all tests pass
```

---

**Remember**: Agents are tools. Use the right agent for the task, provide clear instructions, and verify results. When in doubt, break complex tasks into smaller, manageable pieces.
