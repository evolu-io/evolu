const ts_preset = require('ts-jest/jest-preset');

const projects = [
  {
    displayName: 'slad',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/packages/slad/**/*.test.ts'],
  },
];

// TODO: Figure out how to run tests in CircleCI.
if (process.env.CIRCLE_BRANCH === undefined) {
  projects.push({
    displayName: 'web',
    ...ts_preset,
    preset: 'jest-puppeteer',
    testMatch: ['<rootDir>/packages/web/**/*.test.ts'],
  });
}

module.exports = {
  projects: projects,
};
