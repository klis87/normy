module.exports = {
  output: {
    library: 'NormyReactQuery',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  externals: {
    '@normy/core': {
      commonjs: '@normy/core',
      commonjs2: '@normy/core',
      amd: '@normy/core',
      root: 'Normy',
    },
    '@tanstack/react-query': {
      commonjs: '@tanstack/react-query',
      commonjs2: '@tanstack/react-query',
      amd: '@tanstack/react-query',
      root: 'ReactQuery',
    },
  },
  devtool: 'source-map',
};
