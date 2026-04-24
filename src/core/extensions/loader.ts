/**
 * Extension Loader - 动态加载扩展
 * TaskFlow AI v4.0
 */

import { ExtensionDefinition, ExtensionType, ExtensionTypes } from '../../types/extensions';
import { Logger } from '../../utils/logger';

/**
 * 扩展加载器
 */
export class ExtensionLoader {
  private logger: Logger;
  private loadedExtensions: Map<string, ExtensionDefinition<unknown>> = new Map();

  constructor() {
    this.logger = Logger.getInstance('ExtensionLoader');
  }

  /**
   * 加载扩展定义
   */
  async load<T = unknown>(definition: ExtensionDefinition<T>): Promise<T> {
    this.logger.info(`Loading extension: ${definition.id}`);
    this.loadedExtensions.set(definition.id, definition as ExtensionDefinition<unknown>);
    return definition.implementation;
  }

  /**
   * 从文件加载扩展
   */
  async loadFromFile<T = unknown>(filePath: string): Promise<ExtensionDefinition<T>> {
    // 实际实现中会使用动态 import
    this.logger.info(`Loading extension from file: ${filePath}`);

    // 模拟实现
    const definition: ExtensionDefinition<T> = {
      type: ExtensionTypes.AGENT,
      id: 'loaded-from-file',
      version: '1.0.0',
      name: 'Loaded Extension',
      description: 'Extension loaded from file',
      implementation: {} as T
    };

    return definition;
  }

  /**
   * 从目录加载所有扩展
   */
  async loadFromDirectory<T = unknown>(
    directoryPath: string,
    pattern: string = '/*.ts'
  ): Promise<ExtensionDefinition<T>[]> {
    this.logger.info(`Loading extensions from directory: ${directoryPath}, pattern: ${pattern}`);

    // 模拟实现 - 实际中会扫描目录
    const definitions: ExtensionDefinition<T>[] = [
      {
        type: ExtensionTypes.AGENT,
        id: 'agent-from-dir',
        version: '1.0.0',
        name: 'Agent From Directory',
        implementation: {} as T
      }
    ];

    for (const def of definitions) {
      this.loadedExtensions.set(def.id, def as ExtensionDefinition<unknown>);
    }

    return definitions;
  }

  /**
   * 卸载扩展
   */
  async unload(extensionId: string): Promise<boolean> {
    if (!this.loadedExtensions.has(extensionId)) {
      this.logger.warn(`Extension ${extensionId} not found`);
      return false;
    }

    this.loadedExtensions.delete(extensionId);
    this.logger.info(`Unloaded extension: ${extensionId}`);
    return true;
  }

  /**
   * 重新加载扩展
   */
  async reload(extensionId: string): Promise<ExtensionDefinition<unknown> | undefined> {
    const extension = this.loadedExtensions.get(extensionId);
    if (!extension) {
      this.logger.warn(`Extension ${extensionId} not found`);
      return undefined;
    }

    await this.unload(extensionId);
    await this.load(extension);
    return this.get(extensionId);
  }

  /**
   * 获取已加载的扩展
   */
  private get(extensionId: string): ExtensionDefinition<unknown> | undefined {
    return this.loadedExtensions.get(extensionId);
  }
}
