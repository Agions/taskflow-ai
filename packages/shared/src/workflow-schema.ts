/**
 * TaskFlow AI 工作流 JSON Schema
 * 用于定义、验证和序列化工作流
 */

export const workflowSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://taskflow.ai/schema/workflow.json',
  title: 'TaskFlow Workflow',
  description: 'TaskFlow AI 工作流定义',
  type: 'object',
  required: ['version', 'nodes', 'edges'],
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: '工作流版本',
      examples: ['1.0.0'],
    },
    meta: {
      $id: '#/properties/meta',
      type: 'object',
      properties: {
        name: { type: 'string', description: '工作流名称' },
        description: { type: 'string', description: '工作流描述' },
        author: { type: 'string', description: '作者' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '标签',
        },
        category: {
          type: 'string',
          enum: ['automation', 'chat', 'data', 'integration', 'utility'],
          description: '分类',
        },
        icon: { type: 'string', description: '图标 emoji' },
      },
    },
    config: {
      $id: '#/properties/config',
      type: 'object',
      properties: {
        timeout: { type: 'number', description: '超时时间(毫秒)' },
        retry: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            maxAttempts: { type: 'number' },
            delay: { type: 'number' },
          },
          description: '重试配置',
        },
        cache: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            ttl: { type: 'number' },
          },
          description: '缓存配置',
        },
        environment: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: '环境变量',
        },
      },
    },
    nodes: {
      type: 'array',
      items: { $ref: '#/definitions/node' },
      minItems: 1,
      description: '节点列表',
    },
    edges: {
      type: 'array',
      items: { $ref: '#/definitions/edge' },
      description: '边列表(连接关系)',
    },
  },
  definitions: {
    node: {
      $id: '#/definitions/node',
      type: 'object',
      required: ['id', 'type', 'data'],
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z][a-zA-Z0-9_-]*$',
          description: '唯一标识',
        },
        type: {
          type: 'string',
          enum: [
            'input',
            'output',
            'llm',
            'tool',
            'condition',
            'switch',
            'loop',
            'parallel',
            'transform',
            'http',
            'agent',
            'custom',
          ],
          description: '节点类型',
        },
        data: {
          type: 'object',
          description: '节点数据',
        },
        position: {
          $id: '#/definitions/node/properties/position',
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          description: '画布位置(仅用于编辑器)',
        },
      },
    },
    edge: {
      $id: '#/definitions/edge',
      type: 'object',
      required: ['id', 'source', 'target'],
      properties: {
        id: {
          type: 'string',
          description: '唯一标识',
        },
        source: {
          type: 'string',
          description: '源节点 ID',
        },
        target: {
          type: 'string',
          description: '目标节点 ID',
        },
        sourceHandle: {
          type: 'string',
          description: '源连接点',
        },
        targetHandle: {
          type: 'string',
          description: '目标连接点',
        },
        label: {
          type: 'string',
          description: '边标签(如条件分支)',
        },
        condition: {
          type: 'object',
          description: '条件表达式',
        },
      },
    },
  },
} as const;

// 节点类型配置
export const nodeTypeConfigs = {
  input: {
    icon: '📥',
    color: '#00d4aa',
    description: '接收用户输入或触发事件',
    inputs: [],
    outputs: ['default'],
  },
  output: {
    icon: '📤',
    color: '#ff6b6b',
    description: '返回结果给用户',
    inputs: ['default'],
    outputs: [],
  },
  llm: {
    icon: '🤖',
    color: '#a855f7',
    description: '调用大语言模型',
    inputs: ['default'],
    outputs: ['default', 'error'],
    fields: [
      { name: 'model', type: 'select', required: true, label: '模型' },
      { name: 'temperature', type: 'number', label: '温度' },
      { name: 'maxTokens', type: 'number', label: '最大 Token' },
      { name: 'systemPrompt', type: 'textarea', label: '系统提示词' },
    ],
  },
  tool: {
    icon: '🔧',
    color: '#3b82f6',
    description: '调用 MCP 工具',
    inputs: ['default'],
    outputs: ['default', 'error'],
    fields: [
      { name: 'toolName', type: 'select', required: true, label: '工具' },
      { name: 'inputMapping', type: 'json', label: '输入映射' },
    ],
  },
  condition: {
    icon: '🔀',
    color: '#f59e0b',
    description: '条件分支',
    inputs: ['default'],
    outputs: ['true', 'false'],
    fields: [
      { name: 'expression', type: 'textarea', required: true, label: '条件表达式' },
    ],
  },
  switch: {
    icon: '🔃',
    color: '#ec4899',
    description: '多分支 Switch',
    inputs: ['default'],
    outputs: ['case1', 'case2', 'default'],
    fields: [
      { name: 'variable', type: 'text', required: true, label: '变量' },
      { name: 'cases', type: 'json', label: '分支映射' },
    ],
  },
  loop: {
    icon: '🔁',
    color: '#14b8a6',
    description: '循环执行',
    inputs: ['default'],
    outputs: ['default', 'break'],
    fields: [
      { name: 'maxIterations', type: 'number', label: '最大迭代次数' },
    ],
  },
  parallel: {
    icon: '⚡',
    color: '#f97316',
    description: '并行执行多个分支',
    inputs: ['default'],
    outputs: ['branch1', 'branch2'],
  },
  transform: {
    icon: '🔄',
    color: '#6366f1',
    description: '数据转换',
    inputs: ['default'],
    outputs: ['default'],
    fields: [
      { name: 'expression', type: 'textarea', required: true, label: '转换表达式' },
    ],
  },
  http: {
    icon: '🌐',
    color: '#22c55e',
    description: 'HTTP 请求',
    inputs: ['default'],
    outputs: ['default', 'error'],
    fields: [
      { name: 'url', type: 'text', required: true, label: 'URL' },
      { name: 'method', type: 'select', label: '方法' },
      { name: 'headers', type: 'json', label: '请求头' },
      { name: 'body', type: 'json', label: '请求体' },
    ],
  },
  agent: {
    icon: '🧠',
    color: '#eab308',
    description: '自主 Agent',
    inputs: ['default'],
    outputs: ['default', 'error'],
    fields: [
      { name: 'model', type: 'select', label: '模型' },
      { name: 'tools', type: 'multiselect', label: '可用工具' },
      { name: 'maxSteps', type: 'number', label: '最大步数' },
    ],
  },
  custom: {
    icon: '📦',
    color: '#64748b',
    description: '自定义节点',
    inputs: [],
    outputs: [],
  },
} as const;

// 示例工作流
export const exampleWorkflow = {
  version: '1.0.0',
  meta: {
    name: '客服工作流',
    description: '智能客服对话工作流',
    author: 'TaskFlow AI',
    tags: ['客服', '对话', 'AI'],
    category: 'chat',
    icon: '💬',
  },
  config: {
    timeout: 60000,
    retry: { enabled: true, maxAttempts: 3, delay: 1000 },
    cache: { enabled: true, ttl: 300 },
  },
  nodes: [
    {
      id: 'input',
      type: 'input',
      data: { label: '用户输入' },
      position: { x: 100, y: 200 },
    },
    {
      id: 'classify',
      type: 'llm',
      data: {
        label: '意图分类',
        model: 'gpt-4',
        systemPrompt: '你是一个客服意图分类器，将用户问题分类为：咨询、退款、投诉、其他',
      },
      position: { x: 300, y: 200 },
    },
    {
      id: 'condition',
      type: 'condition',
      data: {
        label: '是否退款',
        expression: '{{classify.result}} === "退款"',
      },
      position: { x: 500, y: 200 },
    },
    {
      id: 'refund_tool',
      type: 'tool',
      data: {
        label: '处理退款',
        toolName: 'refund_process',
      },
      position: { x: 700, y: 100 },
    },
    {
      id: 'chat_tool',
      type: 'llm',
      data: {
        label: '对话回复',
        model: 'gpt-4',
        systemPrompt: '你是一个友好的客服，根据用户问题给出专业回复',
      },
      position: { x: 700, y: 300 },
    },
    {
      id: 'output',
      type: 'output',
      data: { label: '返回结果' },
      position: { x: 900, y: 200 },
    },
  ],
  edges: [
    { id: 'e1', source: 'input', target: 'classify' },
    { id: 'e2', source: 'classify', target: 'condition' },
    { id: 'e3', source: 'condition', target: 'refund_tool', sourceHandle: 'true', label: '是' },
    { id: 'e4', source: 'condition', target: 'chat_tool', sourceHandle: 'false', label: '否' },
    { id: 'e5', source: 'refund_tool', target: 'output' },
    { id: 'e6', source: 'chat_tool', target: 'output' },
  ],
};

export type Workflow = typeof exampleWorkflow;
export type Node = typeof exampleWorkflow.nodes[0];
export type Edge = typeof exampleWorkflow.edges[0];
