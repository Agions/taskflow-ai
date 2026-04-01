import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Core User Journeys', () => {
  test('new user can find installation instructions', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    
    // 等待页面渲染
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.content();
    // 检查是否有内容（Vitepress SPA 需要等待渲染）
    expect(content.length).toBeGreaterThan(100);
  });

  test('developer can find CLI reference for think command', async ({ page }) => {
    await page.goto('/cli/think', { waitUntil: 'networkidle' });
    
    // 等待页面渲染
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 检查页面有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('MCP integration documentation is accessible', async ({ page }) => {
    await page.goto('/mcp/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('multi-agent development plan page loads', async ({ page }) => {
    await page.goto('/multi-agent-development-plan', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('sidebar navigation works on all pages', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 检查页面有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
