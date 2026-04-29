import { Logger, LogLevel } from '../../logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    Logger.reset();
    logger = Logger.getInstance('test-logger');
    logger.setLevel(LogLevel.DEBUG);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    Logger.reset();
  });

  it('should log debug message', () => {
    logger.debug('Debug message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log info message', () => {
    logger.info('Info message', { data: 'test' });
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log warning message', () => {
    logger.warn('Warning message');
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should log error message', () => {
    logger.error('Error message');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should filter messages below log level', () => {
    logger.setLevel(LogLevel.ERROR);

    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Only error should be logged
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledTimes(0);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
  });

  it('should respect context', () => {
    const contextLogger = Logger.getInstance('context-test', { userId: '123' });

    contextLogger.info('Message with context');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('userId')
    );
  });
});
