import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Core User Journeys', () => {
  test('new user can find installation instructions', async ({ page }) => {
    await page.goto('/');
    
    const quickStart = page.getByRole('link', { name: /快速开始|Quick Start/i }).first();
    if (await quickStart.isVisible()) {
      await quickStart.click();
    } else {
      await page.goto('/guide/');
    }
    
    const content = await page.content();
    expect(content).toContain('npm install');
  });

  test('developer can find CLI reference for think command', async ({ page }) => {
    await page.goto('/cli/think/');
    
    await expect(page).toHaveTitle(/think/);
    const heading = page.locator('h1').first();
    await expect(heading).toContainText('think');
    
    const optionsTable = page.locator('table').filter({ hasText: '--model' });
    await expect(optionsTable).toBeVisible();
  });

  test('MCP integration documentation is accessible', async ({ page }) => {
    await page.goto('/mcp/');
    
    const content = page.locator('main');
    await expect(content).toContainText(/MCP|Model Context Protocol/);
  });

  test('multi-agent development plan page loads', async ({ page }) => {
    await page.goto('/docs/agents/multi-agent-development-plan/');
    
    const content = page.locator('main');
    await expect(content).toContainText(/LogAgent|TypeAgent|RefactorAgent/);
  });

  test('sidebar navigation works on all pages', async ({ page }) => {
    await page.goto('/guide/');
    
    const sidebar = page.locator('.VPSidebar');
    await expect(sidebar).toBeVisible();
    
    const cliLink = sidebar.locator('a[href="/cli/"]').first();
    if (await cliLink.isVisible()) {
      await cliLink.click();
      await expect(page).toHaveURL(/\/cli\//);
    }
  });
});
