module.exports = {
  output: {
    library: 'NormyRtkQuery',
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
    '@reduxjs/toolkit': {
      commonjs: '@reduxjs/toolkit',
      commonjs2: '@reduxjs/toolkit',
      amd: '@reduxjs/toolkit',
    },
  },
  devtool: 'source-map',
};
