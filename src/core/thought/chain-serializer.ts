/**
 * 思维链序列化
 */

import { ThoughtChain, ThoughtNode, ReasoningStep } from './types';
import { ThoughtChainOperations } from './chain-operations';

/**
 * 思维链序列化器
 */
export class ThoughtChainSerializer {
  constructor(
    private operations: ThoughtChainOperations,
    private verbose: boolean
  ) {}

  /**
   * 将思维链转换为步骤数组
   */
  toSteps(chain: ThoughtChain): ReasoningStep[] {
    const steps: ReasoningStep[] = [];
    this.operations.traverseTree(chain.root, (node, _depth) => {
      steps.push({
        step: steps.length + 1,
        type: node.type,
        title: this.operations.getTypeTitle(node.type),
        description: node.content,
        reasoning: node.reasoning,
        confidence: node.confidence,
      });
    });
    return steps;
  }

  /**
   * 序列化为文本格式
   */
  toText(chain: ThoughtChain): string {
    const lines: string[] = [];

    lines.push('🤔 思维链分析\n');
    lines.push('─'.repeat(40));

    const steps = this.toSteps(chain);
    for (const step of steps) {
      lines.push(`\n${'  '.repeat(step.step - 1)}${step.title}`);
      lines.push(`${'  '.repeat(step.step)}📝 ${step.description}`);
      if (step.reasoning && this.verbose) {
        lines.push(`${'  '.repeat(step.step)}💭 ${step.reasoning}`);
      }
      lines.push(`${'  '.repeat(step.step)}📊 置信度: ${(step.confidence * 100).toFixed(0)}%`);
    }

    return lines.join('\n');
  }

  /**
   * 序列化为 Markdown 格式
   */
  toMarkdown(chain: ThoughtChain): string {
    const lines: string[] = [];

    lines.push('# 🧠 思维链分析\n');
    lines.push(`> 输入: ${chain.metadata.input?.substring(0, 100)}...`);
    lines.push(`> 模型: ${chain.metadata.model || '未知'}`);
    lines.push(`> 时间: ${new Date(chain.createdAt).toLocaleString()}\n`);
    lines.push('---\n');

    const steps = this.toSteps(chain);
    for (const step of steps) {
      lines.push(`## ${step.step}. ${step.title}\n`);
      lines.push(`**描述**: ${step.description}\n`);
      lines.push(`**置信度**: ${(step.confidence * 100).toFixed(0)}%\n`);
      if (step.reasoning && this.verbose) {
        lines.push(`**推理**: ${step.reasoning}\n`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 序列化为 JSON 格式
   */
  toJSON(chain: ThoughtChain): string {
    return JSON.stringify(
      {
        id: chain.id,
        createdAt: chain.createdAt,
        metadata: chain.metadata,
        steps: this.toSteps(chain),
      },
      null,
      2
    );
  }
}
