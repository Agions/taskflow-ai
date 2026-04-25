/**
 * 规划模块类型测试
 * 测试 src/agent/planning/ 下所有导出的类型和类
 */

import {
  RequirementAnalyzer,
  TaskGenerator,
  DependencyAnalyzer,
} from '../index';

import {
  PRDDocument as AgentPRDDocument,
  Task as AgentTask,
  Dependency,
  TaskPlan,
} from '../../types';

import { PRDDocument } from '../../../types';

// ─── Helpers ────────────────────────────────────────────────────

function createMockAI(response: string) {
  return {
    complete: jest.fn().mockResolvedValue(response),
  };
}

function createAgentPRD(): AgentPRDDocument {
  return {
    id: 'prd-test',
    title: 'Test Project',
    description: 'A test project for planning',
    content: 'Full PRD content describing requirements...',
    requirements: [],
    acceptanceCriteria: ['Users can login'],
    metadata: {
      author: 'tester',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      tags: ['test'],
    },
  };
}

function createSrcPRD(): PRDDocument {
  return {
    id: 'prd-test',
    title: 'Test Project',
    version: '1.0.0',
    filePath: '/docs/prd.md',
    content: 'Full PRD content',
    metadata: {
      author: 'tester',
      createDate: new Date(),
      lastModified: new Date(),
      tags: ['test'],
      priority: 'high',
      complexity: 'medium',
      estimatedHours: 10,
    },
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ─── RequirementAnalyzer ────────────────────────────────────────

describe('RequirementAnalyzer', () => {
  it('should be constructed with an AI service', () => {
    const ai = createMockAI('{}');
    const analyzer = new RequirementAnalyzer(ai);
    expect(analyzer).toBeInstanceOf(RequirementAnalyzer);
  });

  it('should return a valid RequirementAnalysis on successful AI response', async () => {
    const aiResponse = JSON.stringify({
      features: [{ name: 'Login', description: 'Login page', complexity: 'medium', priority: 'high', dependencies: [] }],
      risks: [{ description: 'Security risk', probability: 'low', impact: 'high', mitigation: 'Audit' }],
      technicalConstraints: ['HTTPS required'],
      complexity: 'medium',
    });
    const ai = createMockAI(aiResponse);
    const analyzer = new RequirementAnalyzer(ai);
    const result = await analyzer.analyze(createAgentPRD());

    expect(result.features).toHaveLength(1);
    expect(result.features[0].name).toBe('Login');
    expect(result.technicalConstraints).toContain('HTTPS required');
  });

  it('should return default analysis when AI call fails', async () => {
    const ai = { complete: jest.fn().mockRejectedValue(new Error('AI failure')) };
    const analyzer = new RequirementAnalyzer(ai as any);
    const result = await analyzer.analyze(createAgentPRD());

    expect(result.features).toHaveLength(1);
    expect(result.features[0].name).toBe('Test Project');
    expect(result.complexity).toBe('medium');
  });

  it('should call AI with a prompt containing PRD title and description', async () => {
    const ai = createMockAI('{}');
    const analyzer = new RequirementAnalyzer(ai);
    await analyzer.analyze(createAgentPRD());

    expect(ai.complete).toHaveBeenCalledTimes(1);
    const prompt = ai.complete.mock.calls[0][0] as string;
    expect(prompt).toContain('Test Project');
  });
});

// ─── TaskGenerator ──────────────────────────────────────────────

describe('TaskGenerator', () => {
  it('should be constructed with an AI service', () => {
    const ai = createMockAI('[]');
    const generator = new TaskGenerator(ai);
    expect(generator).toBeInstanceOf(TaskGenerator);
  });

  it('should generate tasks from AI response', async () => {
    const aiResponse = JSON.stringify([
      { title: 'Setup project', description: 'Initialize project', type: 'code', priority: 'high', estimate: 2 },
      { title: 'Create models', description: 'Define data models', type: 'code', priority: 'medium', estimate: 3 },
    ]);
    const ai = createMockAI(aiResponse);
    const generator = new TaskGenerator(ai);
    const tasks = await generator.generate(createSrcPRD());

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('Setup project');
    expect(tasks[1].title).toBe('Create models');
  });

  it('should handle non-JSON AI response gracefully', async () => {
    const ai = createMockAI('not json');
    const generator = new TaskGenerator(ai);
    const tasks = await generator.generate(createSrcPRD());

    // Generator should return an array (possibly empty) without throwing
    expect(Array.isArray(tasks)).toBe(true);
  });
});

// ─── DependencyAnalyzer ─────────────────────────────────────────

describe('DependencyAnalyzer', () => {
  function createTask(id: string, deps: string[] = [], title = `Task ${id}`): AgentTask {
    return {
      id,
      title,
      description: `Description for ${id}`,
      type: 'code',
      status: 'pending',
      priority: 'medium',
      estimate: 1,
      dependencies: deps,
      metadata: { tags: [] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  it('should be constructable without arguments', () => {
    const analyzer = new DependencyAnalyzer();
    expect(analyzer).toBeInstanceOf(DependencyAnalyzer);
  });

  it('should detect explicit dependencies from task.dependencies', () => {
    const analyzer = new DependencyAnalyzer();
    const taskA = createTask('A');
    const taskB = createTask('B', ['A']);
    const deps = analyzer.analyze([taskA, taskB]);

    const explicitDep = deps.find(d => d.type === 'blocks' && d.from === 'A' && d.to === 'B');
    expect(explicitDep).toBeDefined();
  });

  it('should detect implicit dependencies for setup/config tasks', () => {
    const analyzer = new DependencyAnalyzer();
    const taskSetup = createTask('setup-1', [], 'Setup environment');
    const taskImpl = createTask('impl-1', [], 'Implement feature');
    const deps = analyzer.analyze([taskSetup, taskImpl]);

    const implicitDep = deps.find(d => d.type === 'depends-on' && d.from === 'setup-1');
    expect(implicitDep).toBeDefined();
  });

  it('should return empty array for unrelated tasks', () => {
    const analyzer = new DependencyAnalyzer();
    const task1 = createTask('X');
    const task2 = createTask('Y');
    const deps = analyzer.analyze([task1, task2]);

    expect(deps).toHaveLength(0);
  });

  it('should build a dependency graph', () => {
    const analyzer = new DependencyAnalyzer();
    const taskA = createTask('A');
    const taskB = createTask('B', ['A']);
    const taskC = createTask('C', ['B']);
    const tasks = [taskA, taskB, taskC];
    const deps = analyzer.analyze(tasks);
    const graph = analyzer.buildGraph(tasks, deps);

    expect(graph.size).toBe(3);
    expect(graph.get('A')).toContain('B');
  });

  it('should calculate critical path correctly', () => {
    const analyzer = new DependencyAnalyzer();
    const taskA = createTask('A');
    const taskB = createTask('B', ['A']);
    const taskC = createTask('C', ['B']);
    const tasks = [taskA, taskB, taskC];
    const deps: Dependency[] = [
      { from: 'A', to: 'B', type: 'blocks' },
      { from: 'B', to: 'C', type: 'blocks' },
    ];
    const path = analyzer.calculateCriticalPath(tasks, deps);

    expect(path).toHaveLength(3);
    expect(path[0]).toBe('A');
    expect(path[2]).toBe('C');
  });

  it('should handle single task with no dependencies', () => {
    const analyzer = new DependencyAnalyzer();
    const task = createTask('only');
    const deps = analyzer.analyze([task]);
    expect(deps).toHaveLength(0);

    const path = analyzer.calculateCriticalPath([task], deps);
    expect(path).toEqual(['only']);
  });

  it('should accept both Dependency type values', () => {
    const depBlocks: Dependency = { from: 'A', to: 'B', type: 'blocks' };
    const depDepends: Dependency = { from: 'A', to: 'B', type: 'depends-on' };
    expect(depBlocks.type).toBe('blocks');
    expect(depDepends.type).toBe('depends-on');
  });
});
