/**
 * Verification Engine Tests - TaskFlow AI v4.0
 */

describe('VerificationEngine', () => {
  it('should export VerificationEngine class', async () => {
    const mod = await import('../engine');
    expect(mod.VerificationEngine).toBeDefined();
    expect(typeof mod.VerificationEngine).toBe('function');
  });

  it('should create instance with projectPath string', async () => {
    const { VerificationEngine } = await import('../engine');
    const engine = new VerificationEngine('/tmp/test-project');
    expect(engine).toBeDefined();
  });
});

describe('CodeQualityChecker', () => {
  it('should create instance', async () => {
    const { CodeQualityChecker } = await import('../code-quality');
    const checker = new CodeQualityChecker('/tmp/test');
    expect(checker).toBeDefined();
  });
});

describe('CoverageChecker', () => {
  it('should create instance', async () => {
    const { CoverageChecker } = await import('../coverage');
    const checker = new CoverageChecker('/tmp/test');
    expect(checker).toBeDefined();
  });
});

describe('DependencyChecker', () => {
  it('should create instance', async () => {
    const { DependencyChecker } = await import('../dependencies');
    const checker = new DependencyChecker('/tmp/test');
    expect(checker).toBeDefined();
  });
});

describe('TypeSafetyChecker', () => {
  it('should create instance', async () => {
    const { TypeSafetyChecker } = await import('../type-safety');
    const checker = new TypeSafetyChecker('/tmp/test');
    expect(checker).toBeDefined();
  });
});

describe('generateFixTasks', () => {
  it('should be a function', async () => {
    const mod = await import('../fix-tasks');
    expect(typeof mod.generateFixTasks).toBe('function');
  });
});

describe('verifyTaskCompletion', () => {
  it('should be a function', async () => {
    const mod = await import('../checks');
    expect(typeof mod.verifyTaskCompletion).toBe('function');
    expect(typeof mod.verifyGeneratedFiles).toBe('function');
  });
});
