// Jest配置 - CI环境专用
// 作为资深全栈工程师，优化CI环境下的测试稳定性

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  
  // CI环境优化配置
  maxWorkers: 2,
  
  // 超时设置
  testTimeout: 30000,
  
  // 强制退出
  forceExit: true,
  
  // 检测打开的句柄
  detectOpenHandles: true,
  
  // 静默模式，减少输出
  silent: false,
  verbose: true,
  
  // 缓存配置
  cache: false,
  
  // 覆盖率配置
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'json-summary'],
  
  // 测试环境
  testEnvironment: 'node',
  
  // 忽略模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.vitepress/',
    '/docs/'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 转换配置
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },

  // 错误处理
  errorOnDeprecated: false,

  // 并发控制
  maxConcurrency: 2,
  
  // 报告器配置
  reporters: [
    'default'
  ]
};
