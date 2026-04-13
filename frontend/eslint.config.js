const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
    rules: {
      // After moving the Expo app into `frontend/`, this rule can hit
      // Windows path permission issues while walking parent directories.
      'import/no-unresolved': 'off',
    },
  },
]);
