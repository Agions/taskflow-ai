/**
 * 任务生成器单元测试
 * 测试从需求生成任务的功能
 */

import { TaskGenerator } from '../../../../src/core/generator/task-generator';
import { MockLogger, MockConfigManager, TestDataFactory } from '../../../setup';
import { TaskType, TaskPriority, TaskStatus } from '../../../../src/types/task';

describe('TaskGenerator', () => {
  let generator: TaskGenerator;
  let mockLogger: MockLogger;
  let mockConfigManager: MockConfigManager;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockConfigManager = new MockConfigManager();
    generator = new TaskGenerator(mockLogger, mockConfigManager);
  });

  describe('generateFromRequirements', () => {
    it('应该从需求列表生成任务', async () => {
      const requirements = [
        TestDataFactory.createRequirement({
          title: '用户登录功能',
          description: '实现用户登录功能',
          type: 'functional',
          priority: 'high'
        }),
        TestDataFactory.createRequirement({
          title: '用户注册功能',
          description: '实现用户注册功能',
          type: 'functional',
          priority: 'high'
        })
      ];

      const taskPlan = await generator.generateFromRequirements(requirements);

      expect(taskPlan).toBeValidTaskPlan();
      expect(taskPlan.tasks.length).toBeGreaterThan(0);
      expect(taskPlan.name).toBeDefined();
      expect(taskPlan.description).toBeDefined();
    });

    it('应该为每个需求生成多个任务', async () => {
      const requirements = [
        TestDataFactory.createRequirement({
          title: '用户管理系统',
          description: '完整的用户管理功能，包括注册、登录、资料管理等',
          complexity: 8
        })
      ];

      const taskPlan = await generator.generateFromRequirements(requirements);

      // 复杂需求应该生成多个任务
      expect(taskPlan.tasks.length).toBeGreaterThan(3);
      
      // 应该包含不同类型的任务
      const taskTypes = new Set(taskPlan.tasks.map(t => t.type));
      expect(taskTypes.size).toBeGreaterThan(1);
    });

    it('应该正确设置任务优先级', async () => {
      const requirements = [
        TestDataFactory.createRequirement({
          title: '关键功能',
          priority: 'critical'
        }),
        TestDataFactory.createRequirement({
          title: '普通功能',
          priority: 'medium'
        })
      ];

      const taskPlan = await generator.generateFromRequirements(requirements);

      const criticalTasks = taskPlan.tasks.filter(t => t.priority === TaskPriority.CRITICAL);
      const mediumTasks = taskPlan.tasks.filter(t => t.priority === TaskPriority.MEDIUM);

      expect(criticalTasks.length).toBeGreaterThan(0);
      expect(mediumTasks.length).toBeGreaterThan(0);
    });

    it('应该生成任务依赖关系', async () => {
      const requirements = [
        TestDataFactory.createRequirement({
          title: '数据库设计',
          description: '设计用户表结构'
        }),
        TestDataFactory.createRequirement({
          title: '用户注册API',
          description: '实现用户注册接口，依赖数据库设计'
        })
      ];

      const taskPlan = await generator.generateFromRequirements(requirements);

      // 应该有任务具有依赖关系
      const tasksWithDependencies = taskPlan.tasks.filter(t => t.dependencies.length > 0);
      expect(tasksWithDependencies.length).toBeGreaterThan(0);
    });
  });

  describe('generateTasksForRequirement', () => {
    it('应该为功能需求生成开发任务', async () => {
      const requirement = TestDataFactory.createRequirement({
        title: '用户登录',
        type: 'functional',
        complexity: 5
      });

      const tasks = await generator.generateTasksForRequirement(requirement);

      expect(tasks.length).toBeGreaterThan(0);
      
      // 应该包含设计、开发、测试等任务
      const taskTypes = tasks.map(t => t.type);
      expect(taskTypes).toContain(TaskType.DESIGN);
      expect(taskTypes).toContain(TaskType.FEATURE);
      expect(taskTypes).toContain(TaskType.TEST);
    });

    it('应该为非功能需求生成相应任务', async () => {
      const requirement = TestDataFactory.createRequirement({
        title: '性能优化',
        type: 'non_functional',
        description: '系统响应时间优化'
      });

      const tasks = await generator.generateTasksForRequirement(requirement);

      expect(tasks.length).toBeGreaterThan(0);
      
      // 非功能需求可能包含研究、重构等任务
      const taskTypes = tasks.map(t => t.type);
      expect(taskTypes).toContainEqual(expect.stringMatching(/research|refactor|test/));
    });

    it('应该根据复杂度调整任务数量', async () => {
      const simpleRequirement = TestDataFactory.createRequirement({
        complexity: 2
      });
      const complexRequirement = TestDataFactory.createRequirement({
        complexity: 9
      });

      const simpleTasks = await generator.generateTasksForRequirement(simpleRequirement);
      const complexTasks = await generator.generateTasksForRequirement(complexRequirement);

      expect(complexTasks.length).toBeGreaterThan(simpleTasks.length);
    });
  });

  describe('estimateTaskEffort', () => {
    it('应该根据任务类型估算工作量', async () => {
      const designTask = TestDataFactory.createTask({
        type: TaskType.DESIGN,
        description: '设计用户界面'
      });

      const developmentTask = TestDataFactory.createTask({
        type: TaskType.FEATURE,
        description: '实现用户登录功能'
      });

      const testTask = TestDataFactory.createTask({
        type: TaskType.TEST,
        description: '编写单元测试'
      });

      const designEffort = await generator.estimateTaskEffort(designTask);
      const developmentEffort = await generator.estimateTaskEffort(developmentTask);
      const testEffort = await generator.estimateTaskEffort(testTask);

      expect(designEffort).toBeGreaterThan(0);
      expect(developmentEffort).toBeGreaterThan(0);
      expect(testEffort).toBeGreaterThan(0);

      // 开发任务通常比测试任务需要更多时间
      expect(developmentEffort).toBeGreaterThan(testEffort);
    });

    it('应该考虑任务复杂度', async () => {
      const simpleTask = TestDataFactory.createTask({
        description: '简单的按钮点击功能'
      });

      const complexTask = TestDataFactory.createTask({
        description: '复杂的数据处理算法，包括多种排序和过滤逻辑，需要处理大量数据'
      });

      const simpleEffort = await generator.estimateTaskEffort(simpleTask);
      const complexEffort = await generator.estimateTaskEffort(complexTask);

      expect(complexEffort).toBeGreaterThan(simpleEffort);
    });
  });

  describe('identifyDependencies', () => {
    it('应该识别任务间的依赖关系', async () => {
      const tasks = [
        TestDataFactory.createTask({
          id: 'task-1',
          title: '数据库设计',
          type: TaskType.DESIGN
        }),
        TestDataFactory.createTask({
          id: 'task-2',
          title: '用户表创建',
          type: TaskType.FEATURE,
          description: '创建用户数据表'
        }),
        TestDataFactory.createTask({
          id: 'task-3',
          title: '用户注册API',
          type: TaskType.FEATURE,
          description: '实现用户注册接口'
        }),
        TestDataFactory.createTask({
          id: 'task-4',
          title: '注册功能测试',
          type: TaskType.TEST,
          description: '测试用户注册功能'
        })
      ];

      const tasksWithDependencies = await generator.identifyDependencies(tasks);

      // 检查依赖关系是否合理
      const apiTask = tasksWithDependencies.find(t => t.title.includes('API'));
      const testTask = tasksWithDependencies.find(t => t.type === TaskType.TEST);

      expect(apiTask?.dependencies.length).toBeGreaterThan(0);
      expect(testTask?.dependencies.length).toBeGreaterThan(0);
    });

    it('应该避免循环依赖', async () => {
      const tasks = [
        TestDataFactory.createTask({ id: 'task-1', title: '任务A' }),
        TestDataFactory.createTask({ id: 'task-2', title: '任务B' }),
        TestDataFactory.createTask({ id: 'task-3', title: '任务C' })
      ];

      const tasksWithDependencies = await generator.identifyDependencies(tasks);

      // 验证没有循环依赖
      const hasCyclicDependency = generator.hasCyclicDependency(tasksWithDependencies);
      expect(hasCyclicDependency).toBe(false);
    });
  });

  describe('optimizeTaskPlan', () => {
    it('应该优化任务计划', async () => {
      const taskPlan = TestDataFactory.createTaskPlan({
        tasks: [
          TestDataFactory.createTask({
            title: '任务1',
            estimatedHours: 40,
            priority: TaskPriority.LOW
          }),
          TestDataFactory.createTask({
            title: '任务2',
            estimatedHours: 8,
            priority: TaskPriority.CRITICAL
          }),
          TestDataFactory.createTask({
            title: '任务3',
            estimatedHours: 16,
            priority: TaskPriority.HIGH
          })
        ]
      });

      const optimizedPlan = await generator.optimizeTaskPlan(taskPlan);

      expect(optimizedPlan.tasks).toHaveLength(taskPlan.tasks.length);
      
      // 高优先级任务应该排在前面
      const firstTask = optimizedPlan.tasks[0];
      expect(firstTask.priority).toBe(TaskPriority.CRITICAL);
    });

    it('应该平衡工作负载', async () => {
      const taskPlan = TestDataFactory.createTaskPlan({
        tasks: Array(10).fill(null).map((_, i) => 
          TestDataFactory.createTask({
            title: `任务${i + 1}`,
            estimatedHours: Math.random() * 40 + 8
          })
        )
      });

      const optimizedPlan = await generator.optimizeTaskPlan(taskPlan, {
        balanceWorkload: true,
        teamSize: 3
      });

      expect(optimizedPlan.tasks).toHaveLength(taskPlan.tasks.length);
      // 验证工作负载分布更均匀
    });
  });

  describe('generateTaskPlanSummary', () => {
    it('应该生成任务计划摘要', async () => {
      const taskPlan = TestDataFactory.createTaskPlan({
        tasks: [
          TestDataFactory.createTask({ type: TaskType.DESIGN, estimatedHours: 16 }),
          TestDataFactory.createTask({ type: TaskType.FEATURE, estimatedHours: 32 }),
          TestDataFactory.createTask({ type: TaskType.TEST, estimatedHours: 8 }),
          TestDataFactory.createTask({ type: TaskType.DOCUMENT, estimatedHours: 4 })
        ]
      });

      const summary = await generator.generateTaskPlanSummary(taskPlan);

      expect(summary).toHaveProperty('totalTasks', 4);
      expect(summary).toHaveProperty('totalEstimatedHours', 60);
      expect(summary).toHaveProperty('tasksByType');
      expect(summary).toHaveProperty('tasksByPriority');
      expect(summary).toHaveProperty('estimatedDuration');
      expect(summary.tasksByType).toHaveProperty(TaskType.DESIGN, 1);
      expect(summary.tasksByType).toHaveProperty(TaskType.FEATURE, 1);
    });
  });

  describe('错误处理', () => {
    it('应该处理空需求列表', async () => {
      const taskPlan = await generator.generateFromRequirements([]);
      
      expect(taskPlan.tasks).toHaveLength(0);
      expect(taskPlan.name).toBeDefined();
    });

    it('应该处理无效需求', async () => {
      const invalidRequirement = {
        id: '',
        title: '',
        description: ''
      } as any;

      await expect(generator.generateTasksForRequirement(invalidRequirement))
        .rejects.toThrow();
    });

    it('应该记录生成过程中的警告', async () => {
      const ambiguousRequirement = TestDataFactory.createRequirement({
        title: '模糊需求',
        description: '做一些东西'
      });

      await generator.generateTasksForRequirement(ambiguousRequirement);
      
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('配置和自定义', () => {
    it('应该使用配置中的默认值', async () => {
      mockConfigManager.set('taskGenerator.defaultEstimatedHours', 12);
      mockConfigManager.set('taskGenerator.includeDocumentationTasks', false);

      const requirement = TestDataFactory.createRequirement();
      const tasks = await generator.generateTasksForRequirement(requirement);

      // 验证配置是否被应用
      const docTasks = tasks.filter(t => t.type === TaskType.DOCUMENT);
      expect(docTasks).toHaveLength(0);
    });

    it('应该支持自定义任务模板', async () => {
      const customTemplate = {
        name: '自定义模板',
        tasks: [
          { type: TaskType.RESEARCH, title: '需求调研' },
          { type: TaskType.DESIGN, title: '方案设计' },
          { type: TaskType.FEATURE, title: '功能开发' }
        ]
      };

      mockConfigManager.set('taskGenerator.customTemplates', [customTemplate]);

      const requirement = TestDataFactory.createRequirement({
        tags: ['自定义模板']
      });

      const tasks = await generator.generateTasksForRequirement(requirement);
      
      expect(tasks.some(t => t.title.includes('需求调研'))).toBe(true);
      expect(tasks.some(t => t.title.includes('方案设计'))).toBe(true);
    });
  });
});
