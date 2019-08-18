const ts_preset = require('ts-jest/jest-preset');

module.exports = {
  projects: [
    {
      displayName: 'slad',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/slad/**/*.test.ts'],
    },
    {
      displayName: 'web',
      ...ts_preset,
      preset: 'jest-puppeteer',
      testMatch: ['<rootDir>/packages/web/tests/integration/**/*.test.ts'],
    },
  ],
};
