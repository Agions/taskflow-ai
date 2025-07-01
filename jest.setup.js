// 这个文件在每个测试文件执行前运行

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 设置测试超时时间
jest.setTimeout(10000);

// 模拟控制台输出，避免测试时产生太多日志
global.console = {
  ...console,
  // 不完全禁用日志，但可以在必要时取消注释以减少噪音
  // log: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
  // warn: console.warn,
  // error: console.error,
};

// 清理所有模拟
afterEach(() => {
  jest.clearAllMocks();
}); 