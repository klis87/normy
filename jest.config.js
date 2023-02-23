/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/(?:.+?)/lib/',
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{js,jsx,ts}',
    '!**/node_modules/**',
  ],
};
