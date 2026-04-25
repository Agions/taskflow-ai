/**
 * Function Call Types Tests
 * TaskFlow AI v4.0
 */

import type {
  FunctionDefinition,
  FunctionCallRequest,
  FunctionCallResponse,
  FunctionCallResult,
  FunctionExecutor,
  StructuredOutputSchema,
  StructuredOutputRequest,
  StructuredOutputResponse,
  FunctionCallingOptions,
  ParallelFunctionCall,
  ParallelFunctionCallResponse,
} from '../types';

describe('Function Call Types', () => {
  describe('FunctionDefinition', () => {
    it('should create a valid definition', () => {
      const def: FunctionDefinition = {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      };
      expect(def.name).toBe('get_weather');
    });
  });

  describe('FunctionCallRequest', () => {
    it('should create a valid request', () => {
      const req: FunctionCallRequest = {
        model: 'gpt-4',
        messages: [
          { role: 'user', content: 'What is the weather?' },
        ],
        functions: [{ name: 'get_weather' }],
        function_call: 'auto',
        temperature: 0.7,
      };
      expect(req.model).toBe('gpt-4');
      expect(req.messages).toHaveLength(1);
    });

    it('should support named function call', () => {
      const req: FunctionCallRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
        function_call: { name: 'get_weather' },
      };
      expect(req.function_call).toEqual({ name: 'get_weather' });
    });
  });

  describe('FunctionCallResponse', () => {
    it('should create stop response', () => {
      const res: FunctionCallResponse = {
        finishReason: 'stop',
        content: 'The weather is sunny',
      };
      expect(res.finishReason).toBe('stop');
    });

    it('should create function_call response', () => {
      const res: FunctionCallResponse = {
        finishReason: 'function_call',
        functionCall: {
          name: 'get_weather',
          arguments: '{"city":"Beijing"}',
          parsedArguments: { city: 'Beijing' },
        },
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
      expect(res.functionCall?.name).toBe('get_weather');
      expect(res.usage?.totalTokens).toBe(15);
    });
  });

  describe('FunctionCallResult', () => {
    it('should create success result', () => {
      const result: FunctionCallResult = {
        success: true,
        functionName: 'get_weather',
        arguments: { city: 'Beijing' },
        result: { temp: 25, condition: 'sunny' },
      };
      expect(result.success).toBe(true);
    });

    it('should create error result', () => {
      const result: FunctionCallResult = {
        success: false,
        functionName: 'invalid',
        arguments: {},
        error: 'Function not found',
      };
      expect(result.error).toBeDefined();
    });
  });

  describe('StructuredOutputSchema', () => {
    it('should create a valid schema', () => {
      const schema: StructuredOutputSchema = {
        name: 'TaskList',
        description: 'List of tasks',
        schema: {
          type: 'object',
          properties: { tasks: { type: 'array' } },
        },
      };
      expect(schema.name).toBe('TaskList');
    });
  });

  describe('FunctionCallingOptions', () => {
    it('should create default options', () => {
      const opts: FunctionCallingOptions = {};
      expect(opts.forceFunctionCall).toBeUndefined();
    });

    it('should support all options', () => {
      const opts: FunctionCallingOptions = {
        functions: [{ name: 'test' }],
        forceFunctionCall: true,
        maxRetries: 5,
        maxFunctionArgsTokens: 1000,
      };
      expect(opts.forceFunctionCall).toBe(true);
      expect(opts.maxRetries).toBe(5);
    });
  });

  describe('ParallelFunctionCall', () => {
    it('should create a valid parallel call', () => {
      const call: ParallelFunctionCall = {
        index: 0,
        id: 'call-1',
        name: 'get_weather',
        arguments: '{"city":"Beijing"}',
      };
      expect(call.index).toBe(0);
    });
  });

  describe('ParallelFunctionCallResponse', () => {
    it('should create a valid response', () => {
      const res: ParallelFunctionCallResponse = {
        finishReason: 'function_call',
        message: 'Calling multiple functions',
        functionCalls: [
          { index: 0, id: 'c1', name: 'f1', arguments: '{}' },
          { index: 1, id: 'c2', name: 'f2', arguments: '{}' },
        ],
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
      };
      expect(res.functionCalls).toHaveLength(2);
    });
  });
});
