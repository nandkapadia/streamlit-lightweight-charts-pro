# GitHub Workflows and Templates

This directory contains GitHub Actions workflows, templates, and configuration files for the Streamlit Lightweight Charts Pro project.

## 📁 Files

### Workflows
- **`workflows/ci.yml`** - Comprehensive CI/CD pipeline with testing, linting, security, and deployment
- **`workflows/ci-simple.yml`** - Simplified CI pipeline for basic checks

### Templates
- **`pull_request_template.md`** - Template for pull requests with checklists and guidelines

## 🚀 CI/CD Pipeline Features

### **Comprehensive Pipeline (`ci.yml`)**
- ✅ **Multi-Python Testing** - Tests on Python 3.8-3.12
- ✅ **Code Quality** - Ruff linting, MyPy type checking, Bandit security
- ✅ **Documentation** - MkDocs build and link validation
- ✅ **Frontend** - Node.js build, linting, and testing
- ✅ **Security** - Trivy vulnerability scanning
- ✅ **Packaging** - Python package build and validation
- ✅ **Deployment** - Automatic GitHub Pages deployment

### **Simple Pipeline (`ci-simple.yml`)**
- ✅ **Basic Testing** - Python 3.11, pytest
- ✅ **Code Quality** - Ruff linting and formatting
- ✅ **Documentation** - MkDocs build verification

## 🔧 Setup Instructions

### 1. Enable Branch Protection
1. Go to repository **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators

### 2. Configure Required Status Checks
In branch protection settings, require these status checks:
- `Test Suite (3.11)` - Main test job
- `Documentation Build` - Docs build verification
- `Frontend Build` - Frontend build (if applicable)

### 3. Enable GitHub Pages
1. Go to repository **Settings** → **Pages**
2. Set source to **"GitHub Actions"**
3. The workflow will automatically deploy docs on main branch pushes

### 4. Install Pre-commit Hooks (Optional)
```bash
# Install pre-commit hooks for local development
pip install pre-commit
pre-commit install
```

## 📊 Workflow Status

The CI pipeline runs on:
- **Push to main/develop** - Full pipeline with deployment
- **Pull requests** - Testing and validation only

## 🛠️ Customization

### Adding New Checks
1. Edit `.github/workflows/ci.yml`
2. Add new steps to existing jobs or create new jobs
3. Update branch protection to require new status checks

### Modifying Tests
- **Python tests**: Edit `tests/` directory
- **Frontend tests**: Edit `streamlit_lightweight_charts_pro/frontend/`
- **Documentation**: Edit `docs-src/` directory

### Security Scanning
- **Bandit**: Python security issues
- **Trivy**: Container and filesystem vulnerabilities
- **Safety**: Known security vulnerabilities in dependencies

## 📈 Monitoring

- **Test Results**: Check Actions tab for detailed logs
- **Coverage**: Codecov integration for test coverage
- **Security**: GitHub Security tab for vulnerability reports
- **Documentation**: Automatically deployed to GitHub Pages

## 🔍 Troubleshooting

### Common Issues
1. **Tests failing**: Check Python version compatibility
2. **Linting errors**: Run `ruff check .` locally
3. **Documentation build**: Verify MkDocs configuration
4. **Frontend build**: Check Node.js version and dependencies

### Local Testing
```bash
# Run the same checks locally
pytest tests/
ruff check .
mypy streamlit_lightweight_charts_pro/
mkdocs build
```

---

**Last Updated**: $(date)
**Maintained by**: Streamlit Lightweight Charts Pro Contributors
