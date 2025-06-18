module.exports = {
  output: {
    library: 'NormyQueryCore',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  externals: {
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React',
    },
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
