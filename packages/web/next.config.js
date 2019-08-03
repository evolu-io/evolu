const withTranspileModules = require('next-transpile-modules');

module.exports = withTranspileModules({
  // To force Next.js to transpile code from other workspace packages.
  // https://github.com/martpie/next-transpile-modules
  transpileModules: ['slad'],
});
