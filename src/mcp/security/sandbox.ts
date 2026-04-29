/**
 * 沙箱管理（已弃用 - 使用严格的输入验证代替）
 * 
 * 注意：Node.js 的 vm.runInNewContext 不是真正的沙箱，可能存在安全漏洞。
 * 因此，我们不使用沙箱，而是依赖严格的输入验证、命令白名单和权限控制。
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
    
    // 沙箱功能已禁用，记录警告
    if (this.settings.enabled) {
      this.logger.warn(
        'Sandbox functionality is disabled for security reasons. ' +
        'Strict input validation and command whitelisting are used instead.'
      );
    }
  }

  /**
   * 创建沙箱（已停用）
   * 
   * 返回 null 表示不使用沙箱，依赖其他安全机制：
   * - 命令白名单验证 (validator.validateCommand)
   * - 路径遍历防护 (validator.validateFilePath)
   * - SSRF 防护 (validator.validateUrl)
   * - 工具执行超时控制 (executor timeout)
   */
  createSandbox(): null {
    // 始终返回 null，不使用沙箱
    return null;
  }

  /**
   * 检查是否启用（始终返回 false）
   */
  isEnabled(): boolean {
    // 沙箱功能已完全禁用
    return false;
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
