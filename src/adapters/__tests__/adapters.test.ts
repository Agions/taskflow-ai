/**
 * Adapters Module Tests - TaskFlow AI v4.0
 */

describe('Adapters Modules', () => {
  it('AIAdapter should be importable', async () => {
    const mod = await import('../ai');
    expect(mod.AIAdapter).toBeDefined();
  });

  it('StorageAdapter should be importable', async () => {
    const mod = await import('../storage');
    expect(mod.StorageAdapter).toBeDefined();
  });

  it('ProtocolAdapter should be importable', async () => {
    const mod = await import('../protocol');
    expect(mod.ProtocolAdapter).toBeDefined();
  });

  it('adapters index should export all', async () => {
    const mod = await import('..');
    expect(mod.AIAdapter).toBeDefined();
    expect(mod.StorageAdapter).toBeDefined();
    expect(mod.ProtocolAdapter).toBeDefined();
  });
});
