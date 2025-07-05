// Jest配置 - 简化CI环境配置
// 作为资深全栈工程师，确保CI环境下的测试稳定性

module.exports = {
  // 基础配置
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 根目录
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts'
  ],
  
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
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 转换配置
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // 文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // CI环境优化
  maxWorkers: 2,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  cache: false,
  
  // 覆盖率配置
  collectCoverage: false,
  
  // 静默模式
  silent: true,
  verbose: false,
  
  // 错误处理
  errorOnDeprecated: false,
  
  // 设置文件
  setupFilesAfterEnv: [],
  
  // 全局配置
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
