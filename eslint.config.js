import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'examples/**', '.taste-skill/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser, globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      // TypeScript owns name resolution; its type-only names are not JS globals.
      'no-undef': 'off',
      // Existing project intentionally permits unused values in tsconfig.app.json.
      'no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
];
