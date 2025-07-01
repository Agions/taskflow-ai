/**
 * TaskManager 单元测试
 * 测试任务管理器的核心功能
 */

import { TaskManager } from '../../../src/core/task/task-manager';
import { MockLogger, MockConfigManager, TestDataFactory } from '../../setup';
import { TaskStatus, TaskPriority, TaskType } from '../../../src/types/task';

describe('TaskManager', () => {
  let taskManager: TaskManager;
  let mockLogger: MockLogger;
  let mockConfigManager: MockConfigManager;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockConfigManager = new MockConfigManager();
    taskManager = new TaskManager(mockLogger as any, mockConfigManager as any);
  });

  describe('任务创建', () => {
    it('应该能够创建新任务', () => {
      const taskData = TestDataFactory.createTask({
        title: '新任务',
        description: '任务描述'
      });

      const task = taskManager.createTask(taskData);

      expect(task).toBeValidTask();
      expect(task.title).toBe('新任务');
      expect(task.description).toBe('任务描述');
      expect(task.status).toBe(TaskStatus.NOT_STARTED);
    });

    it('应该为新任务生成唯一ID', () => {
      const task1 = taskManager.createTask(TestDataFactory.createTask());
      const task2 = taskManager.createTask(TestDataFactory.createTask());

      expect(task1.id).not.toBe(task2.id);
      expect(task1.id).toMatch(/^task-/);
      expect(task2.id).toMatch(/^task-/);
    });

    it('应该设置任务的默认值', () => {
      const task = taskManager.createTask({
        title: '测试任务',
        description: '测试描述'
      });

      expect(task.status).toBe(TaskStatus.NOT_STARTED);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.type).toBe(TaskType.FEATURE);
      expect(task.dependencies).toEqual([]);
      expect(task.tags).toEqual([]);
      expect(task.progress).toBe(0);
    });
  });

  describe('任务查询', () => {
    beforeEach(() => {
      // 创建测试任务
      taskManager.createTask(TestDataFactory.createTask({
        id: 'task-1',
        title: '任务1',
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.HIGH
      }));

      taskManager.createTask(TestDataFactory.createTask({
        id: 'task-2',
        title: '任务2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM
      }));

      taskManager.createTask(TestDataFactory.createTask({
        id: 'task-3',
        title: '任务3',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW
      }));
    });

    it('应该能够获取所有任务', () => {
      const tasks = taskManager.getAllTasks();

      expect(tasks).toHaveLength(3);
      expect(tasks[0].id).toBe('task-1');
      expect(tasks[1].id).toBe('task-2');
      expect(tasks[2].id).toBe('task-3');
    });

    it('应该能够根据ID获取任务', () => {
      const task = taskManager.getTaskById('task-2');

      expect(task).toBeDefined();
      expect(task?.id).toBe('task-2');
      expect(task?.title).toBe('任务2');
    });

    it('应该在任务不存在时返回undefined', () => {
      const task = taskManager.getTaskById('non-existent');

      expect(task).toBeUndefined();
    });

    it('应该能够按状态过滤任务', () => {
      const inProgressTasks = taskManager.filterTasks({
        status: TaskStatus.IN_PROGRESS
      });

      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0].id).toBe('task-2');
    });

    it('应该能够按优先级过滤任务', () => {
      const highPriorityTasks = taskManager.filterTasks({
        priority: TaskPriority.HIGH
      });

      expect(highPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks[0].id).toBe('task-1');
    });

    it('应该能够组合多个过滤条件', () => {
      const filteredTasks = taskManager.filterTasks({
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.HIGH
      });

      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].id).toBe('task-1');
    });
  });

  describe('任务更新', () => {
    let taskId: string;

    beforeEach(() => {
      const task = taskManager.createTask(TestDataFactory.createTask({
        title: '原始任务',
        status: TaskStatus.NOT_STARTED
      }));
      taskId = task.id;
    });

    it('应该能够更新任务状态', () => {
      const updatedTask = taskManager.updateTask(taskId, {
        status: TaskStatus.IN_PROGRESS
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(updatedTask?.updatedAt).toBeInstanceOf(Date);
    });

    it('应该能够更新任务标题', () => {
      const updatedTask = taskManager.updateTask(taskId, {
        title: '更新后的任务'
      });

      expect(updatedTask?.title).toBe('更新后的任务');
    });

    it('应该能够更新任务进度', () => {
      const updatedTask = taskManager.updateTask(taskId, {
        progress: 50
      });

      expect(updatedTask?.progress).toBe(50);
    });

    it('应该在任务不存在时返回null', () => {
      const result = taskManager.updateTask('non-existent', {
        status: TaskStatus.COMPLETED
      });

      expect(result).toBeNull();
    });

    it('应该更新任务的updatedAt时间戳', () => {
      const originalTask = taskManager.getTaskById(taskId);
      const originalUpdatedAt = originalTask?.updatedAt;

      // 等待一毫秒确保时间戳不同
      setTimeout(() => {
        const updatedTask = taskManager.updateTask(taskId, {
          title: '新标题'
        });

        expect(updatedTask?.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('任务删除', () => {
    let taskId: string;

    beforeEach(() => {
      const task = taskManager.createTask(TestDataFactory.createTask());
      taskId = task.id;
    });

    it('应该能够删除任务', () => {
      const result = taskManager.deleteTask(taskId);

      expect(result).toBe(true);
      expect(taskManager.getTaskById(taskId)).toBeUndefined();
    });

    it('应该在删除不存在的任务时返回false', () => {
      const result = taskManager.deleteTask('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('任务依赖管理', () => {
    let task1Id: string;
    let task2Id: string;
    let task3Id: string;

    beforeEach(() => {
      const task1 = taskManager.createTask(TestDataFactory.createTask({ title: '任务1' }));
      const task2 = taskManager.createTask(TestDataFactory.createTask({ title: '任务2' }));
      const task3 = taskManager.createTask(TestDataFactory.createTask({ title: '任务3' }));

      task1Id = task1.id;
      task2Id = task2.id;
      task3Id = task3.id;
    });

    it('应该能够添加任务依赖', () => {
      taskManager.addDependency(task2Id, task1Id);

      const task2 = taskManager.getTaskById(task2Id);
      expect(task2?.dependencies).toContain(task1Id);
    });

    it('应该能够移除任务依赖', () => {
      taskManager.addDependency(task2Id, task1Id);
      taskManager.removeDependency(task2Id, task1Id);

      const task2 = taskManager.getTaskById(task2Id);
      expect(task2?.dependencies).not.toContain(task1Id);
    });

    it('应该能够检测循环依赖', () => {
      taskManager.addDependency(task2Id, task1Id);
      taskManager.addDependency(task3Id, task2Id);

      expect(() => {
        taskManager.addDependency(task1Id, task3Id);
      }).toThrow('检测到循环依赖');
    });

    it('应该能够获取下一个可执行的任务', () => {
      // 设置依赖关系：task2 依赖 task1
      taskManager.addDependency(task2Id, task1Id);
      
      // 完成 task1
      taskManager.updateTask(task1Id, { status: TaskStatus.COMPLETED });

      const nextTasks = taskManager.getNextTasks();
      
      expect(nextTasks).toContain(
        expect.objectContaining({ id: task2Id })
      );
    });
  });

  describe('任务统计', () => {
    beforeEach(() => {
      taskManager.createTask(TestDataFactory.createTask({ status: TaskStatus.NOT_STARTED }));
      taskManager.createTask(TestDataFactory.createTask({ status: TaskStatus.IN_PROGRESS }));
      taskManager.createTask(TestDataFactory.createTask({ status: TaskStatus.COMPLETED }));
      taskManager.createTask(TestDataFactory.createTask({ status: TaskStatus.COMPLETED }));
    });

    it('应该能够获取任务统计信息', () => {
      const stats = taskManager.getTaskStats();

      expect(stats.total).toBe(4);
      expect(stats.notStarted).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completed).toBe(2);
      expect(stats.completionRate).toBe(0.5);
    });
  });

  describe('任务计划管理', () => {
    it('应该能够设置任务计划', () => {
      const taskPlan = TestDataFactory.createTaskPlan();

      taskManager.setTaskPlan(taskPlan);

      expect(taskManager.getAllTasks()).toHaveLength(3);
    });

    it('应该能够获取任务计划', () => {
      const taskPlan = TestDataFactory.createTaskPlan();
      taskManager.setTaskPlan(taskPlan);

      const retrievedPlan = taskManager.getTaskPlan();

      expect(retrievedPlan).toBeValidTaskPlan();
      expect(retrievedPlan?.name).toBe(taskPlan.name);
    });

    it('应该能够清空任务计划', () => {
      const taskPlan = TestDataFactory.createTaskPlan();
      taskManager.setTaskPlan(taskPlan);

      taskManager.clearTaskPlan();

      expect(taskManager.getAllTasks()).toHaveLength(0);
      expect(taskManager.getTaskPlan()).toBeNull();
    });
  });
});
