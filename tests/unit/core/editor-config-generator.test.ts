/**
 * EditorConfigGenerator单元测试
 */

import fs from 'fs-extra';
import path from 'path';
import { EditorConfigGenerator, EditorVariables } from '../../../src/core/templates/editor-config-generator';
import { EditorConfigTestUtils } from '../../setup';

describe('EditorConfigGenerator', () => {
  let configGenerator: EditorConfigGenerator;
  let tempDir: string;
  let projectDir: string;
  let testVariables: EditorVariables;

  beforeEach(() => {
    tempDir = EditorConfigTestUtils.createTempDir('editor-config-');
    projectDir = path.join(tempDir, 'project');

    fs.ensureDirSync(projectDir);

    configGenerator = new EditorConfigGenerator();

    testVariables = {
      PROJECT_NAME: 'test-project',
      PROJECT_TYPE: 'Web Application',
      PROJECT_DESCRIPTION: 'A test project for unit testing',
      DATE: '2024-01-01',
      VERSION: '1.0.0',
      TYPESCRIPT: true,
      REACT: true,
      JEST: true,
      PORT: 3000
    };
  });

  afterEach(() => {
    EditorConfigTestUtils.cleanupTempDir(tempDir);
  });

  describe('基本配置生成功能', () => {
    it('应该成功生成Cursor配置', async () => {
      await configGenerator.generateEditorConfig(projectDir, 'cursor', testVariables);

      // 验证.cursor-rules文件是否创建
      const cursorRulesPath = path.join(projectDir, '.cursor-rules');
      expect(fs.existsSync(cursorRulesPath)).toBe(true);

      // 验证文件内容包含项目信息
      const content = fs.readFileSync(cursorRulesPath, 'utf-8');
      expect(content).toContain('test-project');
    });

    it('应该成功生成VSCode配置', async () => {
      await configGenerator.generateEditorConfig(projectDir, 'vscode', testVariables);

      // 验证VSCode配置目录和文件是否创建
      const vscodeDir = path.join(projectDir, '.vscode');
      expect(fs.existsSync(vscodeDir)).toBe(true);
      expect(fs.existsSync(path.join(vscodeDir, 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(vscodeDir, 'launch.json'))).toBe(true);
    });

    it('应该成功生成Windsurf配置', async () => {
      await configGenerator.generateEditorConfig(projectDir, 'windsurf', testVariables);

      // 验证Windsurf配置文件是否创建
      const windsurfDir = path.join(projectDir, '.windsurf');
      expect(fs.existsSync(windsurfDir)).toBe(true);
      expect(fs.existsSync(path.join(windsurfDir, 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(windsurfDir, 'mcp.json'))).toBe(true);
      expect(fs.existsSync(path.join(windsurfDir, 'ai-config.json'))).toBe(true);
    });

    it('应该成功生成Trae配置', async () => {
      await configGenerator.generateEditorConfig(projectDir, 'trae', testVariables);

      // 验证Trae配置文件是否创建
      const traeDir = path.join(projectDir, '.trae');
      expect(fs.existsSync(traeDir)).toBe(true);
      expect(fs.existsSync(path.join(traeDir, 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(traeDir, 'mcp.json'))).toBe(true);
      expect(fs.existsSync(path.join(traeDir, 'workflows.json'))).toBe(true);
    });

    it('应该处理不支持的编辑器类型', async () => {
      await expect(
        configGenerator.generateEditorConfig(projectDir, 'unsupported-editor', testVariables)
      ).rejects.toThrow('不支持的编辑器类型');
    });
  });

  describe('批量配置生成', () => {
    it('应该生成所有编辑器配置', async () => {
      const editors = ['windsurf', 'trae', 'cursor', 'vscode'];

      await configGenerator.generateAllConfigs(projectDir, testVariables, editors);

      // 验证所有编辑器配置都被创建
      expect(fs.existsSync(path.join(projectDir, '.windsurf', 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.trae', 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.cursor-rules'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.vscode', 'settings.json'))).toBe(true);
    });

    it('应该处理部分编辑器配置失败的情况', async () => {
      const editors = ['cursor', 'invalid-editor', 'vscode'];

      // 应该不抛出错误，而是跳过无效的编辑器
      await expect(
        configGenerator.generateAllConfigs(projectDir, testVariables, editors)
      ).resolves.not.toThrow();

      // 验证有效的编辑器配置仍然被创建
      expect(fs.existsSync(path.join(projectDir, '.cursor-rules'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.vscode', 'settings.json'))).toBe(true);
    });

    it('应该使用默认编辑器列表', async () => {
      await configGenerator.generateAllConfigs(projectDir, testVariables);

      // 验证默认编辑器配置被创建
      expect(fs.existsSync(path.join(projectDir, '.windsurf', 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.trae', 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.cursor-rules'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.vscode', 'settings.json'))).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('应该处理文件写入错误', async () => {
      // 模拟文件写入错误
      const writeFileSpy = jest.spyOn(fs, 'writeFile').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(
        configGenerator.generateEditorConfig(projectDir, 'cursor', testVariables)
      ).rejects.toThrow();

      writeFileSpy.mockRestore();
    });

    it('应该处理目录创建错误', async () => {
      const invalidProjectDir = '/invalid/path/that/cannot/be/created';

      await expect(
        configGenerator.generateEditorConfig(invalidProjectDir, 'cursor', testVariables)
      ).rejects.toThrow();
    });

    it('应该处理变量缺失的情况', async () => {
      const incompleteVariables: EditorVariables = {
        PROJECT_NAME: 'Incomplete Project',
        PROJECT_TYPE: 'Test',
        DATE: '2024-01-01',
        VERSION: '1.0.0'
      };

      // 应该不抛出错误，使用默认值或跳过缺失的变量
      await expect(
        configGenerator.generateEditorConfig(projectDir, 'cursor', incompleteVariables)
      ).resolves.not.toThrow();
    });
  });
});
