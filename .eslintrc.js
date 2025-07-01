module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-console': 'off',
    'no-unused-vars': 'off', // 使用 @typescript-eslint/no-unused-vars 替代
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.js', '*.d.ts'],
}; 