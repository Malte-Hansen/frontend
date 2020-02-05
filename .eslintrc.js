module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module'
  },
  plugins: [
    'ember',
    '@typescript-eslint'
  ],
  extends: [
    'airbnb-typescript/base',
    'plugin:ember/recommended',
  ],
  env: {
    browser: true
  },
  rules: {
    'linebreak-style': 'off',
    'import/no-unresolved': 'off',
    'require-yield': 'off',
    'no-plusplus': 'off',
    'import/no-cycle': 'off',
    'prefer-rest-params': 'off',
    "comma-spacing": "off",
    "@typescript-eslint/comma-spacing": ["error"],
    "@typescript-eslint/type-annotation-spacing": ["error"],
  },
  overrides: [
    // node files
    {
      files: [
        'ember-cli-build.js',
        'testem.js',
        'config/**/*.js',
        'lib/*/index.js'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2015
      },
      env: {
        browser: false,
        node: true
      }
    }
  ]
};
