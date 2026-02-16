/* eslint-disable @typescript-eslint/no-require-imports */
/* global module require */
const etchConfig = require('@etchteam/eslint-config').default;

module.exports = [
  ...etchConfig,
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
    // Skip linting MDX/YML files as they require special handling
    ignores: ['**/*.mdx', '**/*.yml'],
  },
];
