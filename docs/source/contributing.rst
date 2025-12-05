Contributing Guide
==================

Thank you for your interest in contributing to Streamlit Lightweight Charts Pro!

Development Setup
-----------------

1. **Clone the repository**:

.. code-block:: bash

   git clone https://github.com/nandkapadia/streamlit-lightweight-charts-pro.git
   cd streamlit-lightweight-charts-pro

2. **Install Python dependencies**:

.. code-block:: bash

   pip install -e ".[dev,test]"

3. **Install frontend dependencies**:

.. code-block:: bash

   cd streamlit_lightweight_charts_pro/frontend
   npm install

4. **Install pre-commit hooks**:

.. code-block:: bash

   pip install pre-commit
   pre-commit install

Code Standards
--------------

Python
~~~~~~

* **Style**: Google-style docstrings
* **Line length**: ≤99 characters
* **Formatters**: isort, autoflake, black, ruff
* **Type hints**: Required for all public APIs
* **Docstrings**: Required for all modules, classes, functions

.. code-block:: python

   def example_function(param: str, value: int) -> bool:
       """Short one-line summary.

       Longer description if needed. Explain the purpose, behavior,
       and any important details.

       Args:
           param: Description of param.
           value: Description of value.

       Returns:
           Description of return value.

       Raises:
           ValueError: When value is negative.

       Example:
           ```python
           result = example_function("test", 42)
           ```
       """
       if value < 0:
           raise ValueError("Value must be non-negative")
       return True

TypeScript
~~~~~~~~~~

* **Style**: Google-style JSDoc/TSDoc
* **Line length**: ≤100 characters
* **Formatters**: prettier, eslint
* **Type annotations**: Required for all exports
* **JSDoc**: Required for all exported functions/classes

.. code-block:: typescript

   /**
    * Example function with comprehensive documentation.
    *
    * @param param - Description of param
    * @param value - Description of value
    * @returns Description of return value
    * @throws {Error} When value is negative
    *
    * @example
    * ```typescript
    * const result = exampleFunction("test", 42);
    * ```
    */
   export function exampleFunction(param: string, value: number): boolean {
       if (value < 0) {
           throw new Error("Value must be non-negative");
       }
       return true;
   }

Testing
-------

Python Tests
~~~~~~~~~~~~

Run Python tests with pytest:

.. code-block:: bash

   # Run all tests
   pytest

   # Run with coverage
   pytest --cov=streamlit_lightweight_charts_pro

   # Run specific test file
   pytest tests/test_chart.py

   # Run with markers
   pytest -m unit
   pytest -m integration

TypeScript Tests
~~~~~~~~~~~~~~~~

Run TypeScript tests with Vitest:

.. code-block:: bash

   cd streamlit_lightweight_charts_pro/frontend

   # Run all tests
   npm test

   # Run with coverage
   npm run test:coverage

   # Run specific test
   npm test -- colorUtils.test.ts

Pre-commit Hooks
----------------

Pre-commit hooks automatically run on every commit to ensure code quality.

**Install**:

.. code-block:: bash

   pip install pre-commit
   pre-commit install

**Run manually**:

.. code-block:: bash

   # Run on all files
   pre-commit run --all-files

   # Run specific hook
   pre-commit run black --all-files

**Hooks include**:

* Python: isort, autoflake, black, ruff, pydocstyle
* TypeScript: prettier, eslint, tsc, JSDoc validator
* General: trailing whitespace, large files, merge conflicts

Pull Request Process
--------------------

1. **Create a branch**:

.. code-block:: bash

   git checkout -b feature/your-feature-name

2. **Make changes** following code standards

3. **Write tests** for new functionality

4. **Run formatters and linters**:

.. code-block:: bash

   # Python
   isort .
   autoflake --in-place --remove-unused-variables --remove-all-unused-imports -r .
   black .
   ruff check --fix .

   # TypeScript
   cd streamlit_lightweight_charts_pro/frontend
   npm run lint
   npm run format

5. **Run tests**:

.. code-block:: bash

   pytest
   cd streamlit_lightweight_charts_pro/frontend && npm test

6. **Commit changes**:

.. code-block:: bash

   git add .
   git commit -m "feat: add new feature"

7. **Push and create PR**:

.. code-block:: bash

   git push origin feature/your-feature-name

Commit Message Convention
--------------------------

Use conventional commits:

* ``feat:``: New feature
* ``fix:``: Bug fix
* ``docs:``: Documentation changes
* ``style:``: Code style changes (formatting)
* ``refactor:``: Code refactoring
* ``test:``: Test additions or changes
* ``chore:``: Build process or tooling changes

Examples:

.. code-block:: text

   feat: add support for histogram series
   fix: resolve color validation bug
   docs: update API reference for renderChart
   test: add tests for color utilities

Code Review
-----------

All submissions require review. We review for:

* **Functionality**: Does it work as intended?
* **Tests**: Are there adequate tests?
* **Documentation**: Is it well-documented?
* **Code quality**: Does it follow our standards?
* **Performance**: Are there performance implications?

Reporting Bugs
--------------

Report bugs via `GitHub Issues <https://github.com/nandkapadia/streamlit-lightweight-charts-pro/issues>`_.

Include:

* **Description**: Clear description of the bug
* **Reproduction**: Minimal code to reproduce
* **Expected behavior**: What should happen
* **Actual behavior**: What actually happens
* **Environment**: Python version, OS, package version

Feature Requests
----------------

Feature requests are welcome! Open an issue with:

* **Use case**: Why is this feature needed?
* **Proposed solution**: How should it work?
* **Alternatives**: Other approaches considered
* **Examples**: Example usage code

Questions?
----------

* Open a `GitHub Discussion <https://github.com/nandkapadia/streamlit-lightweight-charts-pro/discussions>`_
* Review existing documentation
* Check closed issues for similar questions
