/**
 * 错误处理器测试
 */

import { ErrorHandler } from '../error-handler';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler();
  });

  describe('record', () => {
    it('should record an error with string message', () => {
      const error = handler.record('Something went wrong', 'unknown');

      expect(error.id).toMatch(/^err-/);
      expect(error.message).toBe('Something went wrong');
      expect(error.type).toBe('unknown');
      expect(error.retryCount).toBe(0);
    });

    it('should record an error with Error object', () => {
      const originalError = new Error('Network failed');
      const error = handler.record(originalError, 'network');

      expect(error.message).toBe('Network failed');
      expect(error.type).toBe('network');
    });

    it('should parse stack trace for location', () => {
      try {
        throw new Error('Test error');
      } catch (e: unknown) {
        const error = handler.record(e as Error, 'execution');
        // Stack should be present
        expect(error.stack).toBeDefined();
      }
    });

    it('should include optional context', () => {
      const error = handler.record('Failed', 'execution', {
        taskId: 'task-123',
        chainId: 'chain-456',
        context: { key: 'value' },
      });

      expect(error.taskId).toBe('task-123');
      expect(error.chainId).toBe('chain-456');
      expect(error.context?.key).toBe('value');
    });
  });

  describe('classify', () => {
    it('should classify network errors', () => {
      expect(handler.classify(new Error('fetch failed'))).toBe('network');
      expect(handler.classify('ECONNREFUSED')).toBe('network');
    });

    it('should classify timeout errors', () => {
      expect(handler.classify(new Error('Request timeout'))).toBe('timeout');
      expect(handler.classify('ETIMEDOUT')).toBe('timeout');
    });

    it('should classify rate limit errors', () => {
      expect(handler.classify(new Error('Rate limit exceeded'))).toBe('rate_limit');
      expect(handler.classify('429 Too Many Requests')).toBe('rate_limit');
    });

    it('should classify auth errors', () => {
      expect(handler.classify(new Error('Unauthorized'))).toBe('auth');
      expect(handler.classify('401 Forbidden')).toBe('auth');
    });

    it('should classify quota errors', () => {
      expect(handler.classify(new Error('Insufficient quota'))).toBe('quota');
    });

    it('should classify invalid input errors', () => {
      expect(handler.classify(new Error('Invalid input'))).toBe('invalid_input');
      expect(handler.classify('400 Bad Request')).toBe('invalid_input');
    });
  });

  describe('isRetryable', () => {
    it('should identify retryable errors', () => {
      expect(handler.isRetryable('network')).toBe(true);
      expect(handler.isRetryable('timeout')).toBe(true);
      expect(handler.isRetryable('rate_limit')).toBe(true);
      expect(handler.isRetryable('quota')).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(handler.isRetryable('auth')).toBe(false);
      expect(handler.isRetryable('invalid_input')).toBe(false);
      expect(handler.isRetryable('execution')).toBe(false);
    });
  });

  describe('retryWithRecovery', () => {
    it('should return result on success', async () => {
      const operation = async () => 'success';
      const result = await handler.retryWithRecovery(operation);

      expect(result.result).toBe('success');
      expect(result.error).toBeUndefined();
      expect(result.attempts).toBe(1);
    });

    it('should retry on failure and succeed', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) throw new Error('timeout error');
        return 'success';
      };

      const result = await handler.retryWithRecovery(operation, { maxRetries: 3 });

      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
    });

    it('should return error after max retries', async () => {
      const operation = async () => {
        throw new Error('network failure');
      };

      const result = await handler.retryWithRecovery(operation, { maxRetries: 2 });

      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(3); // initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const operation = async () => {
        throw new Error('Auth error');
      };

      const result = await handler.retryWithRecovery(operation, { maxRetries: 3 });

      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(1); // no retry for auth errors
    });

    it('should call onRetry callback', async () => {
      let retryCount = 0;
      const operation = async () => {
        throw new Error('timeout');
      };

      await handler.retryWithRecovery(operation, { maxRetries: 2 }, () => retryCount++);

      expect(retryCount).toBe(2);
    });
  });

  describe('getHistory', () => {
    it('should return all errors by default', () => {
      handler.record('Error 1', 'unknown');
      handler.record('Error 2', 'unknown');

      const history = handler.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        handler.record(`Error ${i}`, 'unknown');
      }

      const history = handler.getHistory(3);
      expect(history).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    it('should aggregate error statistics', () => {
      handler.record('Error 1', 'network');
      handler.record('Error 2', 'network');
      handler.record('Error 3', 'timeout');

      const stats = handler.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.network).toBe(2);
      expect(stats.byType.timeout).toBe(1);
    });

    it('should count retryable vs non-retryable', () => {
      handler.record('Error 1', 'network'); // retryable
      handler.record('Error 2', 'auth'); // non-retryable

      const stats = handler.getStats();

      expect(stats.retryable).toBe(1);
      expect(stats.nonRetryable).toBe(1);
    });
  });

  describe('generateErrorReport', () => {
    it('should generate formatted error report', () => {
      const error = handler.record('Test error', 'network', { taskId: 'task-123' });

      const report = handler.generateErrorReport(error);

      expect(report).toContain('❌ 错误报告');
      expect(report).toContain('🌐 网络错误');
      expect(report).toContain('task-123');
    });
  });

  describe('clear', () => {
    it('should clear error history', () => {
      handler.record('Error 1', 'unknown');
      handler.clear();

      const stats = handler.getStats();
      expect(stats.total).toBe(0);
    });
  });
});
