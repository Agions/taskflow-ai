import { describe, it, expect } from '@jest/globals';

describe('Core Package', () => {
  it('should create valid configuration', () => {
    const config = TaskFlowAI.createConfig('test-key', 'gpt-4');
    expect(config.apiKey).toBe('test-key');
    expect(config.model).toBe('gpt-4');
    expect(config.timeout).toBe(30000);
  });

  it('should validate configuration correctly', () => {
    const validConfig = TaskFlowAI.createConfig('key', 'model');
    expect(TaskFlowAI.validateConfig(validConfig)).toBe(true);

    const invalidConfig = { apiKey: 'key' }; // missing model
    expect(TaskFlowAI.validateConfig(invalidConfig)).toBe(false);
  });

  it('should create and manage tasks', () => {
    const taskManager = new TaskManager();
    const task = taskManager.createTask({
      title: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'medium'
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test Task');
    expect(task.status).toBe('pending');

    const retrievedTask = taskManager.getTask(task.id);
    expect(retrievedTask).toEqual(task);
  });
});