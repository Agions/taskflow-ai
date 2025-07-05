/**
 * 类型安全错误处理系统单元测试
 */

import {
  TaskFlowError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  FileSystemError,
  APIError,
  ParseError,
  PerformanceError,
  ErrorHandler,
  createSuccess,
  createFailure,
  safeExecute
} from '../../../../src/core/error-handling/typed-errors';

describe('TypedErrors Unit Tests', () => {
  describe('TaskFlowError', () => {
    it('应该创建基础错误实例', () => {
      const error = new TaskFlowError('测试错误', 'TEST_ERROR', { source: 'test-source' });
      
      expect(error.message).toBe('测试错误');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context.source).toBe('test-source');
      expect(error.context.timestamp).toBeDefined();
      expect(error.name).toBe('TaskFlowError');
    });

    it('应该包含详细上下文信息', () => {
      const details = { userId: '123', action: 'test' };
      const error = new TaskFlowError('测试错误', 'TEST_ERROR', 'test-source', details);
      
      expect(error.context.details).toEqual(details);
    });

    it('应该正确序列化为JSON', () => {
      const error = new TaskFlowError('测试错误', 'TEST_ERROR', 'test-source');
      const json = error.toJSON();
      
      expect(json.name).toBe('TaskFlowError');
      expect(json.message).toBe('测试错误');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.context).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('应该创建验证错误', () => {
      const error = new ValidationError('字段验证失败', 'username', 'invalid-value');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context.details?.field).toBe('username');
      expect(error.context.details?.value).toBe('invalid-value');
    });
  });

  describe('ConfigurationError', () => {
    it('应该创建配置错误', () => {
      const error = new ConfigurationError('配置项缺失', 'api.key');
      
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.context.details?.configKey).toBe('api.key');
      expect(error.context.details?.suggestion).toContain('configuration');
    });
  });

  describe('NetworkError', () => {
    it('应该创建网络错误', () => {
      const error = new NetworkError('连接超时', 'https://api.example.com', 500);
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.context.details?.url).toBe('https://api.example.com');
      expect(error.context.details?.statusCode).toBe(500);
      expect(error.context.details?.retryable).toBe(true);
    });

    it('应该正确设置重试标志', () => {
      const retryableError = new NetworkError('服务器错误', 'https://api.example.com', 500);
      const nonRetryableError = new NetworkError('客户端错误', 'https://api.example.com', 400);
      
      expect(retryableError.context.details?.retryable).toBe(true);
      expect(nonRetryableError.context.details?.retryable).toBe(true); // 默认为true
    });
  });

  describe('FileSystemError', () => {
    it('应该创建文件系统错误', () => {
      const error = new FileSystemError('文件不存在', '/path/to/file', 'read');
      
      expect(error.code).toBe('FILESYSTEM_ERROR');
      expect(error.context.details?.path).toBe('/path/to/file');
      expect(error.context.details?.operation).toBe('read');
    });
  });

  describe('APIError', () => {
    it('应该创建API错误', () => {
      const error = new APIError('API调用失败', 'deepseek', 429);
      
      expect(error.code).toBe('API_ERROR');
      expect(error.context.details?.provider).toBe('deepseek');
      expect(error.context.details?.statusCode).toBe(429);
      expect(error.context.details?.retryable).toBe(false);
    });
  });

  describe('ParseError', () => {
    it('应该创建解析错误', () => {
      const error = new ParseError('JSON解析失败', 'json', 10);
      
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.context.details?.format).toBe('json');
      expect(error.context.details?.line).toBe(10);
    });
  });

  describe('PerformanceError', () => {
    it('应该创建性能错误', () => {
      const error = new PerformanceError('操作超时', 'database-query', 5000, 3000);
      
      expect(error.code).toBe('PERFORMANCE_ERROR');
      expect(error.context.details?.operation).toBe('database-query');
      expect(error.context.details?.duration).toBe(5000);
      expect(error.context.details?.threshold).toBe(3000);
    });
  });

  describe('ErrorHandler', () => {
    describe('handleUnknownError', () => {
      it('应该处理TaskFlowError实例', () => {
        const originalError = new ValidationError('验证失败', 'field');
        const handled = ErrorHandler.handleUnknownError(originalError, 'test');
        
        expect(handled).toBe(originalError);
      });

      it('应该处理标准Error实例', () => {
        const originalError = new Error('标准错误');
        const handled = ErrorHandler.handleUnknownError(originalError, 'test');
        
        expect(handled).toBeInstanceOf(TaskFlowError);
        expect(handled.message).toBe('标准错误');
        expect(handled.code).toBe('UNKNOWN_ERROR');
        expect(handled.context.source).toBe('test');
      });

      it('应该处理字符串错误', () => {
        const handled = ErrorHandler.handleUnknownError('字符串错误', 'test');
        
        expect(handled).toBeInstanceOf(TaskFlowError);
        expect(handled.message).toBe('字符串错误');
        expect(handled.code).toBe('STRING_ERROR');
      });

      it('应该处理未知类型错误', () => {
        const handled = ErrorHandler.handleUnknownError({ unknown: 'object' }, 'test');
        
        expect(handled).toBeInstanceOf(TaskFlowError);
        expect(handled.code).toBe('UNKNOWN_ERROR');
        expect(handled.context.details?.errorType).toBe('object');
      });
    });

    describe('isRetryable', () => {
      it('应该正确识别可重试错误', () => {
        const retryableError = new NetworkError('网络错误', 'url', 500);
        const nonRetryableError = new ValidationError('验证错误', 'field');
        
        expect(ErrorHandler.isRetryable(retryableError)).toBe(true);
        expect(ErrorHandler.isRetryable(nonRetryableError)).toBe(false);
      });
    });

    describe('getSeverity', () => {
      it('应该返回正确的严重程度', () => {
        const criticalError = new FileSystemError('文件系统错误', 'path', 'read');
        const highError = new NetworkError('网络错误', 'url');
        const mediumError = new ValidationError('验证错误', 'field');
        const lowError = new TaskFlowError('一般错误', 'GENERAL', 'test');
        
        expect(ErrorHandler.getSeverity(criticalError)).toBe('critical');
        expect(ErrorHandler.getSeverity(highError)).toBe('high');
        expect(ErrorHandler.getSeverity(mediumError)).toBe('medium');
        expect(ErrorHandler.getSeverity(lowError)).toBe('low');
      });
    });

    describe('formatUserMessage', () => {
      it('应该格式化用户友好的错误消息', () => {
        const error = new ConfigurationError('配置错误', 'api.key');
        const message = ErrorHandler.formatUserMessage(error);
        
        expect(message).toContain('配置错误');
        expect(message).toContain('💡 建议:');
      });

      it('应该处理没有建议的错误', () => {
        const error = new TaskFlowError('简单错误', 'SIMPLE', 'test');
        const message = ErrorHandler.formatUserMessage(error);
        
        expect(message).toBe('简单错误');
      });
    });

    describe('createErrorReport', () => {
      it('应该创建完整的错误报告', () => {
        const error = new ValidationError('验证错误', 'field');
        const report = ErrorHandler.createErrorReport(error);
        
        expect(report.id).toMatch(/^err_\d+_[a-z0-9]+$/);
        expect(report.timestamp).toBeDefined();
        expect(report.severity).toBe('medium');
        expect(report.retryable).toBe(false);
        expect(report.error).toBeDefined();
        expect(report.environment).toBeDefined();
        expect(report.environment.nodeVersion).toBeDefined();
      });
    });
  });

  describe('Result类型', () => {
    describe('createSuccess', () => {
      it('应该创建成功结果', () => {
        const result = createSuccess('test-data');
        
        expect(result.success).toBe(true);
        expect(result.data).toBe('test-data');
      });
    });

    describe('createFailure', () => {
      it('应该创建失败结果', () => {
        const error = new ValidationError('验证失败', 'field');
        const result = createFailure(error);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('safeExecute', () => {
    it('应该返回成功结果当操作成功时', async () => {
      const operation = async () => 'success-data';
      const result = await safeExecute(operation, 'test');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success-data');
      }
    });

    it('应该返回失败结果当操作抛出异常时', async () => {
      const operation = async () => {
        throw new Error('操作失败');
      };
      const result = await safeExecute(operation, 'test');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(TaskFlowError);
        expect(result.error.message).toBe('操作失败');
      }
    });

    it('应该处理同步操作', async () => {
      const operation = async () => {
        return 42;
      };
      const result = await safeExecute(operation, 'test');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });
  });

  describe('错误继承', () => {
    it('应该正确继承Error类', () => {
      const error = new ValidationError('测试', 'field');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof TaskFlowError).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it('应该有正确的错误堆栈', () => {
      const error = new ValidationError('测试', 'field');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });

  describe('边界情况', () => {
    it('应该处理null和undefined值', () => {
      const nullError = ErrorHandler.handleUnknownError(null, 'test');
      const undefinedError = ErrorHandler.handleUnknownError(undefined, 'test');

      expect(nullError).toBeInstanceOf(TaskFlowError);
      expect(undefinedError).toBeInstanceOf(TaskFlowError);
    });

    it('应该处理空字符串错误', () => {
      const error = ErrorHandler.handleUnknownError('', 'test');

      expect(error.message).toBe('');
      expect(error.code).toBe('STRING_ERROR');
    });

    it('应该处理数字错误', () => {
      const error = ErrorHandler.handleUnknownError(404, 'test');

      expect(error.message).toBe('404');
      expect(error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
