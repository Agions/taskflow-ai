import { ErrorHandler, ErrorSeverity, ErrorContext } from './error-handler';
import { Logger } from '../../utils/logger';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  } as Logger;

  beforeEach(() => {
    errorHandler = new ErrorHandler(mockLogger, false);
  });

  it('should handle error', async () => {
    const error = new Error('Test error');
    const context: ErrorContext = {
      operation: 'test-operation',
      metadata: { testData: 'value' }
    };

    const handled = await errorHandler.handle(error, context);

    expect(handled).toBeDefined();
    expect(handled.message).toBe('Test error');
  });

  it('should handle error with custom severity', async () => {
    const error = new Error('Critical error');
    const context: ErrorContext = {
      operation: 'critical-operation',
      severity: ErrorSeverity.CRITICAL
    };

    await errorHandler.handle(error, context);

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should track error history', async () => {
    const error1 = new Error('Error 1');
    const error2 = new Error('Error 2');

    await errorHandler.handle(error1, { operation: 'op1' });
    await errorHandler.handle(error2, { operation: 'op2' });

    const history = errorHandler.getErrorHistory();
    expect(history).toHaveLength(2);
  });

  it('should clear error history', async () => {
    const error = new Error('Test error');
    await errorHandler.handle(error, { operation: 'test' });

    errorHandler.clearHistory();

    const history = errorHandler.getErrorHistory();
    expect(history).toHaveLength(0);
  });

  it('should get error stats', async () => {
    await errorHandler.handle(new Error('Error 1'), { operation: 'op1' });
    await errorHandler.handle(new Error('Error 2'), { operation: 'op2' });
    await errorHandler.handle(new Error('Error 3'), { operation: 'op1' });

    const stats = errorHandler.getErrorStats();
    expect(stats.totalErrors).toBe(3);
    expect(stats.errorsByOperation.op1).toBe(2);
    expect(stats.errorsByOperation.op2).toBe(1);
  });
});
