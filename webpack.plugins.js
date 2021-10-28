const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new MiniCssExtractPlugin({
    filename: '[name].bundle.css',
    chunkFilename: '[id].css'
  }),
  // new CopyPlugin({
  //   patterns: [
  //     { 
  //       from: path.resolve(__dirname, 'node_modules', 'node-pty', 'lib', 'conpty_console_list_agent.js'), 
  //       to: path.resolve(__dirname, '.webpack', 'main') 
  //     }
  //   ]
  // })
];
