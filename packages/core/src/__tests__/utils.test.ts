import { describe, it, expect } from '@jest/globals';

describe('ConfigManager', () => {
  it('should manage configuration correctly', () => {
    const config = TaskFlowAI.createConfig('test-key', 'gpt-4');
    const manager = new ConfigManager(config);

    expect(manager.getConfig()).toEqual(config);

    manager.updateConfig({ timeout: 60000 });
    expect(manager.getConfig().timeout).toBe(60000);
  });
});

describe('TaskManager', () => {
  it('should update task status', () => {
    const taskManager = new TaskManager();
    const task = taskManager.createTask({
      title: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'medium'
    });

    const updatedTask = taskManager.updateTask(task.id, { status: 'completed' });
    expect(updatedTask?.status).toBe('completed');
    expect(updatedTask?.updatedAt).not.toBe(task.updatedAt);
  });

  it('should delete tasks', () => {
    const taskManager = new TaskManager();
    const task = taskManager.createTask({
      title: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'medium'
    });

    expect(taskManager.deleteTask(task.id)).toBe(true);
    expect(taskManager.getTask(task.id)).toBeUndefined();
  });
});