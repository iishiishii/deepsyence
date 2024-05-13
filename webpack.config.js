const path = require('path');
const cwd = process.cwd();
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');


function srcPaths(src) {
  return path.join(__dirname, src);
}

const isEnvProduction = process.env.NODE_ENV === 'production';
const isEnvDevelopment = process.env.NODE_ENV === 'development';

const preloadPrefix = 'dist';
const preloadFiles = 'preload.js';
const entries = {};

preload = `${preloadPrefix}/${preloadFiles}`;
entries[preload] = path.resolve(__dirname, `./${preload}`);


var preload_config = {
  mode: isEnvProduction ? 'production' : 'development',
  target: 'electron-preload',
  entry: path.resolve(__dirname, `${preloadPrefix}/${preloadFiles}`),
  output: {
    path: __dirname + '/dist',
    filename: 'preload.js'
  },
  optimization: {
    minimize: false
  }
}

  // main process
var main_config = {
    mode: isEnvProduction ? 'production' : 'development',
    entry: './src/main/main.ts',
    target: 'electron-main',
    resolve: {
      extensions: ['.ts', '.jsx', '.js'],
    },
    // https://github.com/slackapi/node-slack-sdk/issues/746#issuecomment-778804407
    externals: [
      {
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
      },
      //{
        //'sqlite3': sqlite3,
      //},
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        },
        {
          // css files
          test: /\.(sass|less|css)$/i,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'less-loader',
            },
          ],
        },

        {
          test: /\.s?css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.(png|jpe?g|svg|gif)$/i,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[path]/[name].[ext]",
              },
            },
          ],
        },
        {
          test: /\.geojson$/,
           use: [
             {
               loader: "json-loader",
             }
          ],
        }
      ]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'main.js'
    },
    node: {
      __dirname: false,
      __filename: false
    },
    experiments: {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      topLevelAwait: true
    }
};

  // renderer process
var renderer_config =  {
    mode: isEnvProduction ? 'production' : 'development',
    entry: {
      // https://stackoverflow.com/questions/53477466/react-referenceerror-regeneratorruntime-is-not-defined
      app: ['./src/app/index.tsx', 'react-app-polyfill/stable'],
      style: './src/app/styles/index.css'
    },
    //target: 'electron-renderer',
    //target: 'web',
    target: ['web', 'es5'],
    //node: {global: true, fs: 'empty'},
    resolve: {
      extensions: ['.jsx', '.js', '.tsx', '.ts'],
      //alias: {
        // Custom Aliases
        //...aliases,
      //},
    },
    output: {
      path: __dirname + '/dist/',
      	//filename: 'renderer.js'
      filename: '[name].js',
    },
    // https://github.com/slackapi/node-slack-sdk/issues/746#issuecomment-778804407
    externals: [
      {
        'utf-8-validate': 'commonjs utf-8-validate',
        bufferutil: 'commonjs bufferutil',
        //ort: 'ort',
      },
    ],
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          // css files
          test: /\.css$/i,
          use: [
            {
              loader: 'style-loader'
            },
            {
              loader: 'css-loader'
            },
          ],
        },
        {
          // Font files
          test: /\.(woff|woff2|ttf|otf)$/,
          loader: 'file-loader',
          options: {
            name: '[hash].[ext]',
            outputPath: 'dist/assets/css/'
          }
        },
      ],
    },
    node: {
      __dirname: false,
      __filename: false
    },
    experiments: {
      asyncWebAssembly: true,
      syncWebAssembly: true,
      topLevelAwait: true
    },
        // filename: This is the cornerstone parameter, which distingues different html templates
        // Because for each template, html-webpack-plugin produces, if not otherwise specified in filename,
        // an index.html file.
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './src/app/index.html',
        inject:'body',
        chunks: ['app'],
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
        linkType: 'text/css',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "./src/assets/css"),
            to: path.resolve(__dirname, "./dist/assets/css")
          },
          {
            from: path.resolve(__dirname, "./node_modules/onnxruntime-web/dist"),
            to: path.resolve(__dirname, "./dist/assets/onnxruntime-web")
          },
          {
            from: path.resolve(__dirname, "./src/assets/model"),
            to: path.resolve(__dirname, "./dist/assets/model")
          },
        ],
        options: {
          concurrency: 100,
        },
      }),
    ]
}

module.exports = [
  preload_config,
  main_config,
  renderer_config,
];
