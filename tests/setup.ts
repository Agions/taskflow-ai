/**
 * Jest测试环境设置文件
 * 配置全局测试环境、模拟对象和测试工具
 */

import 'reflect-metadata';
import { config } from 'dotenv';
import { Logger } from '../src/infra/logger';

// 加载测试环境变量
config({ path: '.env.test' });

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // 测试时减少日志输出

// 全局测试超时
jest.setTimeout(30000);

// 模拟外部依赖
jest.mock('axios');
jest.mock('fs/promises');

// 全局测试工具
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTask(): R;
      toBeValidTaskPlan(): R;
      toHaveValidStructure(): R;
      toMatchTaskSchema(): R;
    }
  }
}

// 自定义匹配器
expect.extend({
  toBeValidTask(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.description === 'string' &&
      Array.isArray(received.dependencies) &&
      received.createdAt instanceof Date;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid task`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid task`,
        pass: false,
      };
    }
  },

  toBeValidTaskPlan(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      Array.isArray(received.tasks) &&
      received.createdAt instanceof Date;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid task plan`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid task plan`,
        pass: false,
      };
    }
  },

  toHaveValidStructure(received) {
    const pass = received && typeof received === 'object' && !Array.isArray(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to have valid structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid structure`,
        pass: false,
      };
    }
  },

  toMatchTaskSchema(received) {
    const requiredFields = ['id', 'title', 'description', 'status', 'priority', 'type'];
    const pass = requiredFields.every(field => field in received);

    if (pass) {
      return {
        message: () => `expected ${received} not to match task schema`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to match task schema`,
        pass: false,
      };
    }
  }
});

// 全局测试数据工厂
export class TestDataFactory {
  static createTask(overrides: any = {}) {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '测试任务',
      description: '这是一个测试任务',
      status: 'not_started',
      priority: 'medium',
      type: 'feature',
      dependencies: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedHours: 8,
      progress: 0,
      ...overrides
    };
  }

  static createTaskPlan(overrides: any = {}) {
    return {
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '测试项目',
      description: '这是一个测试项目',
      tasks: [
        TestDataFactory.createTask({ title: '任务1' }),
        TestDataFactory.createTask({ title: '任务2' }),
        TestDataFactory.createTask({ title: '任务3' })
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createRequirement(overrides: any = {}) {
    return {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '测试需求',
      description: '这是一个测试需求',
      type: 'functional',
      priority: 'medium',
      businessValue: 5,
      complexity: 3,
      tags: [],
      acceptance: ['验收标准1', '验收标准2'],
      ...overrides
    };
  }

  static createUser(overrides: any = {}) {
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '测试用户',
      email: 'test@example.com',
      role: 'developer',
      skills: ['JavaScript', 'TypeScript'],
      ...overrides
    };
  }
}

// 全局模拟对象
export class MockLogger implements Logger {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  setLevel = jest.fn();
  child = jest.fn().mockReturnThis();
}

export class MockConfigManager {
  private config = new Map();

  get = jest.fn((key: string, defaultValue?: any) => {
    return this.config.get(key) || defaultValue;
  });

  set = jest.fn((key: string, value: any) => {
    this.config.set(key, value);
  });

  has = jest.fn((key: string) => {
    return this.config.has(key);
  });

  delete = jest.fn((key: string) => {
    return this.config.delete(key);
  });

  clear = jest.fn(() => {
    this.config.clear();
  });

  getAll = jest.fn(() => {
    return Object.fromEntries(this.config);
  });
}

// 测试工具函数
export function createMockResponse(data: any, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  };
}

export function createMockError(message: string, status = 500) {
  const error = new Error(message) as any;
  error.response = {
    status,
    statusText: 'Internal Server Error',
    data: { error: message }
  };
  return error;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockStream() {
  const events: { [key: string]: Function[] } = {};
  
  return {
    on: jest.fn((event: string, callback: Function) => {
      if (!events[event]) events[event] = [];
      events[event].push(callback);
    }),
    emit: jest.fn((event: string, ...args: any[]) => {
      if (events[event]) {
        events[event].forEach(callback => callback(...args));
      }
    }),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
  };
}

// 异步测试工具
export async function waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
  const start = Date.now();
  
  while (!condition() && Date.now() - start < timeout) {
    await delay(10);
  }
  
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

export async function waitForAsync<T>(
  asyncFn: () => Promise<T>,
  timeout = 5000
): Promise<T> {
  return Promise.race([
    asyncFn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Async operation timed out after ${timeout}ms`)), timeout);
    })
  ]);
}

// 测试环境清理
afterEach(() => {
  jest.clearAllMocks();
});

beforeEach(() => {
  // 重置环境变量
  process.env.NODE_ENV = 'test';
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 导出测试工具
export {
  MockLogger,
  MockConfigManager,
  TestDataFactory
};
