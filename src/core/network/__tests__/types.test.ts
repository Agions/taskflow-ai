/**
 * Network Module Tests - Rate Limiter & Retry Handler
 * TaskFlow AI v4.0
 */

import { RateLimiter } from '../rate-limiter';
import type { RateLimitConfig, RateLimitOptions } from '../rate-limiter';
import { RetryHandler } from '../retry';
import type { RetryOptions } from '../retry';

describe('Network Module', () => {
  describe('RateLimiter', () => {
    it('should create with defaults', () => {
      const limiter = new RateLimiter();
      expect(limiter).toBeDefined();
    });

    it('should create with custom options', () => {
      const options: RateLimitOptions = {
        defaultRpm: 100,
        defaultRps: 20,
        enableQueue: false,
      };
      const limiter = new RateLimiter(options);
      expect(limiter).toBeDefined();
    });

    it('should set and get limits', () => {
      const limiter = new RateLimiter({ defaultRpm: 60, defaultRps: 10 });
      limiter.setLimit('openai', { rpm: 100, rps: 20 });
      const limit = limiter.getLimit('openai');
      expect(limit.rpm).toBe(100);
      expect(limit.rps).toBe(20);
    });

    it('should return default limits for unknown provider', () => {
      const limiter = new RateLimiter({ defaultRpm: 30, defaultRps: 5 });
      const limit = limiter.getLimit('unknown');
      expect(limit.rpm).toBe(30);
      expect(limit.rps).toBe(5);
    });

    it('should acquire when under limit', () => {
      const limiter = new RateLimiter({ defaultRpm: 100, defaultRps: 50 });
      expect(limiter.tryAcquire('test')).toBe(true);
    });

    it('should initialize limits from options', () => {
      const limiter = new RateLimiter({
        limits: {
          openai: { rpm: 60, rps: 10 },
          claude: { rpm: 40, rps: 5 },
        },
      });
      expect(limiter.getLimit('openai').rpm).toBe(60);
      expect(limiter.getLimit('claude').rpm).toBe(40);
    });
  });

  describe('RetryHandler', () => {
    it('should create with defaults', () => {
      const handler = new RetryHandler();
      expect(handler).toBeDefined();
    });

    it('should create with custom options', () => {
      const options: RetryOptions = {
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 60000,
        backoff: 'linear',
        jitter: false,
      };
      const handler = new RetryHandler(options);
      expect(handler).toBeDefined();
    });

    it('should execute successful function', async () => {
      const handler = new RetryHandler({ maxRetries: 2 });
      const result = await handler.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should retry on failure and succeed', async () => {
      const handler = new RetryHandler({
        maxRetries: 3,
        initialDelay: 10,
        backoff: 'fixed',
      });
      let attempts = 0;
      const result = await handler.execute(() => {
        attempts++;
        if (attempts < 3) throw { code: 'ECONNRESET', status: 503 };
        return Promise.resolve('ok');
      });
      expect(result).toBe('ok');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const handler = new RetryHandler({
        maxRetries: 1,
        initialDelay: 10,
        backoff: 'fixed',
      });
      await expect(
        handler.execute(() => Promise.reject({ code: 'ECONNRESET' }))
      ).rejects.toBeDefined();
    });

    it('should not retry on non-retryable errors', async () => {
      const handler = new RetryHandler({ maxRetries: 3, initialDelay: 10 });
      let calls = 0;
      await expect(
        handler.execute(() => {
          calls++;
          throw { status: 400, message: 'Bad Request' };
        })
      ).rejects.toBeDefined();
      expect(calls).toBe(1);
    });

    it('should support exponential backoff', () => {
      const handler = new RetryHandler({
        backoff: 'exponential',
        initialDelay: 100,
        maxDelay: 5000,
      });
      expect(handler).toBeDefined();
    });

    it('should support linear backoff', () => {
      const handler = new RetryHandler({
        backoff: 'linear',
        initialDelay: 200,
      });
      expect(handler).toBeDefined();
    });
  });

  describe('Network Exports', () => {
    it('should export RateLimiter and types', async () => {
      const mod = await import('../index');
      expect(mod.RateLimiter).toBeDefined();
      expect(mod.RetryHandler).toBeDefined();
    });
  });
});
