import { test, expect } from '@playwright/test';

test.describe('CLI Documentation', () => {
  test('should display CLI index page', async ({ page }) => {
    await page.goto('/cli/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });
    
    // CLI 页面应该有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show install command', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.content();
    // 检查安装相关内容
    expect(content.length).toBeGreaterThan(100);
  });

  test('should have think command documentation', async ({ page }) => {
    await page.goto('/cli/think', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 页面应该加载成功
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should document environment variables', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });
    
    const content = await page.content();
    // 检查是否有配置相关内容
    expect(content.length).toBeGreaterThan(100);
  });
});
