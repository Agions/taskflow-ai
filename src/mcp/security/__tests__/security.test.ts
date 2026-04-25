/**
 * MCP Security Module Tests - TaskFlow AI v4.0
 */

import type { SecuritySettings, SecurityContext, RateLimitData, SecurityStats } from '../types';

describe('Security Types', () => {
  describe('SecuritySettings', () => {
    it('should create valid settings', () => {
      const s: SecuritySettings = {
        authRequired: true,
        allowedOrigins: ['http://localhost:3000'],
        rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
        sandbox: { enabled: true, timeout: 30000, memoryLimit: 512 },
      };
      expect(s.authRequired).toBe(true);
      expect(s.rateLimit.maxRequests).toBe(100);
    });
  });

  describe('SecurityContext', () => {
    it('should create with optional userId', () => {
      const ctx: SecurityContext = {
        userId: 'user-1',
        permissions: ['read', 'write'],
        origin: 'http://localhost',
        timestamp: Date.now(),
      };
      expect(ctx.permissions).toHaveLength(2);
    });

    it('should work without optional fields', () => {
      const ctx: SecurityContext = { permissions: [], timestamp: Date.now() };
      expect(ctx.userId).toBeUndefined();
    });
  });

  describe('RateLimitData', () => {
    it('should create valid data', () => {
      const d: RateLimitData = { count: 5, resetTime: Date.now() + 60000 };
      expect(d.count).toBe(5);
    });
  });

  describe('SecurityStats', () => {
    it('should create valid stats', () => {
      const stats: SecurityStats = {
        rateLimitEntries: 10,
        blacklistedIPs: 2,
        allowedTokens: 5,
        settings: { authRequired: true, rateLimitEnabled: true, sandboxEnabled: false },
      };
      expect(stats.blacklistedIPs).toBe(2);
    });
  });
});

describe('Security Modules', () => {
  it('AuthManager should be importable', async () => {
    const mod = await import('../auth');
    expect(mod.AuthManager).toBeDefined();
  });

  it('RateLimiter should be importable', async () => {
    const mod = await import('../rate-limiter');
    expect(mod.RateLimiter).toBeDefined();
  });

  it('IPFilter should be importable', async () => {
    const mod = await import('../ip-filter');
    expect(mod.IPFilter).toBeDefined();
  });

  it('sandbox module should be importable', async () => {
    const mod = await import('../sandbox');
    expect(mod).toBeDefined();
  });

  it('validateCommand should be importable', async () => {
    const mod = await import('../validator');
    expect(mod.validateCommand).toBeDefined();
    expect(typeof mod.validateCommand).toBe('function');
  });
});
