# Branch Protection & CI/CD Complete Guide

This comprehensive guide explains how to configure GitHub branch protection to ensure code can only be merged into `main` when all tests pass.

## 📋 Table of Contents

- [Quick Setup (5 Minutes)](#-quick-setup-5-minutes)
- [What This Protects Against](#-what-this-protects-against)
- [Detailed Configuration](#-detailed-configuration)
- [Testing the Setup](#-testing-the-setup)
- [Status Checks Explained](#-status-checks-explained)
- [Developer Workflow](#-developer-workflow)
- [Available Commands](#-available-commands)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Best Practices](#-best-practices)

---

## ⚡ Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

If you have GitHub CLI installed and authenticated:

```bash
make setup-branch-protection
```

This script will:
- ✅ Check your GitHub CLI is authenticated
- ✅ Show you what will be configured
- ✅ Ask for confirmation
- ✅ Apply all required status checks
- ✅ Configure pull request approvals
- ✅ Verify the setup succeeded

### Option 2: Manual Setup (GitHub Web UI)

1. **Go to your repository on GitHub**

2. **Navigate to Settings → Branches → Add branch protection rule**

3. **Branch name pattern**: `main`

4. **Enable these settings:**

   **✅ Require a pull request before merging**
   - Require approvals: 1
   - Dismiss stale pull request approvals when new commits are pushed
   - Require approval of the most recent reviewable push

   **✅ Require status checks to pass before merging**
   - Check "Require branches to be up to date before merging"
   - Select these required checks:
     - `Test Suite (3.8)`
     - `Test Suite (3.9)`
     - `Test Suite (3.10)`
     - `Test Suite (3.11)`
     - `Test Suite (3.12)`
     - `Documentation Build`
     - `Frontend Build`
     - `Security Scan`

   **✅ Require conversation resolution before merging**

   **✅ Include administrators**

   **⬜ Allow force pushes** - LEAVE DISABLED

   **⬜ Allow deletions** - LEAVE DISABLED

5. **Click "Create"** at the bottom

> **Note**: Status checks will only appear after they've run at least once. Create a test PR first if you don't see them.

### Verify Setup

```bash
# Run verification script
make verify-ci

# Or directly:
bash scripts/verify_ci_setup.sh
```

Expected output:
```
✅ GitHub Actions workflows configured
✅ Pre-commit hooks configured and installed
✅ Test suite configured
✅ Branch protection enabled
```

---

## 🔒 What This Protects Against

### Blocked Actions ❌
- ✅ Merging code with failing tests
- ✅ Merging code with linting errors
- ✅ Merging code with type errors
- ✅ Merging code with security vulnerabilities
- ✅ Merging code without code review
- ✅ Merging code with unresolved review comments
- ✅ Force pushing to main branch
- ✅ Deleting main branch
- ✅ Merging outdated branches

### Allowed Actions ✅
- Creating feature branches
- Committing to feature branches
- Pushing to feature branches
- Creating pull requests
- Merging after all requirements met

### Merge Requirements

Before code can be merged into `main`, it MUST satisfy:

1. ✅ **All Python versions tests pass** (3.8, 3.9, 3.10, 3.11, 3.12)
2. ✅ **Documentation builds successfully**
3. ✅ **Frontend builds and tests pass**
4. ✅ **Security scan passes** (no critical vulnerabilities)
5. ✅ **Code review approved** (at least 1 approval)
6. ✅ **All review comments resolved**
7. ✅ **Branch is up-to-date** with main

**Total time per PR**: ~5-10 minutes for all checks

---

## 🛠️ Detailed Configuration

### Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar under "Code and automation")
4. Click **Add branch protection rule**

### Step 2: Configure Branch Protection Rule

#### **Branch Name Pattern**
```
main
```

#### **Required Settings**

##### 1. **Require a Pull Request Before Merging**
- ☑️ Enable this option
- ☑️ **Require approvals**: Set to `1` or more
- ☑️ **Dismiss stale pull request approvals when new commits are pushed**
- ☑️ **Require review from Code Owners** (optional, if you have CODEOWNERS file)
- ☑️ **Require approval of the most recent reviewable push**

##### 2. **Require Status Checks to Pass Before Merging**
- ☑️ Enable this option
- ☑️ **Require branches to be up to date before merging**
- **Select these required status checks:**
  - `Test Suite (3.8)` - Python 3.8 tests
  - `Test Suite (3.9)` - Python 3.9 tests
  - `Test Suite (3.10)` - Python 3.10 tests
  - `Test Suite (3.11)` - Python 3.11 tests
  - `Test Suite (3.12)` - Python 3.12 tests
  - `Documentation Build` - Documentation verification
  - `Frontend Build` - Frontend build and tests
  - `Security Scan` - Security vulnerability scanning

> **Note**: Status checks appear in the list only after they've run at least once. Create a test PR to make them appear.

##### 3. **Require Conversation Resolution Before Merging**
- ☑️ Enable this option
- Ensures all review comments are addressed

##### 4. **Require Signed Commits** (Optional but Recommended)
- ☑️ Enable for extra security
- Team members will need to configure GPG signing

##### 5. **Require Linear History** (Optional)
- ☑️ Enable to prevent merge commits
- Forces rebase or squash merging only

##### 6. **Include Administrators**
- ☑️ Enable this option
- Ensures even admins follow the rules

##### 7. **Restrict Who Can Push to Matching Branches** (Optional)
- Configure if you want to limit who can push directly
- Useful for larger teams

##### 8. **Allow Force Pushes**
- ⬜ **LEAVE DISABLED** - Never allow force pushes to main

##### 9. **Allow Deletions**
- ⬜ **LEAVE DISABLED** - Prevent accidental branch deletion

### Step 3: Save Changes
Click **Create** at the bottom of the page.

---

## 🔄 Testing the Setup

### Create a Test Pull Request

1. **Create a new branch:**
   ```bash
   git checkout -b test/branch-protection
   ```

2. **Make a small change:**
   ```bash
   echo "# Test Branch Protection" >> README.md
   git add README.md
   git commit -m "test: verify branch protection"
   git push origin test/branch-protection
   ```

3. **Create Pull Request:**
   - Go to GitHub and create a PR
   - You should see status checks running
   - Merge button will be disabled until all checks pass

4. **Verify Protections:**
   - ❌ Try to merge before checks complete → Should be blocked
   - ❌ Try to force push to main → Should be rejected
   - ✅ Wait for all checks to pass → Merge button enables

---

## 📊 Status Checks Explained

| Check | Purpose | Duration | Blocks Merge? |
|-------|---------|----------|---------------|
| **Test Suite (3.8-3.12)** | Tests on all Python versions | 2-5 min | ✅ Yes |
| **Documentation Build** | Ensures docs build correctly | 1-2 min | ✅ Yes |
| **Frontend Build** | TypeScript/React build & tests | 2-3 min | ✅ Yes |
| **Security Scan** | Trivy vulnerability scanning | 1-2 min | ✅ Yes |

### Python Test Suite
- **Purpose**: Ensures code works on all supported Python versions
- **Runs**: Unit tests, integration tests, type checking
- **Coverage**: Must maintain 95%+ coverage
- **Duration**: ~2-5 minutes per Python version

### Documentation Build
- **Purpose**: Ensures documentation builds correctly
- **Runs**: MkDocs build, link validation
- **Duration**: ~1-2 minutes

### Frontend Build
- **Purpose**: Ensures React/TypeScript frontend builds and tests pass
- **Runs**: TypeScript compilation, ESLint, Prettier, Vitest tests
- **Duration**: ~2-3 minutes

### Security Scan
- **Purpose**: Identifies security vulnerabilities
- **Runs**: Trivy vulnerability scanner
- **Duration**: ~1-2 minutes

---

## 🚀 Developer Workflow

### Standard Development Flow

```bash
# 1. Create feature branch
git checkout -b feature/my-awesome-feature

# 2. Make your changes
# ... edit files, write code ...

# 3. Run tests locally (catches issues early)
make test-parallel        # Fast parallel testing
make format              # Auto-fix formatting
make lint                # Check code quality

# 4. Commit your changes
git add .
git commit -m "feat: add awesome new feature"
# Pre-commit hooks run automatically and check:
# - Code formatting
# - Linting
# - Type checking
# - Basic tests

# 5. Push to GitHub
git push origin feature/my-awesome-feature

# 6. Create Pull Request on GitHub
# - CI runs automatically
# - Status checks appear in PR
# - Wait for all checks to pass

# 7. Request code review
# - Tag relevant team members
# - Address any review comments

# 8. Merge!
# - Once approved + all checks pass
# - Use "Squash and merge" or "Rebase and merge"
# - Delete branch after merging
```

### If CI Checks Fail

```bash
# 1. Check which test failed (look at CI logs on GitHub)

# 2. Pull latest changes
git pull origin main

# 3. Run checks locally to reproduce
make test              # Run all tests
make test-parallel     # Faster with parallel execution
make lint             # Check linting issues
make format           # Auto-fix formatting issues

# 4. Fix the issues
# ... make corrections ...

# 5. Verify fixes locally
make pre-commit-run    # Run all pre-commit checks

# 6. Commit and push fixes
git add .
git commit -m "fix: resolve CI test failures"
git push origin feature/my-awesome-feature

# CI will automatically re-run all checks
```

---

## 🛠️ Available Commands

### Verification
```bash
make verify-ci                   # Verify CI/CD setup
make setup-branch-protection     # Setup branch protection (automated)
bash scripts/verify_ci_setup.sh  # Run verification script directly
```

### Testing
```bash
make test                      # Run all tests
make test-parallel             # Run tests in parallel (faster)
make test-cov                  # Run tests with coverage report
make test-unit-parallel        # Run only unit tests
make test-integration-parallel # Run only integration tests
```

### Code Quality
```bash
make format                    # Auto-format code
make lint                      # Check code quality
make lint-check                # Check without fixing
```

### Pre-commit Hooks
```bash
make pre-commit-setup          # Setup pre-commit hooks
make pre-commit-run            # Run pre-commit manually
make pre-commit-backend        # Run only Python checks
make pre-commit-frontend       # Run only frontend checks
```

### Frontend
```bash
make test-frontend             # Run frontend tests
make format-frontend           # Format frontend code
make lint-frontend             # Lint frontend code
```

---

## 🚨 Troubleshooting

### Issue: Status Checks Don't Appear

**Solution:**
1. Create a test PR to trigger workflows
2. Wait for workflows to complete at least once
3. Return to branch protection settings
4. Status checks should now appear in the list

### Issue: Tests Pass Locally But Fail in CI

**Common Causes:**
1. **Environment Differences**: Different Python version or dependencies
2. **Missing Files**: Forgot to commit required files
3. **Timing Issues**: Race conditions in tests
4. **Cache Issues**: Stale cache in CI

**Solutions:**
```bash
# Test with same Python version as CI
conda create -n test-env python=3.11
conda activate test-env
pip install -e ".[dev,test]"
pytest tests/

# Test with clean environment
make clean
pip install -e ".[dev,test]"
pytest tests/

# Check for missing files
git status
git add <missing-files>
```

### Issue: Can't Merge Even Though Checks Pass

**Common Causes:**
1. **Branch Out of Date**: Need to update with latest main
2. **Conversations Not Resolved**: Review comments need addressing
3. **Missing Approvals**: Need code review approval

**Solutions:**
```bash
# Update branch with latest main
git checkout feature/my-feature
git pull origin main
git push origin feature/my-feature

# Or use GitHub UI
# - Click "Update branch" button in PR
```

### Issue: Emergency Fix Needed But Checks Are Failing

**DO NOT** disable branch protection or use force push!

**Better Approach:**
```bash
# 1. Create hotfix branch
git checkout -b hotfix/urgent-fix

# 2. Make minimal fix
# ... fix critical issue only ...

# 3. Run tests locally
make test

# 4. If tests still fail, fix them too
# ... fix tests ...

# 5. Push and create PR
git push origin hotfix/urgent-fix

# 6. Get expedited review
# - Mark PR as urgent
# - Tag relevant reviewers
# - Explain the urgency
```

For true emergencies where main is broken:
1. Create hotfix PR following above process
2. Get approval from team lead
3. Merge as soon as checks pass
4. Post-mortem to prevent future issues

---

## ❓ FAQ

### Q: What if I need to make an urgent hotfix?

**A**: Follow the same process! Branch protection ensures quality, even for hotfixes:
```bash
git checkout -b hotfix/critical-bug
# ... make minimal fix ...
make test  # Verify it works
git push origin hotfix/critical-bug
# Create PR, get expedited review, merge when checks pass
```

### Q: Can I temporarily disable branch protection for emergency?

**A**: **NO!** Branch protection exists to prevent broken code. Instead:
- Create hotfix branch
- Fix the issue AND tests
- Get expedited review
- Merge when checks pass

### Q: What if tests pass locally but fail in CI?

**A**: Common causes:
- Different Python versions (CI tests multiple versions)
- Missing committed files
- Environment differences
- Cache issues

**Solution**: Test with clean environment:
```bash
conda create -n test-env python=3.11
conda activate test-env
pip install -e ".[dev,test]"
pytest tests/
```

### Q: How long do CI checks take?

**A**: ~5-10 minutes total:
- Test Suite (each Python version): 2-5 min
- Documentation Build: 1-2 min
- Frontend Build: 2-3 min
- Security Scan: 1-2 min

Most run in parallel, so total time is ~5-10 min.

### Q: Can I skip CI checks for minor changes?

**A**: **NO!** All code must pass CI checks. "Minor changes" often introduce bugs. The checks run fast enough (~5-10 min) that skipping isn't necessary.

### Q: What if I disagree with a code review comment?

**A**: Discuss with the reviewer:
- Explain your reasoning
- Consider their perspective
- Find a compromise
- Remember: Code review improves quality

---

## 🎯 Best Practices

### For Contributors
1. ✅ **Always work in feature branches** - Never commit directly to main
2. ✅ **Run pre-commit hooks** - Catch issues early
3. ✅ **Test locally before pushing** - Don't rely solely on CI
4. ✅ **Keep PRs small and focused** - Easier to review, faster to merge
5. ✅ **Write tests for new code** - Ensure new code is tested
6. ✅ **Update documentation** - Keep docs in sync with code

### For Reviewers
1. ✅ **Check test coverage** - Ensure new code is tested
2. ✅ **Verify CI passes** - Don't approve if checks fail
3. ✅ **Test locally if unsure** - Pull PR and test functionality
4. ✅ **Check documentation** - Ensure docs are updated
5. ✅ **Be constructive** - Suggest improvements, don't just criticize
6. ✅ **Respond promptly** - Don't let PRs sit idle

### For Maintainers
1. ✅ **Monitor CI performance** - Keep checks fast
2. ✅ **Update dependencies** - Keep tools and libraries current
3. ✅ **Review failed checks** - Investigate patterns in failures
4. ✅ **Enforce standards** - Apply rules consistently
5. ✅ **Update documentation** - Keep guides current
6. ✅ **Support team members** - Help with issues and questions

---

## 🔒 Local Pre-commit Hooks

While branch protection prevents bad code from being merged, pre-commit hooks prevent bad code from being committed locally.

### Setup Pre-commit Hooks

```bash
# Install pre-commit hooks (one-time setup)
make pre-commit-setup

# Run hooks manually
make pre-commit-run

# Test specific categories
make pre-commit-backend        # Python checks only
make pre-commit-frontend       # Frontend checks only
make pre-commit-both          # All checks
```

### Pre-commit Hook Features

Our pre-commit hooks run:
- ✅ **Code Formatting**: Ruff, Black, isort
- ✅ **Linting**: Ruff, ESLint
- ✅ **Type Checking**: MyPy, TypeScript
- ✅ **Security**: Bandit scanning
- ✅ **Tests**: Fast unit tests
- ✅ **Documentation**: Docstring validation

**Pre-commit hooks run in seconds**, catching issues before you even push to GitHub!

---

## 🛠️ Advanced Configuration

### Require Specific Test Categories

If you want to require specific test categories (unit, integration, e2e), update `.github/workflows/ci.yml`:

```yaml
# Add separate jobs for each test category
unit-tests:
  name: Unit Tests
  runs-on: ubuntu-latest
  steps:
    # ... setup steps ...
    - name: Run unit tests
      run: pytest tests/unit/ -v -m unit

integration-tests:
  name: Integration Tests
  runs-on: ubuntu-latest
  steps:
    # ... setup steps ...
    - name: Run integration tests
      run: pytest tests/integration/ -v -m integration
```

Then add these as required status checks in branch protection.

### Require Code Coverage Threshold

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check coverage threshold
  run: |
    coverage report --fail-under=95
```

### Require Performance Benchmarks

Add to `.github/workflows/ci.yml`:

```yaml
performance:
  name: Performance Tests
  runs-on: ubuntu-latest
  steps:
    # ... setup steps ...
    - name: Run performance tests
      run: pytest tests/performance/ -v -m performance

    - name: Check performance regression
      run: |
        python scripts/check_performance_regression.py
```

---

## ✅ Verification Checklist

Before considering branch protection fully configured:

- [ ] Branch protection rule created for `main`
- [ ] Pull request approval required
- [ ] All 8 status checks configured as required
- [ ] Branches must be up to date enabled
- [ ] Conversation resolution required
- [ ] Force pushes disabled
- [ ] Branch deletion disabled
- [ ] Include administrators enabled
- [ ] Test PR created and verified
- [ ] Verification script runs successfully (`make verify-ci`)
- [ ] Team members informed of new process
- [ ] Local pre-commit hooks documented
- [ ] Troubleshooting guide reviewed

---

## 📚 Additional Resources

### GitHub Documentation
- [About Protected Branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Managing Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)

### Project Documentation
- [CI/CD Pipeline Documentation](README.md)
- [Pull Request Template](pull_request_template.md)
- [Development Guide](../DEVELOPMENT.md)
- [Code Quality Standards](../.cursor/rules/code-quality-standards.mdc)
- [CI/CD Release Practices](../.cursor/rules/cicd-release-practices.mdc)

---

**Last Updated**: January 2025
**Maintained By**: Project Maintainers
**Questions**: Open an issue or contact the team
