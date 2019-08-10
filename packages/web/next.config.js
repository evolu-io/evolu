const withTranspileModules = require('next-transpile-modules');
const withBundleAnalyzer = require('@zeit/next-bundle-analyzer');

module.exports = withBundleAnalyzer(
  withTranspileModules({
    // To force Next.js to transpile code from other workspace packages.
    // https://github.com/martpie/next-transpile-modules
    transpileModules: ['slad'],
    target: 'serverless',
    analyzeServer: ['server', 'both'].includes(process.env.BUNDLE_ANALYZE),
    analyzeBrowser: ['browser', 'both'].includes(process.env.BUNDLE_ANALYZE),
    bundleAnalyzerConfig: {
      server: {
        analyzerMode: 'static',
        reportFilename: '../bundles/server.html',
      },
      browser: {
        analyzerMode: 'static',
        reportFilename: '../bundles/client.html',
      },
    },
  }),
);
