module.exports = {
  // https://github.com/smooth-code/jest-puppeteer#configure-eslint
  env: {
    jest: true,
  },
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true,
    document: true,
  },
};
