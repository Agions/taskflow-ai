/**
 * Planning Engine Tests
 * TaskFlow AI v4.0
 */

describe('PlanningEngine', () => {
  it('should export PlanningEngine class', async () => {
    const mod = await import('../index');
    expect(mod.PlanningEngine).toBeDefined();
    expect(typeof mod.PlanningEngine).toBe('function');
  });

  it('should require AIService in constructor', async () => {
    const { PlanningEngine } = await import('../index');
    const ai = { chat: jest.fn() };
    const engine = new PlanningEngine(ai as any);
    expect(engine).toBeDefined();
  });
});

describe('RequirementAnalyzer', () => {
  it('should create an instance', async () => {
    const { RequirementAnalyzer } = await import('../analyzer');
    const analyzer = new RequirementAnalyzer({} as any);
    expect(analyzer).toBeDefined();
  });
});

describe('TaskGenerator', () => {
  it('should create an instance', async () => {
    const { TaskGenerator } = await import('../task-generator');
    const gen = new TaskGenerator({} as any);
    expect(gen).toBeDefined();
  });
});

describe('DependencyAnalyzer', () => {
  it('should create an instance', async () => {
    const { DependencyAnalyzer } = await import('../dependency-analyzer');
    const analyzer = new DependencyAnalyzer();
    expect(analyzer).toBeDefined();
  });
});
