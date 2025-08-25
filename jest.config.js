module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src-new', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src-new/**/*.ts',
    '!src-new/**/*.d.ts',
    '!src-new/**/__tests__/**',
    '!src-new/**/*.spec.ts',
    '!src-new/**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 4,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  
  // 模块路径映射
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src-new/core/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src-new/infrastructure/$1',
    '^@integrations/(.*)$': '<rootDir>/src-new/integrations/$1',
    '^@interfaces/(.*)$': '<rootDir>/src-new/interfaces/$1',
  },
  
  // 全局设置
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};