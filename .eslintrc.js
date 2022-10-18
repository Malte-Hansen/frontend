module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    // 'ember',
    'prettier',
    '@typescript-eslint',
    'import',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/typescript',
    'plugin:qunit/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
    node: true,
  },
  globals: {
    auth0: false,
  },
  rules: {
    'prettier/prettier': 'error',
    'linebreak-style': 'off',
    'class-methods-use-this': 'off',
    'import/no-unresolved': 'off',
    'require-yield': 'off',
    'no-plusplus': 'off',
    'import/no-cycle': 'off',
    'prefer-rest-params': 'off',
    'ember/no-mixins': 'off',
    'ember/require-computed-property-dependencies': 'off',
    '@typescript-eslint/type-annotation-spacing': ['error'],
    'no-param-reassign': ['error', { props: false }],
    'func-names': ['error', 'always', { generators: 'never' }],
  },
  overrides: [
    // node files
    {
      files: [
        'ember-cli-build.js',
        'testem.js',
        'config/**/*.js',
        'lib/*/index.js',
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015,
      },
      env: {
        browser: false,
        node: true,
      },
    },
  ],
};
