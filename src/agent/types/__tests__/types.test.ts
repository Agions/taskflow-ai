/**
 * Agent 类型定义测试
 * 测试 src/agent/types/ 下所有模块导出的类型
 */

import {
  // agent types
  AgentConfig,
  AgentStatus,
  AgentState,
  AgentContext,
  AgentSession,
  // prd types
  PRDDocument,
  PRDSection,
  Requirement,
  PRDMetadata,
  RequirementAnalysis,
  Feature,
  Risk,
  // task types
  Task,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskMetadata,
  TaskPlan,
  Dependency,
  // tool types
  Tool,
  ToolHandler,
  ToolResult,
  // history types
  ActionHistory,
  ActionType,
  AgentEvent,
  // verification types
  VerificationResult,
  VerificationCheck,
  CodeQualityReport,
  CodeIssue,
  CodeMetrics,
  CoverageReport,
  FileCoverage,
  // template types
  CodeTemplate,
  TemplateVariable,
  ValidationRule,
  TemplateContext,
  ComponentSpec,
  ComponentProp,
  GeneratedComponent,
  GeneratedFile,
  PlanningEngine as PlanningEngineInterface,
  // execution types
  ExecutionContext,
  TaskResult,
  ExecutionResult,
  ExecutionSummary,
} from '../index';

// ─── Agent Types ────────────────────────────────────────────────

describe('Agent Types', () => {
  it('should create a valid AgentConfig object', () => {
    const config: AgentConfig = {
      mode: 'autonomous',
      maxIterations: 10,
      maxRetries: 3,
      autoFix: true,
      approvalRequired: ['deploy'],
      continueOnError: false,
      timeout: 300000,
    };
    expect(config.mode).toBe('autonomous');
    expect(config.maxIterations).toBe(10);
    expect(config.autoFix).toBe(true);
  });

  it('should accept all AgentConfig mode values', () => {
    const modes: AgentConfig['mode'][] = ['assisted', 'autonomous', 'supervised'];
    expect(modes).toHaveLength(3);
    expect(modes).toContain('assisted');
    expect(modes).toContain('autonomous');
    expect(modes).toContain('supervised');
  });

  it('should accept all AgentStatus values', () => {
    const statuses: AgentStatus[] = [
      'idle',
      'planning',
      'executing',
      'verifying',
      'awaitingApproval',
      'completed',
      'failed',
    ];
    expect(statuses).toHaveLength(7);
  });

  it('should create a valid Task with all required fields', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Create login page',
      description: 'Implement user login UI',
      type: 'code',
      status: 'pending',
      priority: 'high',
      estimate: 4,
      dependencies: [],
      metadata: {
        tags: ['frontend', 'auth'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(task.id).toBe('task-1');
    expect(task.type).toBe('code');
    expect(task.metadata.tags).toContain('frontend');
  });

  it('should accept all TaskType values', () => {
    const types: TaskType[] = ['code', 'file', 'shell', 'analysis', 'design', 'test'];
    expect(types).toHaveLength(6);
  });

  it('should accept all TaskStatus values', () => {
    const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed', 'failed', 'blocked'];
    expect(statuses).toHaveLength(5);
  });

  it('should accept all TaskPriority values', () => {
    const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
    expect(priorities).toHaveLength(4);
  });

  it('should create a valid Dependency', () => {
    const dep: Dependency = { from: 'task-1', to: 'task-2', type: 'blocks' };
    expect(dep.from).toBe('task-1');
    expect(dep.type).toBe('blocks');
  });

  it('should create a valid TaskPlan', () => {
    const plan: TaskPlan = {
      tasks: [],
      dependencies: [],
      totalEstimate: 0,
      criticalPath: [],
      continueOnError: true,
    };
    expect(plan.totalEstimate).toBe(0);
    expect(plan.continueOnError).toBe(true);
  });

  it('should create a valid TaskMetadata', () => {
    const meta: TaskMetadata = {
      framework: 'react',
      language: 'typescript',
      template: 'component',
      source: 'agent',
      tags: ['ui'],
    };
    expect(meta.framework).toBe('react');
    expect(meta.tags).toEqual(['ui']);
  });
});

// ─── PRD Types ──────────────────────────────────────────────────

describe('PRD Types', () => {
  it('should create a valid PRDDocument', () => {
    const prd: PRDDocument = {
      id: 'prd-1',
      title: 'User Management',
      description: 'User management module',
      content: 'Full PRD content here...',
      requirements: [],
      acceptanceCriteria: ['Users can register', 'Users can login'],
      metadata: {
        author: 'agent',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        tags: ['user', 'auth'],
      },
      version: '1.0.0',
      filePath: '/docs/prd.md',
    };
    expect(prd.id).toBe('prd-1');
    expect(prd.acceptanceCriteria).toHaveLength(2);
  });

  it('should create a valid PRDSection with heading levels', () => {
    const section: PRDSection = {
      title: 'Overview',
      content: 'Section content',
      order: 1,
      level: 'h2',
    };
    expect(section.level).toBe('h2');
  });

  it('should create a valid Requirement with priority and type', () => {
    const req: Requirement = {
      id: 'req-1',
      title: 'Authentication',
      description: 'User must be able to authenticate',
      priority: 'high',
      type: 'functional',
    };
    expect(req.priority).toBe('high');
    expect(req.type).toBe('functional');
  });

  it('should create a valid RequirementAnalysis', () => {
    const analysis: RequirementAnalysis = {
      features: [
        {
          name: 'Login',
          description: 'Login feature',
          complexity: 'medium',
          priority: 'critical',
          dependencies: [],
        },
      ],
      technicalConstraints: ['Must support OAuth2'],
      risks: [
        {
          description: 'Security vulnerability',
          probability: 'low',
          impact: 'high',
          mitigation: 'Security audit',
        },
      ],
      complexity: 'medium',
    };
    expect(analysis.features).toHaveLength(1);
    expect(analysis.risks[0].impact).toBe('high');
  });

  it('should create a valid Feature', () => {
    const feature: Feature = {
      name: 'Dashboard',
      description: 'Main dashboard view',
      complexity: 'high',
      priority: 'medium',
      dependencies: ['auth'],
    };
    expect(feature.complexity).toBe('high');
    expect(feature.dependencies).toContain('auth');
  });

  it('should create a valid Risk with all severity levels', () => {
    const risk: Risk = {
      description: 'Performance degradation',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Load testing',
    };
    const probabilityLevels: Risk['probability'][] = ['low', 'medium', 'high'];
    const impactLevels: Risk['impact'][] = ['low', 'medium', 'high'];
    expect(probabilityLevels).toHaveLength(3);
    expect(impactLevels).toHaveLength(3);
    expect(risk.mitigation).toBe('Load testing');
  });
});

// ─── Tool Types ─────────────────────────────────────────────────

describe('Tool Types', () => {
  it('should create a valid Tool with handler', async () => {
    const handler: ToolHandler = async (params) => {
      return { success: true, data: params };
    };
    const tool: Tool = {
      name: 'file_read',
      description: 'Read a file',
      parameters: { path: { type: 'string' } },
      handler,
    };
    expect(tool.name).toBe('file_read');

    const result = await tool.handler({ path: '/test.txt' });
    expect(result.success).toBe(true);
  });

  it('should create ToolResult for success and failure', () => {
    const successResult: ToolResult = { success: true, data: 'content' };
    const failureResult: ToolResult = { success: false, error: 'File not found' };
    expect(successResult.success).toBe(true);
    expect(failureResult.success).toBe(false);
    expect(failureResult.error).toBe('File not found');
  });
});

// ─── History Types ──────────────────────────────────────────────

describe('History Types', () => {
  it('should accept all ActionType values', () => {
    const actionTypes: ActionType[] = ['plan', 'execute', 'verify', 'fix', 'approve', 'reject'];
    expect(actionTypes).toHaveLength(6);
  });

  it('should create a valid ActionHistory entry', () => {
    const history: ActionHistory = {
      id: 'action-1',
      type: 'execute',
      timestamp: new Date(),
      data: { taskId: 'task-1' },
      result: 'success',
      message: 'Task executed successfully',
    };
    expect(history.type).toBe('execute');
    expect(history.result).toBe('success');
  });

  it('should create all AgentEvent type variants', () => {
    const events: AgentEvent[] = [
      { type: 'START' },
      { type: 'PLAN_COMPLETE', data: {} },
      { type: 'PLAN_FAILED', error: new Error('plan error') },
      { type: 'EXECUTION_COMPLETE', data: {} },
      { type: 'EXECUTION_FAILED', error: new Error('exec error') },
      { type: 'VERIFICATION_PASS', data: {} },
      { type: 'VERIFICATION_FAIL', data: {} },
      { type: 'APPROVED' },
      { type: 'REJECTED' },
    ];
    expect(events).toHaveLength(9);
    expect(events[0].type).toBe('START');
    expect(events[events.length - 1].type).toBe('REJECTED');
  });
});

// ─── Verification Types ─────────────────────────────────────────

describe('Verification Types', () => {
  it('should create a valid VerificationCheck', () => {
    const check: VerificationCheck = {
      name: 'TypeScript Compilation',
      passed: true,
      message: 'No type errors found',
      severity: 'info',
    };
    expect(check.passed).toBe(true);
    expect(check.severity).toBe('info');
  });

  it('should create a valid VerificationResult', () => {
    const result: VerificationResult = {
      checks: [
        { name: 'Build', passed: true, message: 'OK', severity: 'info' },
        { name: 'Tests', passed: false, message: '2 failures', severity: 'error' },
      ],
      allPassed: false,
      fixTasks: [],
    };
    expect(result.allPassed).toBe(false);
    expect(result.checks).toHaveLength(2);
  });

  it('should create valid CodeQualityReport with issues and metrics', () => {
    const report: CodeQualityReport = {
      score: 85,
      issues: [
        { file: 'src/app.ts', line: 10, message: 'Unused variable', severity: 'warning', rule: 'no-unused-vars' },
      ],
      metrics: {
        linesOfCode: 1200,
        complexity: 12,
        maintainability: 78,
      },
    };
    expect(report.score).toBe(85);
    expect(report.issues[0].severity).toBe('warning');
    expect(report.metrics.linesOfCode).toBe(1200);
  });

  it('should create valid CoverageReport with file coverage', () => {
    const coverage: CoverageReport = {
      overall: 92.5,
      files: [
        { file: 'src/app.ts', statements: 95, branches: 88, functions: 100, lines: 92 },
      ],
    };
    expect(coverage.overall).toBeGreaterThan(90);
    expect(coverage.files[0].functions).toBe(100);
  });
});

// ─── Template Types ─────────────────────────────────────────────

describe('Template Types', () => {
  it('should create a valid CodeTemplate', () => {
    const template: CodeTemplate = {
      id: 'tpl-react-component',
      name: 'React Component',
      description: 'Generates a React functional component',
      framework: 'react',
      language: 'typescript',
      template: 'import React from "react";\nexport default function {{name}}() {}',
      variables: [
        { name: 'name', type: 'string', required: true, description: 'Component name' },
      ],
      validation: [
        { rule: 'nameRequired', pattern: '^.+$', message: 'Name is required' },
      ],
    };
    expect(template.framework).toBe('react');
    expect(template.variables).toHaveLength(1);
  });

  it('should accept all TemplateVariable type values', () => {
    const types: TemplateVariable['type'][] = ['string', 'number', 'boolean', 'array', 'object'];
    expect(types).toHaveLength(5);
  });

  it('should create a valid ComponentSpec with props', () => {
    const spec: ComponentSpec = {
      name: 'Button',
      description: 'A clickable button',
      framework: 'react',
      props: [
        { name: 'label', type: 'string', optional: false },
        { name: 'onClick', type: '() => void', optional: false },
        { name: 'disabled', type: 'boolean', optional: true, defaultValue: 'false' },
      ],
      hasState: false,
      hasEffects: false,
      hasStyles: true,
    };
    expect(spec.props).toHaveLength(3);
    expect(spec.hasStyles).toBe(true);
  });

  it('should create a valid GeneratedComponent with files', () => {
    const generated: GeneratedComponent = {
      name: 'LoginButton',
      framework: 'react',
      files: [
        { path: 'src/components/LoginButton.tsx', content: 'export default function LoginButton() {}' },
        { path: 'src/components/LoginButton.css', content: '.login-button {}' },
      ],
    };
    expect(generated.files).toHaveLength(2);
  });

  it('should create a valid TemplateContext', () => {
    const ctx: TemplateContext = {
      name: 'MyComponent',
      framework: 'react',
      includeStyles: true,
    };
    expect(ctx.name).toBe('MyComponent');
    expect(ctx.includeStyles).toBe(true);
  });
});

// ─── Execution Types ────────────────────────────────────────────

describe('Execution Types', () => {
  it('should create a valid ExecutionContext', () => {
    const ctx: ExecutionContext = {
      projectPath: '/home/user/project',
      workspacePath: '/home/user/workspace',
      config: { verbose: true },
    };
    expect(ctx.projectPath).toBe('/home/user/project');
  });

  it('should create a valid TaskResult', () => {
    const result: TaskResult = {
      taskId: 'task-1',
      success: true,
      output: 'File created',
      duration: 150,
      artifacts: ['/src/new-file.ts'],
    };
    expect(result.success).toBe(true);
    expect(result.duration).toBe(150);
  });

  it('should create a valid ExecutionSummary', () => {
    const summary: ExecutionSummary = {
      totalTasks: 5,
      completedTasks: 3,
      failedTasks: 1,
      skippedTasks: 1,
      totalDuration: 5000,
      averageDuration: 1000,
    };
    expect(summary.completedTasks + summary.failedTasks + summary.skippedTasks).toBe(summary.totalTasks);
    expect(summary.averageDuration).toBe(1000);
  });

  it('should create a valid ExecutionResult', () => {
    const result: ExecutionResult = {
      results: [],
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        skippedTasks: 0,
        totalDuration: 0,
      },
      startTime: new Date(),
      endTime: new Date(),
      success: true,
    };
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it('should accept all VerificationCheck severity values', () => {
    const severities: VerificationCheck['severity'][] = ['error', 'warning', 'info'];
    expect(severities).toHaveLength(3);
  });

  it('should accept all Dependency type values', () => {
    const types: Dependency['type'][] = ['blocks', 'depends-on'];
    expect(types).toHaveLength(2);
  });
});
