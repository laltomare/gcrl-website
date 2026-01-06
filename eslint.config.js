import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Easy to see - show errors as red squiggles
      '@typescript-eslint/no-unused-vars': 'warn', // Yellow squiggle for unused variables
      '@typescript-eslint/no-explicit-any': 'warn', // Yellow squiggle for 'any' types
      'no-console': 'off', // Allow console.log (useful for debugging)
      'no-undef': 'off', // Turn off - TypeScript handles this better
      
      // Help catch bugs
      'no-duplicate-imports': 'error', // Red squiggle for duplicate imports
      
      // Code quality (warnings, not blocking)
      'prefer-const': 'warn', // Suggest using const
      'no-var': 'warn', // Suggest avoiding var
    },
  },
  {
    ignores: [
      'dist/**',
      'build/**',
      '.wrangler/**',
      'node_modules/**',
      '*.js',
      '*.mjs',
    ],
  },
];
