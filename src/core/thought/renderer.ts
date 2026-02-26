/**
 * 思维链渲染器
 * 支持文本、Markdown、Mermaid 格式
 */

import { ThoughtChain, ReasoningStep } from './types';

/**
 * 文本渲染器
 */
export class TextRenderer {
  render(chain: ThoughtChain): string {
    const lines: string[] = [];
    
    lines.push('🤔 思维链分析\n');
    lines.push('═'.repeat(50));
    
    const steps = this.extractSteps(chain);
    for (const step of steps) {
      const indent = '  '.repeat(step.depth);
      lines.push(`${indent}Step ${step.step}: ${step.title}`);
      lines.push(`${indent}  ${step.description}`);
      if (step.reasoning) {
        lines.push(`${indent}  💭 ${step.reasoning}`);
      }
      lines.push(`${indent}  📊 置信度: ${(step.confidence * 100).toFixed(0)}%`);
      lines.push('');
    }

    return lines.join('\n');
  }

  private extractSteps(chain: ThoughtChain): Array<{
    step: number;
    title: string;
    description: string;
    reasoning?: string;
    confidence: number;
    depth: number;
  }> {
    const steps: Array<{
      step: number;
      title: string;
      description: string;
      reasoning?: string;
      confidence: number;
      depth: number;
    }> = [];

    let stepNum = 0;
    const traverse = (node: any, depth: number) => {
      stepNum++;
      steps.push({
        step: stepNum,
        title: this.getTitle(node.type),
        description: node.content,
        reasoning: node.reasoning,
        confidence: node.confidence,
        depth,
      });
      for (const child of node.children || []) {
        traverse(child, depth + 1);
      }
    };

    traverse(chain.root, 0);
    return steps;
  }

  private getTitle(type: string): string {
    const titles: Record<string, string> = {
      requirement: '🎯 理解需求',
      analysis: '📊 分析问题',
      decomposition: '🔨 拆解任务',
      task: '📋 生成任务',
      action: '⚡ 执行行动',
      reflection: '🔍 反思审查',
      synthesis: '✅ 综合总结',
    };
    return titles[type] || type;
  }
}

/**
 * Markdown 渲染器
 */
export class MarkdownRenderer {
  render(chain: ThoughtChain): string {
    const lines: string[] = [];
    
    lines.push('# 🧠 思维链分析\n');
    lines.push(`**时间**: ${new Date(chain.createdAt).toLocaleString()}`);
    lines.push(`**模型**: ${chain.metadata.model || '未知'}`);
    lines.push(`**输入**: ${chain.metadata.input?.substring(0, 100)}...\n`);
    lines.push('---\n');
    
    const steps = this.extractSteps(chain.root, 0);
    for (const step of steps) {
      const heading = '#'.repeat(Math.min(step.depth + 2, 6));
      lines.push(`${heading} ${step.step}. ${step.title}\n`);
      lines.push(`> **置信度**: ${(step.confidence * 100).toFixed(0)}%\n`);
      lines.push(`**描述**: ${step.description}\n`);
      if (step.reasoning) {
        lines.push(`**推理**: ${step.reasoning}\n`);
      }
    }

    return lines.join('\n');
  }

  private extractSteps(
    node: any, 
    depth: number,
    stepNum = { value: 0 }
  ): Array<{
    step: number;
    title: string;
    description: string;
    reasoning?: string;
    confidence: number;
    depth: number;
  }> {
    const steps: any[] = [];
    stepNum.value++;

    steps.push({
      step: stepNum.value,
      title: this.getTitle(node.type),
      description: node.content,
      reasoning: node.reasoning,
      confidence: node.confidence,
      depth,
    });

    for (const child of node.children || []) {
      steps.push(...this.extractSteps(child, depth + 1, stepNum));
    }

    return steps;
  }

  private getTitle(type: string): string {
    const titles: Record<string, string> = {
      requirement: '🎯 理解需求',
      analysis: '📊 分析问题',
      decomposition: '🔨 拆解任务',
      task: '📋 生成任务',
      action: '⚡ 执行行动',
      reflection: '🔍 反思审查',
      synthesis: '✅ 综合总结',
    };
    return titles[type] || type;
  }
}

/**
 * Mermaid 流程图渲染器
 */
export class MermaidRenderer {
  render(chain: ThoughtChain): string {
    const lines: string[] = [];
    
    lines.push('```mermaid');
    lines.push('flowchart TD');
    lines.push('    %% 节点样式');
    lines.push('    classDef requirement fill:#ffecd2,stroke:#fcb69f,stroke-width:2px');
    lines.push('    classDef analysis fill:#d4fc79,stroke:#96e6a1,stroke-width:2px');
    lines.push('    classDef decomposition fill:#84fab0,stroke:#8fd3f4,stroke-width:2px');
    lines.push('    classDef task fill:#a18cd1,stroke:#fbc2eb,stroke-width:2px');
    lines.push('    classDef action fill:#f093fb,stroke:#f5576c,stroke-width:2px');
    lines.push('    classDef reflection fill:#fdfbfb,stroke:#ebedee,stroke-width:2px');
    lines.push('    classDef synthesis fill:#4facfe,stroke:#00f2fe,stroke-width:2px');
    lines.push('');

    let nodeId = 0;
    const idMap = new Map<string, string>();
    
    const processNode = (node: any) => {
      const id = `node${nodeId++}`;
      const label = this.truncate(node.content, 30);
      const title = this.getTitle(node.type);
      idMap.set(node.id, id);
      
      lines.push(`    ${id}["${title}: ${label}"]:::${node.type}`);
      
      for (const child of node.children || []) {
        const childId = processNode(child);
        lines.push(`    ${id} --> ${childId}`);
      }
      
      return id;
    };

    processNode(chain.root);
    
    lines.push('```');
    
    return lines.join('\n');
  }

  private getTitle(type: string): string {
    const titles: Record<string, string> = {
      requirement: '需求',
      analysis: '分析',
      decomposition: '拆解',
      task: '任务',
      action: '行动',
      reflection: '反思',
      synthesis: '总结',
    };
    return titles[type] || type;
  }

  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
  }
}

/**
 * 思维导图渲染器 (XMind 风格)
 */
export class MindMapRenderer {
  render(chain: ThoughtChain): string {
    const lines: string[] = [];
    
    lines.push('# 思维导图\n');
    
    const renderTree = (node: any, prefix: string, isLast: boolean) => {
      const connector = isLast ? '└── ' : '├── ';
      const title = this.getTitle(node.type);
      lines.push(`${prefix}${connector}${title}: ${this.truncate(node.content, 40)}`);
      
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const children = node.children || [];
      children.forEach((child: any, index: number) => {
        renderTree(child, childPrefix, index === children.length - 1);
      });
    };

    renderTree(chain.root, '', true);
    
    return lines.join('\n');
  }

  private getTitle(type: string): string {
    const titles: Record<string, string> = {
      requirement: '🎯',
      analysis: '📊',
      decomposition: '🔨',
      task: '📋',
      action: '⚡',
      reflection: '🔍',
      synthesis: '✅',
    };
    return titles[type] || '•';
  }

  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
  }
}

/**
 * 渲染器工厂
 */
export function createRenderer(format: 'text' | 'markdown' | 'mermaid' | 'mindmap') {
  switch (format) {
    case 'text':
      return new TextRenderer();
    case 'markdown':
      return new MarkdownRenderer();
    case 'mermaid':
      return new MermaidRenderer();
    case 'mindmap':
      return new MindMapRenderer();
    default:
      return new TextRenderer();
  }
}
