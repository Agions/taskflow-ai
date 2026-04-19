/**
 * TaskFlow AI - SharedContext 工作流共享上下文
 * 差异化设计：跨 Stage 数据共享，crewAI 没有的特性
 */

import { SharedContext, PRDDocument, TaskPlan, CodeArtifact, ReviewResult } from './types';
import { Logger } from '../../utils/logger';

/**
 * 上下文变化事件
 */
export interface ContextChangeEvent {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

/**
 * SharedContext 共享上下文实现
 * 提供类型安全的上下文存取、变化追踪、模板渲染
 */
export class WorkflowContext {
  private context: SharedContext;
  private logger: Logger;
  private history: ContextChangeEvent[] = [];
  private maxHistory: number = 100;

  constructor(initialContext?: Partial<SharedContext>) {
    this.context = { ...initialContext } as SharedContext;
    this.logger = Logger.getInstance('WorkflowContext');
  }

  // ============================================================
  // 基础存取
  // ============================================================

  /**
   * 获取上下文值
   */
  get<T = unknown>(key: string): T | undefined {
    const keys = key.split('.');
    let value: unknown = this.context;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  /**
   * 设置上下文值
   */
  set<T = unknown>(key: string, value: T): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: Record<string, unknown> = this.context;

    // 遍历到最后一层
    for (const k of keys) {
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k] as Record<string, unknown>;
    }

    const oldValue = target[lastKey];
    target[lastKey] = value;

    // 记录变化
    this.history.push({
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    });

    // 限制历史记录长度
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    this.logger.debug(`Context updated: ${key}`);
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * 删除上下文值
   */
  delete(key: string): boolean {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: Record<string, unknown> = this.context;

    for (const k of keys) {
      if (!(k in target)) return false;
      target = target[k] as Record<string, unknown>;
    }

    if (lastKey in target) {
      delete target[lastKey];
      return true;
    }
    return false;
  }

  /**
   * 获取整个上下文对象
   */
  getAll(): SharedContext {
    return { ...this.context };
  }

  /**
   * 合并上下文
   */
  merge(partial: Partial<SharedContext>): void {
    this.context = { ...this.context, ...partial };
  }

  /**
   * 重置上下文
   */
  reset(): void {
    this.context = {};
    this.history = [];
  }

  // ============================================================
  // 类型安全的快捷方法
  // ============================================================

  /**
   * 设置 PRD 文档
   */
  setPRD(prd: PRDDocument): void {
    this.set('prd', prd);
  }

  /**
   * 获取 PRD 文档
   */
  getPRD(): PRDDocument | undefined {
    return this.get<PRDDocument>('prd');
  }

  /**
   * 设置任务计划
   */
  setPlan(plan: TaskPlan): void {
    this.set('plan', plan);
  }

  /**
   * 获取任务计划
   */
  getPlan(): TaskPlan | undefined {
    return this.get<TaskPlan>('plan');
  }

  /**
   * 设置代码产物
   */
  setCode(code: CodeArtifact): void {
    this.set('code', code);
  }

  /**
   * 获取代码产物
   */
  getCode(): CodeArtifact | undefined {
    return this.get<CodeArtifact>('code');
  }

  /**
   * 设置审查结果
   */
  setReview(review: ReviewResult): void {
    this.set('review', review);
  }

  /**
   * 获取审查结果
   */
  getReview(): ReviewResult | undefined {
    return this.get<ReviewResult>('review');
  }

  // ============================================================
  // 模板渲染
  // ============================================================

  /**
   * 渲染模板字符串
   * 支持 {{context.key}} 语法
   */
  renderTemplate(template: string): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.get(key.trim());
      if (value === undefined) {
        this.logger.warn(`Template key not found: ${key}`);
        return match;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
  }

  /**
   * 渲染对象中的模板
   */
  renderObject<T extends Record<string, unknown>>(obj: T): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.renderTemplate(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.renderObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result as T;
  }

  // ============================================================
  // 历史记录
  // ============================================================

  /**
   * 获取变化历史
   */
  getHistory(): ContextChangeEvent[] {
    return [...this.history];
  }

  /**
   * 获取指定键的历史
   */
  getKeyHistory(key: string): ContextChangeEvent[] {
    return this.history.filter(e => e.key === key);
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.history = [];
  }

  // ============================================================
  // 快照与恢复
  // ============================================================

  /**
   * 创建快照
   */
  snapshot(): SharedContext {
    return JSON.parse(JSON.stringify(this.context));
  }

  /**
   * 恢复快照
   */
  restore(snapshot: SharedContext): void {
    this.context = { ...snapshot };
  }
}
