module.exports = {
  output: {
    library: 'NormyVueQuery',
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
    '@normy/query-core': {
      commonjs: '@normy/query-core',
      commonjs2: '@normy/query-core',
      amd: '@normy/query-core',
      root: 'NormyQueryCore',
    },
    '@tanstack/vue-query': {
      commonjs: '@tanstack/vue-query',
      commonjs2: '@tanstack/vue-query',
      amd: '@tanstack/vue-query',
      root: 'VueQuery',
    },
  },
  devtool: 'source-map',
};
