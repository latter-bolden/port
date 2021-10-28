module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    index: './src/main/index.ts', 
    conpty_console_list_agent: './node_modules/node-pty/lib/conpty_console_list_agent.js',
  },
  // Put your normal webpack config below here
  module: {
    rules: require('../../webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
  },
};