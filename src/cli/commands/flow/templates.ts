/**
 * 工作流模板
 */

import type { WorkflowSpec } from '../../../core/workflow/types';

/**
 * 获取模板
 */
export function getTemplate(type: string): WorkflowSpec | null {
  switch (type) {
    case 'prd-to-code':
      return {
        name: 'prd-to-code',
        description: '从 PRD 生成代码',
        triggers: [{ type: 'manual' }],
        variables: { prd_content: '' },
        steps: [
          {
            id: 'parse',
            name: '解析 PRD',
            type: 'thought',
            prompt: '分析以下 PRD，提取功能点\n{{prd_content}}',
            output_key: 'parsed',
          },
          {
            id: 'decompose',
            name: '任务拆分',
            type: 'task',
            depends_on: ['parse'],
          },
          {
            id: 'generate',
            name: '生成代码',
            type: 'tool',
            tool: 'code_generate',
            depends_on: ['decompose'],
          },
        ],
      };

    case 'ci-cd':
      return {
        name: 'ci-cd',
        description: 'CI/CD 流水线',
        triggers: [{ type: 'event' }],
        steps: [
          {
            id: 'build',
            name: '构建',
            type: 'tool',
            tool: 'shell_exec',
            tool_input: { command: 'npm run build' },
          },
          {
            id: 'test',
            name: '测试',
            type: 'tool',
            tool: 'shell_exec',
            tool_input: { command: 'npm test' },
            depends_on: ['build'],
          },
        ],
      };

    default:
      return {
        name: 'basic',
        description: '基础工作流',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [
          {
            id: 'step1',
            name: '步骤 1',
            type: 'task',
          },
          {
            id: 'step2',
            name: '步骤 2',
            type: 'task',
            depends_on: ['step1'],
          },
        ],
      };
  }
}
