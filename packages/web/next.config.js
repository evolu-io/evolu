const withTranspileModules = require('next-transpile-modules');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(
  withTranspileModules({
    // To force Next.js to transpile code from other workspace packages.
    // https://github.com/martpie/next-transpile-modules
    transpileModules: ['slad'],
    // IS_NOW is set in now.json. We need server for local next export.
    target: process.env.IS_NOW ? 'serverless' : 'server',
    // Enforce relative paths for integration tests.
    // https://github.com/zeit/next.js/issues/2581
    assetPrefix: './',
  }),
);
