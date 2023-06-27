// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// This script bundles the imports in preload.ts files
// since import is not allowed during runtime

const path = require('path');

const preloadPrefix = 'build';
const preloadFiles = [
  'main/preload/preload.js',
];
const entries = {};
for (let preload of preloadFiles) {
  preload = `${preloadPrefix}/${preload}`;
  entries[preload] = path.resolve(__dirname, `./${preload}`);
}

module.exports = {
  target: 'electron-preload',
  entry: entries,
  mode: 'production',
  output: {
    path: path.resolve(__dirname),
    filename: '[name]'
  },
  optimization: {
    minimize: false
  }
};
