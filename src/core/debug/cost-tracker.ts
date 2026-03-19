/**
 * 成本实时计算面板
 * 跟踪并显示 AI 调用的实时成本
 */

import { ModelInfo, MODEL_REGISTRY } from '../ai/types';

export interface CostEntry {
  id: string;
  timestamp: number;
  modelId: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  duration: number;
  success: boolean;
}

export interface CostStats {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  avgCostPerRequest: number;
  avgDuration: number;
  byModel: Record<
    string,
    {
      count: number;
      cost: number;
      inputTokens: number;
      outputTokens: number;
    }
  >;
}

export interface CostTrackerOptions {
  /** 预算警告阈值 (美元) */
  budgetThreshold?: number;
  /** 每请求警告阈值 (美元) */
  requestThreshold?: number;
  /** 是否自动打印成本面板 */
  autoPrint?: boolean;
  /** 成本保留小数位数 */
  decimalPlaces?: number;
}

export class CostTracker {
  private entries: CostEntry[] = [];
  private startTime: number = Date.now();
  private budgetThreshold: number;
  private requestThreshold: number;
  private decimalPlaces: number;

  constructor(options: CostTrackerOptions = {}) {
    this.budgetThreshold = options.budgetThreshold || 10;
    this.requestThreshold = options.requestThreshold || 1;
    this.decimalPlaces = options.decimalPlaces || 4;
  }

  /**
   * 记录一次 API 调用
   */
  record(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    duration: number,
    success: boolean = true
  ): CostEntry {
    const model = MODEL_REGISTRY[modelId] || {
      id: modelId,
      name: modelId,
      provider: 'unknown' as any,
      capabilities: [],
      contextLength: 0,
      costPer1MInput: 0,
      costPer1MOutput: 0,
    };

    const inputCost = (inputTokens / 1_000_000) * model.costPer1MInput;
    const outputCost = (outputTokens / 1_000_000) * model.costPer1MOutput;
    const totalCost = inputCost + outputCost;

    const entry: CostEntry = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      modelId,
      modelName: model.name,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
      duration,
      success,
    };

    this.entries.push(entry);

    // 检查是否超过阈值
    if (totalCost > this.requestThreshold) {
      console.warn(`⚠️ 高成本请求: ${model.name} - $${totalCost.toFixed(this.decimalPlaces)}`);
    }

    return entry;
  }

  /**
   * 记录推理模型调用 (支持 reasoning tokens)
   */
  recordReasoning(
    modelId: string,
    inputTokens: number,
    outputTokens: number,
    reasoningTokens: number,
    duration: number,
    success: boolean = true
  ): CostEntry {
    const model = MODEL_REGISTRY[modelId] || {
      id: modelId,
      name: modelId,
      provider: 'unknown' as any,
      capabilities: [],
      contextLength: 0,
      costPer1MInput: 0,
      costPer1MOutput: 0,
    };

    // 推理模型通常对 reasoning tokens 收费较低或不同
    const inputCost = (inputTokens / 1_000_000) * model.costPer1MInput;
    const outputCost = ((outputTokens + reasoningTokens * 0.5) / 1_000_000) * model.costPer1MOutput;
    const totalCost = inputCost + outputCost;

    const entry: CostEntry = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      modelId,
      modelName: model.name,
      inputTokens,
      outputTokens: outputTokens + reasoningTokens,
      inputCost,
      outputCost,
      totalCost,
      duration,
      success,
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * 获取当前统计信息
   */
  getStats(): CostStats {
    const stats: CostStats = {
      totalCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      avgCostPerRequest: 0,
      avgDuration: 0,
      byModel: {},
    };

    for (const entry of this.entries) {
      stats.totalCost += entry.totalCost;
      stats.totalInputTokens += entry.inputTokens;
      stats.totalOutputTokens += entry.outputTokens;
      stats.totalRequests++;
      stats.avgDuration += entry.duration;

      if (entry.success) {
        stats.successRequests++;
      } else {
        stats.failedRequests++;
      }

      if (!stats.byModel[entry.modelId]) {
        stats.byModel[entry.modelId] = {
          count: 0,
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
      }

      stats.byModel[entry.modelId].count++;
      stats.byModel[entry.modelId].cost += entry.totalCost;
      stats.byModel[entry.modelId].inputTokens += entry.inputTokens;
      stats.byModel[entry.modelId].outputTokens += entry.outputTokens;
    }

    stats.avgCostPerRequest = stats.totalRequests > 0 ? stats.totalCost / stats.totalRequests : 0;
    stats.avgDuration = stats.totalRequests > 0 ? stats.avgDuration / stats.totalRequests : 0;

    return stats;
  }

  /**
   * 渲染成本面板
   */
  renderPanel(): string {
    const stats = this.getStats();
    const duration = Date.now() - this.startTime;

    const lines: string[] = [
      '💰 成本分析面板',
      '═'.repeat(50),
      `  总成本:       $${stats.totalCost.toFixed(this.decimalPlaces)}`,
      `  请求次数:     ${stats.totalRequests} (✅ ${stats.successRequests} ❌ ${stats.failedRequests})`,
      `  输入 tokens:  ${stats.totalInputTokens.toLocaleString()}`,
      `  输出 tokens:  ${stats.totalOutputTokens.toLocaleString()}`,
      `  平均成本:     $${stats.avgCostPerRequest.toFixed(this.decimalPlaces)}/请求`,
      `  平均耗时:     ${stats.avgDuration.toFixed(0)}ms`,
      `  运行时间:     ${(duration / 1000).toFixed(1)}s`,
      '─'.repeat(50),
      '  按模型分类:',
    ];

    for (const [modelId, modelStats] of Object.entries(stats.byModel)) {
      const modelName = MODEL_REGISTRY[modelId]?.name || modelId;
      lines.push(
        `    ${modelName}: $${modelStats.cost.toFixed(this.decimalPlaces)} (${modelStats.count}次, ` +
          `${modelStats.inputTokens.toLocaleString()}+${modelStats.outputTokens.toLocaleString()} tokens)`
      );
    }

    // 预算警告
    if (stats.totalCost > this.budgetThreshold) {
      lines.push('');
      lines.push(`  ⚠️ 警告: 已超过预算阈值 $${this.budgetThreshold}`);
    }

    lines.push('═'.repeat(50));

    return lines.join('\n');
  }

  /**
   * 渲染简洁版本
   */
  renderCompact(): string {
    const stats = this.getStats();
    return (
      `💰 $${stats.totalCost.toFixed(this.decimalPlaces)} | ${stats.totalRequests} 请求 | ` +
      `${stats.totalInputTokens.toLocaleString()}+${stats.totalOutputTokens.toLocaleString()} tokens`
    );
  }

  /**
   * 导出为 CSV
   */
  toCSV(): string {
    const headers = [
      'ID',
      '时间',
      '模型',
      '输入tokens',
      '输出tokens',
      '输入成本',
      '输出成本',
      '总成本',
      '耗时',
      '成功',
    ];
    const rows = this.entries.map(e => [
      e.id,
      new Date(e.timestamp).toISOString(),
      e.modelName,
      e.inputTokens.toString(),
      e.outputTokens.toString(),
      e.inputCost.toFixed(this.decimalPlaces),
      e.outputCost.toFixed(this.decimalPlaces),
      e.totalCost.toFixed(this.decimalPlaces),
      e.duration.toString(),
      e.success ? '是' : '否',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * 导出为 JSON
   */
  toJSON(): string {
    return JSON.stringify(
      {
        stats: this.getStats(),
        entries: this.entries,
      },
      null,
      2
    );
  }

  /**
   * 重置跟踪器
   */
  reset(): void {
    this.entries = [];
    this.startTime = Date.now();
  }

  /**
   * 获取历史记录
   */
  getHistory(limit?: number): CostEntry[] {
    if (limit) {
      return this.entries.slice(-limit);
    }
    return [...this.entries];
  }
}

/**
 * 创建成本跟踪器实例的工厂函数
 */
export function createCostTracker(options?: CostTrackerOptions): CostTracker {
  return new CostTracker(options);
}

export default CostTracker;
