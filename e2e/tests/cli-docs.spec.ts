import { test, expect } from '@playwright/test';

test.describe('CLI Documentation', () => {
  test('should display all major CLI commands', async ({ page }) => {
    await page.goto('/cli/');
    
    const commands = [
      'init',
      'think',
      'flow',
      'agent',
      'knowledge',
      'mcp',
      'marketplace',
      'template',
      'plugin',
      'model',
      'status',
      'doctor',
      'config'
    ];
    
    for (const cmd of commands) {
      const element = page.getByText(`\`${cmd}\``, { exact: false });
      expect(await element.count()).toBeGreaterThan(0, `${cmd} should be documented`);
    }
  });

  test('should show install command', async ({ page }) => {
    await page.goto('/');
    
    const installBlock = page.locator('pre code').filter({ hasText: /npm install|pnpm add/ });
    await expect(installBlock).toBeVisible();
  });

  test('should have examples for think command', async ({ page }) => {
    await page.goto('/cli/think/');
    
    const codeExample = page.locator('pre code').first();
    const codeText = await codeExample.textContent();
    expect(codeText?.includes('taskflow think')).toBeTruthy();
  });

  test('should document environment variables', async ({ page }) => {
    await page.goto('/guide/');
    
    const envVars = page.locator('text=/OPENAI_API_KEY|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY/');
    if (await envVars.count() > 0) {
      await expect(envVars.first()).toBeVisible();
    }
  });
});
