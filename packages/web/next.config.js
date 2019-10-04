const withTranspileModules = require('next-transpile-modules');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(
  withTranspileModules({
    // To force Next.js to transpile code from other workspace packages.
    // https://github.com/martpie/next-transpile-modules
    transpileModules: [
      'slad',
      // Enable later https://github.com/steida/slad/issues/46
      // 'fp-ts'
    ],
    // We need server for local next export for integration tests.
    // We can detects ZEIT Now runtime via AWS_REGION.
    target: process.env.AWS_REGION ? 'serverless' : 'server',
    // Enforce relative paths for integration tests.
    // https://github.com/zeit/next.js/issues/2581
    assetPrefix: './',
  }),
);
