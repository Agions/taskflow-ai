import { test, expect } from '@playwright/test';
import { testData } from '../fixtures';

test.describe('Documentation Site', () => {
  test('should load the homepage with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TaskFlow AI/);
  });

  test('should display main navigation links', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    const quickStartLink = page.getByRole('link', { name: /快速开始|Quick Start/i });
    await expect(quickStartLink).toBeVisible();
  });

  test('should have a working "Getting Started" section', async ({ page }) => {
    await page.goto('/guide/');
    
    const content = page.locator('main');
    await expect(content).toContainText(/安装|Install|Usage/);
  });

  test('should display the API reference page', async ({ page }) => {
    await page.goto('/api/');
    
    const codeBlock = page.locator('pre code').first();
    await expect(codeBlock).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="搜索"]').or(page.locator('input[placeholder*="Search"]'));
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('think');
      await searchInput.press('Enter');
      
      const results = page.locator('.search-result').or(page.locator('.vp-search-result'));
      if (await results.count() > 0) {
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('should not have broken links on main pages', async ({ page }) => {
    const pages = ['/', '/guide/', '/api/', '/cli/'];
    const brokenLinks: string[] = [];

    for (const p of pages) {
      await page.goto(p);
      
      const links = page.locator('a[href^="/"]:not([target="_blank"])');
      const count = await links.count();
      
      for (let i = 0; i < Math.min(count, 50); i++) {
        const href = await links.nth(i).getAttribute('href');
        if (href) {
          const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
          if (response && !response.ok()) {
            brokenLinks.push(`${p} -> ${href} (${response.status()})`);
          }
        }
      }
    }

    expect(brokenLinks).toEqual([]);
  });

  test('should display the correct version in footer', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    await expect(footer).toContainText(/(v\d+\.\d+\.\d+|2\.1\.\d+)/);
  });

  test('code examples should be copyable', async ({ page }) => {
    await page.goto('/cli/');
    
    const codeBlock = page.locator('pre').first();
    await expect(codeBlock).toBeVisible();
    
    const copyButton = codeBlock.locator('button.copy').or(page.locator('button[title*="Copy"]'));
    if (await copyButton.isVisible()) {
      await expect(copyButton).toBeAttached();
    }
  });

  test('should responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const menuButton = page.locator('.VPNavBarMenuButton, .mobile-menu');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      const sidebar = page.locator('.VPSidebar');
      await expect(sidebar).toBeVisible();
    }
  });
});
