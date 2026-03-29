  }

  /**
   * 在沙箱上下文中执行代码
   */
  private executeInContext(code: string, context: unknown): unknown {
    try {
      const vm = require('vm');
      const sandbox = {
        ...context,
        console: {
          log: (...args: unknown[]) => this.logger.debug('Sandbox:', ...args),
        },
      };

      return vm.runInNewContext(code, sandbox, {
        timeout: this.settings.timeout,
      });
    } catch (error: unknown) {
      throw new Error(`沙箱执行失败: ${error instanceof Error ? error.message : String(error)}`);
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