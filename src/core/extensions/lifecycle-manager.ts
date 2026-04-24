/**
 * Extension Lifecycle Manager - 扩展生命周期管理
 * TaskFlow AI v4.0
 */

import {
  ExtensionDefinition,
  ExtensionLifecycle,
  ExtensionType,
  ExtensionStatus
} from '../../types/extensions';
import { Logger } from '../../utils/logger';
import { getEventBus } from '../events';
import { ExtensionRegistry } from './registry';

export interface ExtensionState {
  definition: ExtensionDefinition;
  lifecycle?: ExtensionLifecycle;
  status: ExtensionStatus;
  error?: Error;
  activatedAt?: number;
  deactivatedAt?: number;
}

export class ExtensionLifecycleManager {
  private logger: Logger;
  private eventBus = getEventBus();
  private state: Map<string, ExtensionState> = new Map();
  private registry: ExtensionRegistry;

  constructor(registry?: ExtensionRegistry) {
    this.logger = Logger.getInstance('ExtensionLifecycleManager');
    this.registry = registry || new ExtensionRegistry();
  }

  /**
   * 注册扩展
   */
  async register(
    definition: ExtensionDefinition,
    lifecycle?: ExtensionLifecycle
  ): Promise<void> {
    this.logger.info(`Registering extension: ${definition.id}`);

    const state: ExtensionState = {
      definition,
      lifecycle,
      status: ExtensionStatus.LOADED
    };

    this.state.set(definition.id, state);

    // 调用生命周期钩子
    if (lifecycle?.onRegister) {
      try {
        await lifecycle.onRegister(definition);
      } catch (error) {
        this.logger.error(`Error in onRegister for ${definition.id}:`, { error });
        state.status = ExtensionStatus.ERROR;
        state.error = error as Error;
      }
    }

    this.emitEvent('extension.registered', { extensionId: definition.id });
  }

  /**
   * 激活扩展
   */
  async activate(extensionId: string): Promise<boolean> {
    const state = this.state.get(extensionId);
    if (!state) {
      this.logger.warn(`Extension not found: ${extensionId}`);
      return false;
    }

    if (state.status === ExtensionStatus.ACTIVE) {
      this.logger.info(`Extension already active: ${extensionId}`);
      return true;
    }

    this.logger.info(`Activating extension: ${extensionId}`);

    try {
      if (state.lifecycle?.onActivate) {
        await state.lifecycle.onActivate(extensionId);
      }

      state.status = ExtensionStatus.ACTIVE;
      state.activatedAt = Date.now();
      state.error = undefined;

      this.emitEvent('extension.activated', { extensionId });
      this.logger.info(`Extension activated: ${extensionId}`);
      return true;
    } catch (error) {
      state.status = ExtensionStatus.ERROR;
      state.error = error as Error;

      await this.handleError(error, extensionId);
      return false;
    }
  }

  /**
   * 停用扩展
   */
  async deactivate(extensionId: string): Promise<boolean> {
    const state = this.state.get(extensionId);
    if (!state) {
      return false;
    }

    if (state.status !== ExtensionStatus.ACTIVE) {
      return true;
    }

    this.logger.info(`Deactivating extension: ${extensionId}`);

    try {
      if (state.lifecycle?.onDeactivate) {
        await state.lifecycle.onDeactivate(extensionId);
      }

      state.status = ExtensionStatus.INACTIVE;
      state.deactivatedAt = Date.now();

      this.emitEvent('extension.deactivated', { extensionId });
      this.logger.info(`Extension deactivated: ${extensionId}`);
      return true;
    } catch (error) {
      await this.handleError(error, extensionId);
      return false;
    }
  }

  /**
   * 注销扩展
   */
  async unregister(extensionId: string): Promise<boolean> {
    const state = this.state.get(extensionId);
    if (!state) {
      return false;
    }

    // 先停用
    if (state.status === ExtensionStatus.ACTIVE) {
      await this.deactivate(extensionId);
    }

    // 调用注销钩子
    try {
      if (state.lifecycle?.onUnregister) {
        await state.lifecycle.onUnregister(extensionId);
      }
    } catch (error) {
      this.logger.error(`Error in onUnregister for ${extensionId}:`, { error });
    }

    this.state.delete(extensionId);
    this.registry.unregister(extensionId);

    this.emitEvent('extension.unregistered', { extensionId });
    this.logger.info(`Extension unregistered: ${extensionId}`);
    return true;
  }

  /**
   * 获取扩展状态
   */
  getStatus(extensionId: string): ExtensionStatus | undefined {
    const state = this.state.get(extensionId);
    return state?.status;
  }

  /**
   * 获取所有扩展
   */
  getAllExtensions(): ExtensionDefinition[] {
    return Array.from(this.state.values()).map(s => s.definition);
  }

  /**
   * 获取扩展详情
   */
  getExtensionState(extensionId: string): ExtensionState | undefined {
    return this.state.get(extensionId);
  }

  /**
   * 按状态获取扩展
   */
  getExtensionsByStatus(status: ExtensionStatus): ExtensionDefinition[] {
    return Array.from(this.state.values())
      .filter(s => s.status === status)
      .map(s => s.definition);
  }

  /**
   * 停用所有扩展
   */
  async deactivateAll(): Promise<void> {
    const activeExtensions = this.getExtensionsByStatus(ExtensionStatus.ACTIVE);
    await Promise.all(
      activeExtensions.map(ext => this.deactivate(ext.id))
    );
  }

  /**
   * 清理所有扩展
   */
  async cleanup(): Promise<void> {
    await this.deactivateAll();

    const extensionIds = Array.from(this.state.keys());
    await Promise.all(
      extensionIds.map(id => this.unregister(id))
    );

    this.logger.info('All extensions cleaned up');
  }

  /**
   * 处理错误
   */
  private async handleError(error: unknown, extensionId: string): Promise<void> {
    const state = this.state.get(extensionId);
    if (state?.lifecycle?.onError) {
      try {
        await state.lifecycle.onError(error as Error, extensionId);
      } catch (handlerError) {
        this.logger.error(`Error in onError handler for ${extensionId}:`, {
          error: handlerError
        });
      }
    }

    this.emitEvent('extension.error', { extensionId, error });
  }

  /**
   * 发送事件
   */
  private emitEvent(event: string, data: Record<string, unknown>): void {
    this.eventBus.emit({
      type: event as any,
      payload: data,
      timestamp: Date.now(),
      source: 'ExtensionLifecycleManager',
      id: `event-${Date.now()}`
    });
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      total: 0,
      byStatus: {} as Record<ExtensionStatus, number>,
      byType: {} as Record<ExtensionType, number>
    };

    Object.values(ExtensionStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    Object.values(ExtensionType).forEach(type => {
      stats.byType[type as ExtensionType] = 0;
    });

    this.state.forEach(state => {
      stats.total++;
      stats.byStatus[state.status]++;
      stats.byType[state.definition.type]++;
    });

    return stats;
  }
}
