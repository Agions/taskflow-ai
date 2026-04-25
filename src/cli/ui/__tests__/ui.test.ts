/**
 * CLI UI Tests - TaskFlow AI v4.0
 */

describe('CLI UI', () => {
  it('theme should be importable', async () => {
    const mod = await import('../theme');
    expect(mod.theme).toBeDefined();
  });

  it('showLogo should be importable', async () => {
    const mod = await import('../index');
    expect(mod.showLogo).toBeDefined();
  });

  it('showSimpleLogo should be importable', async () => {
    const mod = await import('../index');
    expect(mod.showSimpleLogo).toBeDefined();
  });

  it('Spinner class should be importable', async () => {
    const mod = await import('../index');
    expect(mod.Spinner).toBeDefined();
  });

  it('animations should be importable', async () => {
    const mod = await import('../animations');
    expect(mod.animations).toBeDefined();
  });

  it('help components should be importable', async () => {
    const mod = await import('../help');
    expect(mod.createHelpDisplay).toBeDefined();
  });
});
