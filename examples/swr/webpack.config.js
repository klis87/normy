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
    extensions: ['.js', '.jsx'],
    alias: {
      '@normy/core': path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'normy',
        'es',
      ),
      swr: path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'normy-swr',
        'node_modules',
        'swr',
      ),
      '@normy/swr': path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'normy-swr',
        'es',
      ),
      react: path.join(
        __dirname,
        '..',
        '..',
        'packages',
        'normy-swr',
        'node_modules',
        'react',
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
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
