// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true },
      ],
      // NestJS modules are decorated empty classes by design.
      '@typescript-eslint/no-extraneous-class': [
        'error',
        { allowWithDecorator: true },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // `expect(mock.method).toHaveBeenCalled()` references methods unbound by design.
    files: ['**/*.spec.ts', '**/testing/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
