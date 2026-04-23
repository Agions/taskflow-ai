import { Logger, LogLevel } from './logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = Logger.getInstance('test-logger');
    logger.setLevel(LogLevel.DEBUG);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log debug message', () => {
    logger.debug('Debug message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log info message', () => {
    logger.info('Info message', { data: 'test' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log warning message', () => {
    logger.warn('Warning message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log error message', () => {
    logger.error('Error message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should filter messages below log level', () => {
    logger.setLevel(LogLevel.ERROR);

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Only error should be logged
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('should respect context', () => {
    const contextLogger = Logger.getInstance('context', { userId: '123' });

    contextLogger.info('Message with context');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('userId'),
      expect.anything()
    );
  });
});
