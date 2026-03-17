/**
 * MCP 工具测试
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { fileTools, shellTools, taskTools } from '../built-in';
import { filesystemTools } from '../filesystem';
import { httpTools } from '../http';
import { databaseTools } from '../database';
import { memoryTools } from '../memory';
import { codeTools } from '../code';
import { gitTools } from '../git';

describe('MCP Tools', () => {
  describe('Built-in Tools', () => {
    it('should have file_tools', () => {
      expect(fileTools).toBeDefined();
      expect(Array.isArray(fileTools)).toBe(true);
      expect(fileTools.length).toBeGreaterThan(0);
    });

    it('should have shell_tools', () => {
      expect(shellTools).toBeDefined();
      expect(Array.isArray(shellTools)).toBe(true);
    });

    it('should have task_tools', () => {
      expect(taskTools).toBeDefined();
      expect(Array.isArray(taskTools)).toBe(true);
    });
  });

  describe('FileSystem Tools', () => {
    it('should have filesystem tools', () => {
      expect(filesystemTools).toBeDefined();
      expect(Array.isArray(filesystemTools)).toBe(true);
      expect(filesystemTools.length).toBeGreaterThan(0);
    });

    it('should have valid tool definitions', () => {
      for (const tool of filesystemTools) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      }
    });

    it('should have category set', () => {
      for (const tool of filesystemTools) {
        expect(tool.category).toBe('filesystem');
      }
    });
  });

  describe('HTTP Tools', () => {
    it('should have http tools', () => {
      expect(httpTools).toBeDefined();
      expect(Array.isArray(httpTools)).toBe(true);
      expect(httpTools.length).toBeGreaterThan(0);
    });

    it('should have http_request tool', () => {
      const httpRequest = httpTools.find(t => t.name === 'http_request');
      expect(httpRequest).toBeDefined();
      expect(httpRequest?.inputSchema.properties.url).toBeDefined();
      expect(httpRequest?.inputSchema.properties.method).toBeDefined();
    });

    it('should support common HTTP methods', () => {
      const httpRequest = httpTools.find(t => t.name === 'http_request');
      const methods = httpRequest?.inputSchema.properties.method.enum as string[];
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PUT');
      expect(methods).toContain('DELETE');
    });
  });

  describe('Database Tools', () => {
    it('should have database tools', () => {
      expect(databaseTools).toBeDefined();
      expect(Array.isArray(databaseTools)).toBe(true);
    });

    it('should have query tool', () => {
      const queryTool = databaseTools.find(t => t.name === 'db_query');
      expect(queryTool).toBeDefined();
      expect(queryTool?.inputSchema.properties.dbPath).toBeDefined();
      expect(queryTool?.inputSchema.properties.sql).toBeDefined();
    });
  });

  describe('Memory Tools', () => {
    it('should have memory tools', () => {
      expect(memoryTools).toBeDefined();
      expect(Array.isArray(memoryTools)).toBe(true);
      expect(memoryTools.length).toBeGreaterThan(0);
    });

    it('should have CRUD operations', () => {
      const names = memoryTools.map(t => t.name);
      expect(names).toContain('memory_set');
      expect(names).toContain('memory_get');
      expect(names).toContain('memory_delete');
      expect(names).toContain('memory_list');
      expect(names).toContain('memory_clear');
    });
  });

  describe('Code Tools', () => {
    it('should have code tools', () => {
      expect(codeTools).toBeDefined();
      expect(Array.isArray(codeTools)).toBe(true);
    });

    it('should support multiple languages', () => {
      const executeTool = codeTools.find(t => t.name === 'code_execute');
      expect(executeTool).toBeDefined();
      const languages = executeTool?.inputSchema.properties.language.enum as string[];
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('node');
    });
  });

  describe('Git Tools', () => {
    it('should have git tools', () => {
      expect(gitTools).toBeDefined();
      expect(Array.isArray(gitTools)).toBe(true);
    });

    it('should have common git operations', () => {
      const names = gitTools.map(t => t.name);
      expect(names).toContain('git_status');
      expect(names).toContain('git_log');
      expect(names).toContain('git_branch');
      expect(names).toContain('git_commit');
      expect(names).toContain('git_push');
      expect(names).toContain('git_pull');
    });
  });

  describe('Shell Tools', () => {
    it('should have shell tools', () => {
      expect(shellTools).toBeDefined();
      expect(Array.isArray(shellTools)).toBe(true);
    });

    it('should have exec tool', () => {
      const execTool = shellTools.find(t => t.name === 'shell_exec');
      expect(execTool).toBeDefined();
      expect(execTool?.inputSchema.properties.command).toBeDefined();
    });
  });

  describe('Tool Schema Validation', () => {
    it('all tools should have unique names', () => {
      const allTools = [
        ...fileTools,
        ...shellTools,
        ...taskTools,
        ...filesystemTools,
        ...httpTools,
        ...databaseTools,
        ...memoryTools,
        ...codeTools,
        ...gitTools,
      ];
      
      const names = allTools.map(t => t.name);
      const uniqueNames = new Set(names);
      
      expect(names.length).toBe(uniqueNames.size);
    });

    it('all tools should have proper input schema', () => {
      const allTools = [
        ...filesystemTools,
        ...httpTools,
        ...memoryTools,
        ...codeTools,
        ...gitTools,
      ];
      
      for (const tool of allTools) {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });
  });
});
