const CracoWorkboxPlugin = require("craco-workbox");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const BabelTransformRuntime = require("@babel/plugin-transform-runtime");

module.exports = {
  plugins: [
    {
      plugin: [CracoWorkboxPlugin, BabelTransformRuntime],
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
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: "node_modules/opencv-web/opencv_js.wasm",
              to: "static/js",
            },
          ],
        })
      );

      config.plugins.unshift(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        })
      );

      config.module.rules.push({
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        enforce: "pre",
        loader: require.resolve("source-map-loader"),
        resolve: {
          fullySpecified: false,
        },
      });

      config.module.rules.push({
        test: /opencv_js\.wasm$/,
        loader: "file-loader",
        options: {
          publicPath: "build/static/js",
        },
      });

      // overwrite react-scripts default svg loader to allow inlining of svgs,
      // could break after react-scripts update
      const oneOfRuleIndex = config.module.rules.findIndex(
        (rule) => !!rule.oneOf
      );
      if (oneOfRuleIndex > -1) {
        const svgRuleIndex = config.module.rules[
          oneOfRuleIndex
        ].oneOf.findIndex((oneOf) => oneOf.test.source === /\.svg$/.source);
        if (svgRuleIndex > -1) {
          config.module.rules[oneOfRuleIndex].oneOf[svgRuleIndex] = {
            test: /\.svg$/,
            type: "asset/inline",
          };
        }
      }

      return config;
    },
  },
};
