module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'jest', 'react-hooks'],
  extends: [
    'airbnb',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
  ],
  // https://github.com/smooth-code/jest-puppeteer#configure-eslint
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true,
  },
  rules: {
    // No need, we have Prettier.
    'no-plusplus': 'off',
    // Unnecessary with TypeScript.
    'consistent-return': 'off',
    'react/jsx-props-no-spreading': 'off',
    // Immer uses it.
    'no-param-reassign': 'off',
    // Type inference works good enough so we don't have to always type returns.
    '@typescript-eslint/explicit-function-return-type': 'off',
    // Unnecessary.
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    // Default export is DX anti-pattern.
    'import/prefer-default-export': 'off',
    // We have TypeScript.
    'react/prop-types': 'off',
    // Fix for TypeScript.
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    // Enforce react-hooks rules.
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    // Shadowing has deterministic behavior.
    'no-shadow': 'off',
    // We want serial operations.
    'no-await-in-loop': 'off',
    // Just annoying or bullshit.
    'react/destructuring-assignment': 'off',
    'no-lonely-if': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'max-classes-per-file': 'off',
    'no-else-return': 'off',
    'no-nested-ternary': 'off',
  },
};
