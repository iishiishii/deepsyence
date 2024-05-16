const CracoWorkboxPlugin = require("craco-workbox");
const webpack = require("webpack");

module.exports = {
  plugins: [
    {
      plugin: [CracoWorkboxPlugin],
    },
  ],
  webpack: {
    configure: (config) => {
      if (!config?.module?.rules) {
        throw new Error("config definitely has config.module.rules");
      }
      if (!config?.plugins) {
        throw new Error("config definitely has config.plugins");
      }

      config.ignoreWarnings = [/Failed to parse source map/];

      config.resolve = {
        ...config.resolve,
        fallback: {
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
        },
      };

      config.plugins.unshift(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        })
      );

      config.module.rules.unshift({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // disable the behavior
        },
      });

      return config;
    },
  },
};
