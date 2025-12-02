import js from '@eslint/js';
import typescript from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '**/*.d.ts',
      'vite.config.ts',
      'vitest.config.ts',
      'eslint.config.js',
      'fix-html.js',
      '**/*.bak',
      '**/*.bak*',
      '**/*.broken',
      '**/*.broken*',
      '**/*.backup',
      '**/*.backup*',
      '**/*.temp',
      '**/*.tmp',
      '**/.DS_Store',
      '**/*.old',
      '**/*.orig'
    ]
  },

  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration for all files
  ...typescript.configs.recommended,

  // TypeScript configuration with type-aware rules (selective)
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    languageOptions: {
      parser: typescript.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enable only critical type-aware rules to start
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'off', // Too many false positives, disable for now
    },
  },

  // React and general rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescript.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Testing globals (Vitest)
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // General rules
      'no-console': 'off', // Allow console statements in development
      'no-debugger': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-unused-vars': 'off', // Turned off in favor of TypeScript rule

      // TypeScript rules (basic) - Gradual improvement approach
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_|^e$|^error$',
        varsIgnorePattern: '^_|^error$|^e$',
        ignoreRestSiblings: true,
        destructuredArrayIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'off', // Too many instances, disable for now
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',

      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/display-name': 'off', // Allow anonymous components
      'react/no-unescaped-entities': 'warn',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Test files configuration
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'react/display-name': 'off',
    },
  },
];
