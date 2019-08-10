const withTranspileModules = require('next-transpile-modules');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(
  withTranspileModules({
    // To force Next.js to transpile code from other workspace packages.
    // https://github.com/martpie/next-transpile-modules
    transpileModules: ['slad'],
    target: 'serverless',
  }),
);
