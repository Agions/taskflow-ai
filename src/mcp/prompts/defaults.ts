/**
 * 默认提示模板
 */

import { MCPPrompt } from './types';

export const defaultPrompts: MCPPrompt[] = [
  {
    name: 'project_plan',
    description: '生成项目执行计划',
    template: `基于以下项目信息生成详细的执行计划：

项目名称：{{projectName}}
项目描述：{{projectDescription}}
{{#if requirements}}
需求列表：
{{#each requirements}}
- {{this}}
{{/each}}
{{/if}}

请生成包含以下内容的项目计划：
1. 项目阶段划分
2. 关键里程碑
3. 任务分解
4. 时间估算
5. 风险评估

计划应该具体可执行，包含明确的交付物和验收标准。`,
    arguments: [
      { name: 'projectName', description: '项目名称', type: 'string', required: true },
      { name: 'projectDescription', description: '项目描述', type: 'string', required: true },
      { name: 'requirements', description: '需求列表', type: 'array', required: false, default: [] }
    ],
    category: 'planning',
    version: '1.0.0'
  },
  {
    name: 'code_review',
    description: '代码审查',
    template: `请审查以下代码：

\`\`\`{{language}}
{{code}}
\`\`\`

请从以下维度进行审查：
1. 代码质量
2. 潜在bug
3. 性能问题
4. 安全漏洞
5. 改进建议`,
    arguments: [
      { name: 'code', description: '代码内容', type: 'string', required: true },
      { name: 'language', description: '编程语言', type: 'string', required: false, default: 'typescript' }
    ],
    category: 'code',
    version: '1.0.0'
  },
  {
    name: 'bug_analysis',
    description: 'Bug分析',
    template: `分析以下错误信息：

错误：{{error}}
{{#if stackTrace}}
堆栈：
{{stackTrace}}
{{/if}}
{{#if context}}
上下文：
{{context}}
{{/if}}

请提供：
1. 错误原因分析
2. 解决方案
3. 预防措施`,
    arguments: [
      { name: 'error', description: '错误信息', type: 'string', required: true },
      { name: 'stackTrace', description: '堆栈跟踪', type: 'string', required: false },
      { name: 'context', description: '上下文信息', type: 'string', required: false }
    ],
    category: 'debug',
    version: '1.0.0'
  }
];
