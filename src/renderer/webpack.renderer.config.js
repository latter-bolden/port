const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const rules = require('../../webpack.rules');
const plugins = require('../../webpack.plugins');
const FixNedb = require('../../webpack.fixnedbpath');


rules.push({
  test: /\.css$/i,
  exclude: /node_modules/,
  use: [
    {
      loader: MiniCssExtractPlugin.loader,
    },
    {
      loader: 'css-loader',
      options: {importLoaders: 1},
    },
    {
      loader: 'postcss-loader',
    },
  ],
});

module.exports = {
  module: {
    rules,
  },
  plugins,
  output: {
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    plugins: [new FixNedb()]
  },
  stats: 'verbose',
  devServer: {
    stats: 'verbose'
  }
};
