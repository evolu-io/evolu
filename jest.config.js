const ts_preset = require('ts-jest/jest-preset');

module.exports = {
  projects: [
    {
      displayName: 'evolu',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/evolu/**/*.test.ts'],
    },
    {
      displayName: 'web',
      ...ts_preset,
      preset: 'jest-puppeteer',
      testMatch: ['<rootDir>/packages/web/tests/integration/**/*.test.ts'],
    },
  ],
};
