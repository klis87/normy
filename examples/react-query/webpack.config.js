const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  context: __dirname,
  entry: './src',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx', 'mjs'],

    alias: {
      '@tanstack/react-query':
        '/home/klis87/projects/normalizer/examples/react-query/src/@tanstack/react-query/build/umd/index.production.js',
      '@tanstack/query-core':
        '/home/klis87/projects/normalizer/examples/react-query/src/@tanstack/query-core/build/umd/index.production.js',
      '@normy/core': path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'normy',
        'es',
      ),
      '@normy/react-query': path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'normy-react-query',
        'es',
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        // exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.mjs?$/,
        loader: 'babel-loader',
      },
    ],
  },
  devtool: 'eval-source-map',
  devServer: {
    port: 3000,
    inline: true,
    hot: true,
    overlay: true,
  },
  mode: 'development',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: path.join(__dirname, 'dist', 'index.html'),
      template: path.join(__dirname, 'src', 'index.html'),
    }),
  ],
};
