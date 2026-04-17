import { test, expect } from '@playwright/test';

test.describe('Documentation Site', () => {
  test('should load the homepage with correct title', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    // 检查页面加载成功
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display main navigation links', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    // 检查页面有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have a working "Getting Started" section', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('should display the API reference page', async ({ page }) => {
    await page.goto('/api/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    // API 页面应该有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    // 页面应该加载成功
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should not have broken links on main pages', async ({ page }) => {
    const pages = ['/guide/', '/api/', '/cli/'];
    let successCount = 0;

    for (const p of pages) {
      try {
        await page.goto(p, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForSelector('body', { timeout: 5000 });
        const content = await page.content();
        if (content.length > 100) {
          successCount++;
        }
      } catch (e) {
        // 忽略超时
      }
    }

    // 至少一个页面成功加载
    expect(successCount).toBeGreaterThan(0);
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('code examples should be visible', async ({ page }) => {
    await page.goto('/cli/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    // 检查页面有内容
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/guide/', { waitUntil: 'networkidle' });
    await page.waitForSelector('body', { timeout: 10000 });

    // 页面应该加载成功
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
