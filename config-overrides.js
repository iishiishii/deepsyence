const webpack = require("webpack");

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: false, // require.resolve("crypto-browserify") can be polyfilled here if needed
    stream: require.resolve("stream"), // require.resolve("stream-browserify") can be polyfilled here if needed
    assert: require.resolve("assert"), // require.resolve("assert") can be polyfilled here if needed
    http: require.resolve("http"), // require.resolve("stream-http") can be polyfilled here if needed
    https: require.resolve("https"), // require.resolve("https-browserify") can be polyfilled here if needed
    os: false, // require.resolve("os-browserify") can be polyfilled here if needed
    url: false, // require.resolve("url") can be polyfilled here if needed
    fs: require.resolve("browserify-fs"), // require.resolve("browserify-fs") can be polyfilled here if needed
    zlib: require.resolve("browserify-zlib"), // require.resolve("browserify-zlib") can be polyfilled here if needed
    querystring: require.resolve("querystring-es3"),
    path: require.resolve("path-browserify"),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);
  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: "pre",
    loader: require.resolve("source-map-loader"),
    resolve: {
      fullySpecified: false,
    },
  });
  return config;
};
