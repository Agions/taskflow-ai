/**
 * 沙箱管理
 */

import { SecuritySettings } from './types';
import { Logger } from '../../utils/logger';

/**
 * 沙箱管理器
 */
export class SandboxManager {
  private logger: Logger;

  constructor(
    private settings: SecuritySettings['sandbox'],
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('SandboxManager');
  }

  /**
   * 创建沙箱
   */
  createSandbox(): any {
    if (!this.settings.enabled) {
      return null;
    }

    return {
      timeout: this.settings.timeout,
      memoryLimit: this.settings.memoryLimit,
      allowedModules: ['fs', 'path', 'util'],
      blockedModules: ['child_process', 'cluster', 'net', 'dgram'],
      executeInContext: (code: string, context: any) => this.executeInContext(code, context),
    };
  }

  /**
   * 在沙箱上下文中执行代码
   */
  private executeInContext(code: string, context: any): any {
    try {
      const vm = require('vm');
      const sandbox = {
        ...context,
        console: {
          log: (...args: any[]) => this.logger.debug('Sandbox:', ...args),
        },
      };

      return vm.runInNewContext(code, sandbox, {
        timeout: this.settings.timeout,
      });
    } catch (error: any) {
      throw new Error(`沙箱执行失败: ${error.message}`);
    }
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * 获取超时时间
   */
  getTimeout(): number {
    return this.settings.timeout;
  }

  /**
   * 获取内存限制
   */
  getMemoryLimit(): number {
    return this.settings.memoryLimit;
  }
}
