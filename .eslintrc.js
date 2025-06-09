module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
      },
    ],

    eqeqeq: ['error', 'smart'],
    'no-eval': 'error',
    'no-implied-eval': 'error',

    indent: ['error', 2, { SwitchCase: 1 }],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'max-len': [
      'warn',
      {
        code: 100,
        ignoreComments: true,
        ignoreTrailingComments: true,
      },
    ],

    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
