module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // React specific rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
};