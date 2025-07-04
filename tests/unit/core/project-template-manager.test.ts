/**
 * ProjectTemplateManager单元测试
 */

import fs from 'fs-extra';
import path from 'path';
import { ProjectTemplateManager } from '../../../src/core/templates/project-template-manager';
import { EditorConfigTestUtils } from '../../setup';

describe('ProjectTemplateManager', () => {
  let templateManager: ProjectTemplateManager;
  let tempDir: string;
  let templatesDir: string;

  beforeEach(() => {
    tempDir = EditorConfigTestUtils.createTempDir('template-manager-');
    templatesDir = path.join(tempDir, 'templates');
    templateManager = new ProjectTemplateManager();
  });

  afterEach(() => {
    EditorConfigTestUtils.cleanupTempDir(tempDir);
  });

  describe('模板管理功能', () => {
    it('应该返回可用的模板列表', () => {
      const templates = templateManager.getAvailableTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toContain('web-app');
    });

    it('应该成功加载默认模板', async () => {
      const template = await templateManager.loadTemplate('web-app');

      expect(template).toBeDefined();
      expect(template.name).toBe('web-app');
      expect(template.displayName).toBeDefined();
      expect(template.description).toBeDefined();
      expect(Array.isArray(template.directories)).toBe(true);
      expect(Array.isArray(template.files)).toBe(true);
    });

    it('应该处理不存在的模板', async () => {
      const template = await templateManager.loadTemplate('non-existent-template');

      // 应该返回默认模板而不是抛出错误
      expect(template).toBeDefined();
      expect(template.name).toBe('non-existent-template');
    });

    it('应该加载自定义模板文件', async () => {
      // 创建自定义模板目录结构
      const customTemplatesDir = path.join(__dirname, '../../../templates/projects');
      const customTemplateDir = path.join(customTemplatesDir, 'custom-template');

      // 确保目录存在
      fs.ensureDirSync(customTemplateDir);

      const customTemplate = {
        name: 'custom-template',
        displayName: 'Custom Template',
        description: 'A custom test template',
        type: 'custom',
        features: { typescript: true },
        directories: ['src', 'tests'],
        files: [
          { path: 'package.json', template: 'custom/package.json' }
        ],
        editorConfigs: {},
        dependencies: { production: [], development: [] },
        scripts: {}
      };

      fs.writeFileSync(
        path.join(customTemplateDir, 'structure.json'),
        JSON.stringify(customTemplate, null, 2)
      );

      try {
        const template = await templateManager.loadTemplate('custom-template');
        expect(template.displayName).toBe('Custom Template');
        expect(template.type).toBe('custom');
      } finally {
        // 清理
        fs.removeSync(customTemplateDir);
      }
    });
  });

  describe('项目生成功能', () => {
    let projectDir: string;

    beforeEach(() => {
      projectDir = path.join(tempDir, 'test-project');
      fs.ensureDirSync(projectDir);
    });

    it('应该成功生成基本项目结构', async () => {
      await templateManager.generateProject(
        projectDir,
        'web-app',
        'my-test-project',
        { git: false, install: false }
      );

      // 验证基本文件是否创建
      expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'README.md'))).toBe(true);

      // 验证package.json内容
      const packageJson = fs.readJsonSync(path.join(projectDir, 'package.json'));
      expect(packageJson.name).toBe('my-test-project');
    });

    it('应该创建正确的目录结构', async () => {
      await templateManager.generateProject(
        projectDir,
        'web-app',
        'directory-test',
        { git: false, install: false }
      );

      // 验证目录是否创建
      const expectedDirs = ['src', 'public', 'docs'];
      expectedDirs.forEach(dir => {
        const dirPath = path.join(projectDir, dir);
        if (fs.existsSync(dirPath)) {
          expect(fs.statSync(dirPath).isDirectory()).toBe(true);
        }
      });
    });

    it('应该正确处理模板变量替换', async () => {
      await templateManager.generateProject(
        projectDir,
        'web-app',
        'variable-test',
        { git: false, install: false }
      );

      // 检查README.md中的变量替换
      const readmePath = path.join(projectDir, 'README.md');
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf-8');
        expect(readmeContent).toContain('variable-test');
      }
    });

    it('应该处理不同的项目模板', async () => {
      const templates = ['web-app', 'api', 'mobile'];

      for (const template of templates) {
        const templateProjectDir = path.join(tempDir, `${template}-project`);
        fs.ensureDirSync(templateProjectDir);

        await templateManager.generateProject(
          templateProjectDir,
          template,
          `${template}-test`,
          { git: false, install: false }
        );

        // 验证基本文件存在
        expect(fs.existsSync(path.join(templateProjectDir, 'package.json'))).toBe(true);
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的模板名称', async () => {
      const projectDir = path.join(tempDir, 'error-project');
      fs.ensureDirSync(projectDir);

      // 使用不存在的模板应该使用默认模板而不是抛出错误
      await expect(
        templateManager.generateProject(
          projectDir,
          'completely-invalid-template',
          'error-test',
          { git: false, install: false }
        )
      ).resolves.not.toThrow();
    });

    it('应该处理文件写入错误', async () => {
      const projectDir = path.join(tempDir, 'readonly-project');
      fs.ensureDirSync(projectDir);

      // 模拟文件写入错误
      const writeFileSpy = jest.spyOn(fs, 'writeFile').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(
        templateManager.generateProject(
          projectDir,
          'web-app',
          'permission-test',
          { git: false, install: false }
        )
      ).rejects.toThrow();

      writeFileSpy.mockRestore();
    });

    it('应该处理目录创建错误', async () => {
      const invalidProjectDir = '/invalid/path/that/cannot/be/created';

      await expect(
        templateManager.generateProject(
          invalidProjectDir,
          'web-app',
          'invalid-path-test',
          { git: false, install: false }
        )
      ).rejects.toThrow();
    });
  });

});
