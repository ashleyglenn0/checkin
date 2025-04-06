module.exports = {
  root: true,
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "script"
  },
  extends: [
    "eslint:recommended",
    "google"
  ],
  rules: {
    "no-undef": "off",
    "no-unused-vars": "warn",
    "quotes": ["error", "double", { allowTemplateLiterals: true }],
    "require-jsdoc": "off"
  }
};




