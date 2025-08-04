/* eslint-disable @typescript-eslint/no-require-imports */
/* global module require */
const etchConfig = require('@etchteam/eslint-config').default;
const storybookPlugin = require('eslint-plugin-storybook');

module.exports = [
  ...etchConfig,
  ...storybookPlugin.configs['flat/recommended'],
  {
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  {
    files: ['src/preset.js'],
    languageOptions: {
      sourceType: 'script', // CommonJS
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
      },
    },
  },
  {
    // Skip linting MDX/YML files as they require special handling
    ignores: ['**/*.mdx', '**/*.yml'],
  },
];
