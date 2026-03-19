/**
 * 思维链时间线视图
 * 可视化展示 AI 推理过程的每个步骤
 */

import { ThoughtChain, ThoughtNode, ReasoningStep, ThoughtType } from '../thought/types';

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: ThoughtType;
  title: string;
  content: string;
  reasoning?: string;
  duration?: number;
  confidence: number;
  model?: string;
  children?: TimelineEvent[];
  error?: string;
}

export interface TimelineViewOptions {
  /** 是否显示详细推理 */
  showReasoning?: boolean;
  /** 是否显示时间戳 */
  showTimestamp?: boolean;
  /** 是否显示模型信息 */
  showModel?: boolean;
  /** 最大显示深度 */
  maxDepth?: number;
  /** 时间格式 */
  timeFormat?: 'relative' | 'absolute' | 'duration';
}

export class ThoughtChainTimeline {
  private events: TimelineEvent[] = [];
  private startTime: number = 0;

  constructor(private options: TimelineViewOptions = {}) {
    this.options = {
      showReasoning: true,
      showTimestamp: true,
      showModel: true,
      maxDepth: 10,
      timeFormat: 'relative',
      ...options,
    };
  }

  /**
   * 从思维链构建时间线
   */
  fromChain(chain: ThoughtChain): TimelineEvent[] {
    this.startTime = chain.createdAt;
    this.events = this.buildEvents(chain.root, 0);
    return this.events;
  }

  /**
   * 从步骤数组构建时间线
   */
  fromSteps(steps: ReasoningStep[]): TimelineEvent[] {
    this.startTime = Date.now();
    this.events = this.buildEventsFromSteps(steps);
    return this.events;
  }

  private buildEvents(node: ThoughtNode, depth: number): TimelineEvent[] {
    if (depth > (this.options.maxDepth || 10)) return [];

    const event: TimelineEvent = {
      id: node.id,
      timestamp: node.timestamp,
      type: node.type,
      title: this.getTypeTitle(node.type),
      content: node.content,
      reasoning: node.reasoning,
      duration: node.metadata?.duration as number | undefined,
      confidence: node.confidence,
      model: node.model,
      error: node.toolCalls?.some((t) => t.error) ? '包含错误' : undefined,
    };

    const result: TimelineEvent[] = [event];

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      event.children = [];
      for (const child of node.children) {
        event.children.push(...this.buildEvents(child, depth + 1));
      }
    }

    return result;
  }

  private buildEventsFromSteps(steps: ReasoningStep[]): TimelineEvent[] {
    return steps.map((step) => ({
      id: `step-${step.step}`,
      timestamp: this.startTime + (step.duration || 0) * step.step,
      type: step.type,
      title: step.title,
      content: step.description,
      reasoning: step.reasoning,
      duration: step.duration,
      confidence: step.confidence,
      children: step.children ? this.buildEventsFromSteps(step.children) : undefined,
    }));
  }

  private getTypeTitle(type: ThoughtType): string {
    const titles: Record<ThoughtType, string> = {
      requirement: '📝 需求理解',
      analysis: '🔍 分析',
      decomposition: '📋 任务拆解',
      task: '⚡ 任务执行',
      action: '🎯 行动',
      reflection: '🤔 反思',
      synthesis: '✨ 综合总结',
    };
    return titles[type] || type;
  }

  /**
   * 渲染为文本格式
   */
  toText(): string {
    const lines: string[] = ['🧠 思维链时间线', '═'.repeat(40)];

    for (const event of this.events) {
      lines.push(this.renderEvent(event, 0));
    }

    lines.push('═'.repeat(40));
    lines.push(`总计: ${this.events.length} 个步骤`);

    return lines.join('\n');
  }

  private renderEvent(event: TimelineEvent, indent: number): string {
    const prefix = '  '.repeat(indent);
    const timeStr = this.formatTime(event.timestamp);
    const confStr = this.formatConfidence(event.confidence);
    
    const lines = [
      `${prefix}├─ [${timeStr}] ${event.title} ${confStr}`,
      `${prefix}│  ${event.content}`,
    ];

    if (this.options.showReasoning && event.reasoning) {
      lines.push(`${prefix}│  💭 ${event.reasoning}`);
    }

    if (event.error) {
      lines.push(`${prefix}│  ❌ ${event.error}`);
    }

    if (event.duration) {
      lines.push(`${prefix}│  ⏱️ 耗时: ${event.duration}ms`);
    }

    if (event.children) {
      for (const child of event.children) {
        lines.push(this.renderEvent(child, indent + 1));
      }
    }

    return lines.join('\n');
  }

  /**
   * 渲染为 JSON 格式
   */
  toJSON(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * 渲染为简洁的进度条格式
   */
  toProgressBar(): string {
    const total = this.events.length;
    const completed = this.events.filter((e) => e.type === 'synthesis').length;
    const errors = this.events.filter((e) => e.error).length;
    
    const bar = '█'.repeat(completed) + '░'.repeat(total - completed);
    return `🧠 [${bar}] ${completed}/${total} ${errors > 0 ? `❌ ${errors}` : ''}`;
  }

  private formatTime(timestamp: number): string {
    switch (this.options.timeFormat) {
      case 'absolute':
        return new Date(timestamp).toLocaleTimeString();
      case 'duration':
        return `+${timestamp - this.startTime}ms`;
      case 'relative':
      default:
        const diff = timestamp - this.startTime;
        if (diff < 1000) return `${diff}ms`;
        return `${(diff / 1000).toFixed(1)}s`;
    }
  }

  private formatConfidence(confidence: number): string {
    const stars = '★'.repeat(Math.round(confidence * 5));
    const empty = '☆'.repeat(5 - Math.round(confidence * 5));
    return `${stars}${empty}`;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalSteps: number;
    totalDuration: number;
    avgConfidence: number;
    errorCount: number;
    byType: Record<ThoughtType, number>;
  } {
    const stats = {
      totalSteps: this.events.length,
      totalDuration: 0,
      avgConfidence: 0,
      errorCount: 0,
      byType: {} as Record<ThoughtType, number>,
    };

    let totalConf = 0;

    const countEvents = (events: TimelineEvent[]) => {
      for (const event of events) {
        stats.totalDuration += event.duration || 0;
        totalConf += event.confidence;
        if (event.error) stats.errorCount++;
        stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
        if (event.children) countEvents(event.children);
      }
    };

    countEvents(this.events);
    stats.avgConfidence = stats.totalSteps > 0 ? totalConf / stats.totalSteps : 0;

    return stats;
  }
}

export default ThoughtChainTimeline;
