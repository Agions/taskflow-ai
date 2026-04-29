/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { BuiltInTools } from '../built-in-tools';

import { ToolDefinition, ToolCategories } from '../../types/tool';

describe('BuiltInTools', () => {
  let builtInTools: BuiltInTools;

  beforeEach(() => {
    builtInTools = new BuiltInTools();
  });

  describe('Filesystem Tools', () => {
    it('should have fs_read tool', () => {
      const tool = builtInTools.getTool('fs_read');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.FILESYSTEM);
    });

    it('should have fs_write tool', () => {
      const tool = builtInTools.getTool('fs_write');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.FILESYSTEM);
    });

    it('should have fs_list tool', () => {
      const tool = builtInTools.getTool('fs_list');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.FILESYSTEM);
    });
  });

  describe('Shell Tools', () => {
    it('should have shell_exec tool', () => {
      const tool = builtInTools.getTool('shell_exec');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.SHELL);
    });
  });

  describe('HTTP Tools', () => {
    it('should have http_get tool', () => {
      const tool = builtInTools.getTool('http_get');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.HTTP);
    });

    it('should have http_post tool', () => {
      const tool = builtInTools.getTool('http_post');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.HTTP);
    });
  });

  describe('Git Tools', () => {
    it('should have git_status tool', () => {
      const tool = builtInTools.getTool('git_status');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.GIT);
    });

    it('should have git_commit tool', () => {
      const tool = builtInTools.getTool('git_commit');
      expect(tool).toBeDefined();
      expect(tool?.category).toBe(ToolCategories.GIT);
    });
  });

  describe('Tool Query', () => {
    it('should get all tools', () => {
      const tools = builtInTools.getAllTools();
      expect(tools.length).toBeGreaterThan(10);
    });

    it('should get tools by category', () => {
      const fsTools = builtInTools.getToolsByCategory(ToolCategories.FILESYSTEM);
      expect(fsTools.length).toBeGreaterThan(0);
    });
  });
});
