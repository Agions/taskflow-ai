/**
 * Jest 测试环境设置
 * 提供全局测试工具函数和环境配置
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// 类型声明
declare global {
  var testUtils: {
    sleep: (ms: number) => Promise<void>;
    createTempFile: (content: string, extension?: string) => Promise<string>;
    createTempDir: () => Promise<string>;
    randomString: (length?: number) => string;
    waitFor: (condition: () => boolean | Promise<boolean>, timeout?: number) => Promise<boolean>;
  };
}

// 创建临时测试目录
const testTempDir = path.join(os.tmpdir(), 'taskflow-test');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.TASKFLOW_CONFIG_PATH = path.join(__dirname, 'fixtures', 'test-config.json');

// 保存原始console方法
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// 全局测试工具函数
(global as any).testUtils = {
  /**
   * 等待指定时间
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 创建临时文件
   */
  createTempFile: async (content: string, extension: string = '.txt') => {
    const tempFile = path.join(testTempDir, `temp_${Date.now()}${extension}`);
    await fs.writeFile(tempFile, content);
    return tempFile;
  },
  
  /**
   * 创建临时目录
   */
  createTempDir: async () => {
    const tempDir = path.join(testTempDir, `temp_dir_${Date.now()}`);
    await fs.ensureDir(tempDir);
    return tempDir;
  },
  
  /**
   * 生成随机字符串
   */
  randomString: (length: number = 8) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },
  
  /**
   * 等待条件满足
   */
  waitFor: async (condition: () => boolean | Promise<boolean>, timeout: number = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await (global as any).testUtils.sleep(100);
    }
    throw new Error(`等待条件超时 (${timeout}ms)`);
  }
};

export {};
