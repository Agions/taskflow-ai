/**
 * Extension Registry - 统一扩展注册表
 * TaskFlow AI v4.0
 */

import {
  ExtensionType,
  ExtensionDefinition,
  ExtensionTypes
} from '../../types/extensions';
import { Logger } from '../../utils/logger';

/**
 * ExtensionType 值数组
 */
const EXTENSION_TYPE_VALUES: ExtensionType[] = [
  'plugin', 'agent', 'tool', 'workflow', 'command', 'ui', 'middleware'
];

/**
 * 扩展注册表实现
 */
export class ExtensionRegistry {
  private logger: Logger;
  private extensions: Map<string, ExtensionDefinition<unknown>> = new Map();
  private byType: Map<ExtensionType, Set<string>> = new Map();

  constructor() {
    this.logger = Logger.getInstance('ExtensionRegistry');
    // 初始化类型索引
    EXTENSION_TYPE_VALUES.forEach(type => {
      this.byType.set(type, new Set());
    });
  }

  /**
   * 注册扩展
   */
  register<T = unknown>(definition: ExtensionDefinition<T>): void {
    if (this.extensions.has(definition.id)) {
      this.logger.warn(`Extension ${definition.id} already registered, overwriting`);
    }

    this.extensions.set(definition.id, definition as ExtensionDefinition<unknown>);
    this.byType.get(definition.type)?.add(definition.id);

    this.logger.info(
      `Registered extension: ${definition.id} (type: ${definition.type}, version: ${definition.version})`
    );
  }

  /**
   * 注销扩展
   */
  unregister(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      return false;
    }

    this.byType.get(extension.type)?.delete(extensionId);
    this.extensions.delete(extensionId);

    this.logger.info(`Unregistered extension: ${extensionId}`);
    return true;
  }

  /**
   * 获取扩展
   */
  get<T = unknown>(extensionId: string): ExtensionDefinition<T> | undefined {
    return this.extensions.get(extensionId) as ExtensionDefinition<T> | undefined;
  }

  /**
   * 获取所有扩展或指定类型的扩展
   */
  getAll<T = unknown>(type?: ExtensionType): ExtensionDefinition<T>[] {
    if (!type) {
      return Array.from(this.extensions.values()) as ExtensionDefinition<T>[];
    }

    const ids = this.byType.get(type);
    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map(id => this.extensions.get(id)!)
      .filter(Boolean) as ExtensionDefinition<T>[];
  }

  /**
   * 检查扩展是否存在
   */
  has(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }

  /**
   * 清空所有扩展
   */
  clear(): void {
    this.extensions.clear();
    this.byType.forEach(set => set.clear());
    this.logger.info('Cleared all extensions');
  }
}
