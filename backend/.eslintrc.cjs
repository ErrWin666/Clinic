/* eslint-env node */
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "commonjs",
  },
  rules: {
    "max-lines": [
      "warn",
      { max: 300, skipBlankLines: true, skipComments: true },
    ],
    "max-lines-per-function": [
      "warn",
      { max: 50, skipBlankLines: true, skipComments: true },
    ],
    complexity: ["warn", 10],
    "max-params": ["warn", 4],
    "max-depth": ["warn", 3],
    "max-statements": ["warn", 15],
    "max-nested-callbacks": ["warn", 3],
  },
  ignorePatterns: ["node_modules/", "data/", "uploads/", "test-uploads-*/"],
};
