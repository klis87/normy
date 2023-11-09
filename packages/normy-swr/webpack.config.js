module.exports = {
  output: {
    library: 'NormySwr',
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
    swr: {
      commonjs: 'swr',
      commonjs2: 'swr',
      amd: 'swr',
      root: 'Swr',
    },
  },
  devtool: 'source-map',
};
