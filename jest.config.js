module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/(?:.+?)/lib/',
  ],
};
