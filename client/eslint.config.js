// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier, // turn off ESLint rules that conflict with Prettier
  { ignores: ["dist/*", ".expo/*", "node_modules/*"] },
]);
