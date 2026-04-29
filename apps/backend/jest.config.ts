import type { Config } from 'jest';

const testType = process.env.TEST_TYPE || 'unit';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch:
    testType === 'e2e'
      ? ['<rootDir>/test/**/*.e2e-spec.ts']
      : ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
