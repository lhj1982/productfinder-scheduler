module.exports = {
  extends: [
      'plugin:@typescript-eslint/recommended',
      'prettier',
      'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
      ecmaVersion: 2019,
      project: './tsconfig.json',
      sourceType: 'module',
  },
  rules: {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "custom": {
          "regex": "^I[A-Z]",
          "match": true
        }
      }
    ],
    "@typescript-eslint/no-floating-promises": ["error"],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  }
};