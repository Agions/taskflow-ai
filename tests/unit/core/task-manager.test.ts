/**
 * TaskManager 单元测试
 */

import { TaskManager, TaskType, TaskStatus, TaskPriority } from '../../../src-new/core/task/manager';
import { ConfigManager } from '../../../src-new/infrastructure/config/manager';
import { CacheManager } from '../../../src-new/infrastructure/storage/cache';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let configManager: ConfigManager;
  let cacheManager: CacheManager;

  beforeEach(async () => {
    // 创建测试依赖
    configManager = new ConfigManager({
      models: {},
      storage: { type: 'memory' },
      security: {},
      cache: {},
      memory: {},
      sandbox: {},
    });

    cacheManager = new CacheManager({
      type: 'memory',
      maxSize: 10 * 1024 * 1024,
      ttl: 3600,
      cleanupInterval: 300,
      persistToDisk: false,
      compression: false,
      maxFileSize: 1024 * 1024,
    });

    await configManager.initialize();
    await cacheManager.initialize();

    taskManager = new TaskManager(configManager, cacheManager);
    await taskManager.initialize();
  });

  afterEach(async () => {
    if (taskManager) {
      await taskManager.shutdown();
    }
    if (cacheManager) {
      await cacheManager.shutdown();
    }
  });

  describe('初始化', () => {
    test('应该成功初始化任务管理器', async () => {
      const newTaskManager = new TaskManager(configManager, cacheManager);
      await expect(newTaskManager.initialize()).resolves.not.toThrow();
      await newTaskManager.shutdown();
    });

    test('应该加载内置任务模板', async () => {
      const status = taskManager.getStatus();
      expect(status.availableTemplates).toBeGreaterThan(0);
    });
  });

  describe('任务创建', () => {
    test('应该成功创建基本任务', async () => {
      const taskData = {
        title: '测试任务',
        description: '这是一个测试任务',
        type: TaskType.ANALYSIS,
        priority: TaskPriority.HIGH,
        estimatedHours: 2,
      };

      const task = await taskManager.createTask(taskData);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.type).toBe(taskData.type);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(TaskStatus.DRAFT);
      expect(task.progress).toBe(0);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    test('应该为任务分配唯一ID', async () => {
      const task1 = await taskManager.createTask({ title: '任务1' });
      const task2 = await taskManager.createTask({ title: '任务2' });

      expect(task1.id).not.toBe(task2.id);
    });

    test('应该设置默认值', async () => {
      const task = await taskManager.createTask({});

      expect(task.title).toBe('新任务');
      expect(task.description).toBe('');
      expect(task.type).toBe(TaskType.ANALYSIS);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.estimatedHours).toBe(1);
    });

    test('应该从模板创建任务', async () => {
      const task = await taskManager.createFromTemplate('analysis', {
        title: '自定义分析任务'
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('自定义分析任务');
      expect(task.type).toBe(TaskType.ANALYSIS);
    });

    test('使用不存在的模板应该抛出错误', async () => {
      await expect(
        taskManager.createFromTemplate('不存在的模板')
      ).rejects.toThrow('任务模板不存在');
    });
  });

  describe('任务查询', () => {
    let testTasks: any[] = [];

    beforeEach(async () => {
      // 创建测试任务
      testTasks = [
        await taskManager.createTask({
          title: '高优先级任务',
          type: TaskType.ANALYSIS,
          priority: TaskPriority.HIGH,
          tags: ['urgent', 'analysis']
        }),
        await taskManager.createTask({
          title: '低优先级任务',
          type: TaskType.GENERATION,
          priority: TaskPriority.LOW,
          tags: ['simple']
        }),
        await taskManager.createTask({
          title: '已完成任务',
          type: TaskType.REVIEW,
          priority: TaskPriority.MEDIUM,
          tags: ['done']
        })
      ];

      // 更新第三个任务为已完成
      await taskManager.updateTask(testTasks[2].id, {
        status: TaskStatus.COMPLETED,
        progress: 100
      });
    });

    test('应该获取所有任务', () => {
      const allTasks = taskManager.getAllTasks();
      expect(allTasks.length).toBe(3);
    });

    test('应该根据状态过滤任务', () => {
      const completedTasks = taskManager.queryTasks({
        status: [TaskStatus.COMPLETED]
      });

      expect(completedTasks.length).toBe(1);
      expect(completedTasks[0].status).toBe(TaskStatus.COMPLETED);
    });

    test('应该根据类型过滤任务', () => {
      const analysisTasks = taskManager.queryTasks({
        type: [TaskType.ANALYSIS]
      });

      expect(analysisTasks.length).toBe(1);
      expect(analysisTasks[0].type).toBe(TaskType.ANALYSIS);
    });

    test('应该根据优先级过滤任务', () => {
      const highPriorityTasks = taskManager.queryTasks({
        priority: [TaskPriority.HIGH]
      });

      expect(highPriorityTasks.length).toBe(1);
      expect(highPriorityTasks[0].priority).toBe(TaskPriority.HIGH);
    });

    test('应该根据标签过滤任务', () => {
      const urgentTasks = taskManager.queryTasks({
        tags: ['urgent']
      });

      expect(urgentTasks.length).toBe(1);
      expect(urgentTasks[0].tags).toContain('urgent');
    });

    test('应该组合多个过滤条件', () => {
      const filteredTasks = taskManager.queryTasks({
        type: [TaskType.ANALYSIS, TaskType.GENERATION],
        priority: [TaskPriority.HIGH, TaskPriority.LOW]
      });

      expect(filteredTasks.length).toBe(2);
    });
  });

  describe('任务更新', () => {
    let testTask: any;

    beforeEach(async () => {
      testTask = await taskManager.createTask({
        title: '测试任务',
        description: '原始描述'
      });
    });

    test('应该成功更新任务', async () => {
      const updatedTask = await taskManager.updateTask(testTask.id, {
        title: '更新后的标题',
        description: '更新后的描述',
        priority: TaskPriority.HIGH
      });

      expect(updatedTask.title).toBe('更新后的标题');
      expect(updatedTask.description).toBe('更新后的描述');
      expect(updatedTask.priority).toBe(TaskPriority.HIGH);
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThan(testTask.updatedAt.getTime());
    });

    test('更新不存在的任务应该抛出错误', async () => {
      await expect(
        taskManager.updateTask('不存在的ID', { title: '新标题' })
      ).rejects.toThrow('任务不存在');
    });

    test('应该阻止修改任务ID', async () => {
      const originalId = testTask.id;
      await taskManager.updateTask(testTask.id, {
        id: '新的ID' as any
      });

      const updatedTask = taskManager.getTask(originalId);
      expect(updatedTask?.id).toBe(originalId);
    });
  });

  describe('任务状态管理', () => {
    let testTask: any;

    beforeEach(async () => {
      testTask = await taskManager.createTask({
        title: '状态测试任务'
      });
    });

    test('应该启动任务', async () => {
      const startedTask = await taskManager.startTask(testTask.id);

      expect(startedTask.status).toBe(TaskStatus.IN_PROGRESS);
      expect(startedTask.startedAt).toBeInstanceOf(Date);
    });

    test('应该完成任务', async () => {
      const result = {
        success: true,
        output: '任务结果',
        artifacts: [],
        metrics: {
          executionTime: 1000,
          memoryUsage: 1024,
          cpuUsage: 50,
          apiCalls: 5,
          cost: 0.01
        },
        logs: ['执行日志']
      };

      const completedTask = await taskManager.completeTask(testTask.id, result);

      expect(completedTask.status).toBe(TaskStatus.COMPLETED);
      expect(completedTask.progress).toBe(100);
      expect(completedTask.completedAt).toBeInstanceOf(Date);
      expect(completedTask.result).toEqual(result);
    });

    test('应该暂停任务', async () => {
      await taskManager.startTask(testTask.id);
      const pausedTask = await taskManager.pauseTask(testTask.id);

      expect(pausedTask.status).toBe(TaskStatus.PAUSED);
    });

    test('应该取消任务', async () => {
      const cancelledTask = await taskManager.cancelTask(testTask.id, '测试取消');

      expect(cancelledTask.status).toBe(TaskStatus.CANCELLED);
      expect(cancelledTask.errorMessage).toBe('测试取消');
      expect(cancelledTask.completedAt).toBeInstanceOf(Date);
    });

    test('应该标记任务失败', async () => {
      const failedTask = await taskManager.failTask(testTask.id, '执行失败');

      expect(failedTask.status).toBe(TaskStatus.FAILED);
      expect(failedTask.errorMessage).toBe('执行失败');
      expect(failedTask.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('任务删除', () => {
    test('应该删除单个任务', async () => {
      const task = await taskManager.createTask({ title: '待删除任务' });
      
      await taskManager.deleteTask(task.id);
      
      const deletedTask = taskManager.getTask(task.id);
      expect(deletedTask).toBeUndefined();
    });

    test('应该删除任务及其子任务', async () => {
      const parentTask = await taskManager.createTask({ title: '父任务' });
      const childTask = await taskManager.createTask({
        title: '子任务',
        parentId: parentTask.id
      });

      await taskManager.deleteTask(parentTask.id);

      expect(taskManager.getTask(parentTask.id)).toBeUndefined();
      expect(taskManager.getTask(childTask.id)).toBeUndefined();
    });

    test('删除不存在的任务应该抛出错误', async () => {
      await expect(
        taskManager.deleteTask('不存在的ID')
      ).rejects.toThrow('任务不存在');
    });
  });

  describe('任务统计', () => {
    beforeEach(async () => {
      // 创建不同状态的任务
      await taskManager.createTask({
        title: '任务1',
        type: TaskType.ANALYSIS,
        priority: TaskPriority.HIGH
      });

      const task2 = await taskManager.createTask({
        title: '任务2',
        type: TaskType.GENERATION,
        priority: TaskPriority.MEDIUM
      });

      await taskManager.completeTask(task2.id);

      await taskManager.createTask({
        title: '任务3',
        type: TaskType.ANALYSIS,
        priority: TaskPriority.LOW
      });
    });

    test('应该获取正确的统计信息', () => {
      const stats = taskManager.getTaskStats();

      expect(stats.total).toBe(3);
      expect(stats.byStatus[TaskStatus.DRAFT]).toBe(2);
      expect(stats.byStatus[TaskStatus.COMPLETED]).toBe(1);
      expect(stats.byType[TaskType.ANALYSIS]).toBe(2);
      expect(stats.byType[TaskType.GENERATION]).toBe(1);
      expect(stats.byPriority[TaskPriority.HIGH]).toBe(1);
      expect(stats.byPriority[TaskPriority.MEDIUM]).toBe(1);
      expect(stats.byPriority[TaskPriority.LOW]).toBe(1);
      expect(stats.completionRate).toBe(1/3);
    });
  });

  describe('任务依赖', () => {
    test('应该检查任务依赖', async () => {
      const task1 = await taskManager.createTask({ title: '依赖任务' });
      const task2 = await taskManager.createTask({
        title: '主任务',
        dependencies: [task1.id]
      });

      // 依赖任务未完成时，主任务不能开始
      expect(taskManager.canStartTask(task2.id)).toBe(false);

      // 完成依赖任务后，主任务可以开始
      await taskManager.completeTask(task1.id);
      expect(taskManager.canStartTask(task2.id)).toBe(true);
    });

    test('应该生成任务依赖图', async () => {
      const parent = await taskManager.createTask({ title: '父任务' });
      const child = await taskManager.createTask({
        title: '子任务',
        parentId: parent.id
      });
      const dependent = await taskManager.createTask({
        title: '依赖任务',
        dependencies: [child.id]
      });

      const graph = taskManager.getDependencyGraph();

      expect(graph.nodes.length).toBe(3);
      expect(graph.edges.length).toBe(2);
      
      const parentEdge = graph.edges.find(e => e.type === 'parent');
      const dependencyEdge = graph.edges.find(e => e.type === 'dependency');
      
      expect(parentEdge).toBeDefined();
      expect(dependencyEdge).toBeDefined();
    });
  });

  describe('任务管理器状态', () => {
    test('应该获取管理器状态', () => {
      const status = taskManager.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.totalTasks).toBeDefined();
      expect(status.activeTasks).toBeDefined();
      expect(status.completedTasks).toBeDefined();
      expect(status.availableTemplates).toBeDefined();
      expect(status.lastActivity).toBeInstanceOf(Date);
    });
  });
});