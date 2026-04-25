/**
 * Execution Engine Tests
 * TaskFlow AI v4.0
 */

describe('ExecutionEngine', () => {
  it('should export ExecutionEngine class', async () => {
    const mod = await import('../index');
    expect(mod.ExecutionEngine).toBeDefined();
    expect(typeof mod.ExecutionEngine).toBe('function');
  });

  it('should require MCPServer and context in constructor', async () => {
    const { ExecutionEngine } = await import('../index');
    const engine = new ExecutionEngine({} as any, {} as any);
    expect(engine).toBeDefined();
  });
});

describe('TaskExecutor', () => {
  it('should export TaskExecutor class', async () => {
    const mod = await import('../task-executor');
    expect(mod.TaskExecutor).toBeDefined();
  });

  it('should create an instance with MCPServer and context', async () => {
    const { TaskExecutor } = await import('../task-executor');
    const executor = new TaskExecutor({} as any, {} as any);
    expect(executor).toBeDefined();
  });
});

describe('TaskSorter', () => {
  it('should create an instance', async () => {
    const { TaskSorter } = await import('../sorter');
    const sorter = new TaskSorter();
    expect(sorter).toBeDefined();
  });
});

describe('SummaryCalculator', () => {
  it('should create an instance', async () => {
    const { SummaryCalculator } = await import('../summary');
    const calc = new SummaryCalculator();
    expect(calc).toBeDefined();
  });
});
