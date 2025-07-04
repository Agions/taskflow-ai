/**
 * Init命令集成测试
 * 测试完整的项目初始化工作流程
 */

import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import { EditorConfigGenerator } from '../../src/core/templates/editor-config-generator';
import { ProjectTemplateManager } from '../../src/core/templates/project-template-manager';
import { EditorConfigTestUtils } from '../setup';

const execAsync = promisify(exec);

// 模拟Init命令的核心功能
class InitCommandWrapper {
  private templateManager: ProjectTemplateManager;
  private configGenerator: EditorConfigGenerator;

  constructor(templatesDir: string) {
    this.templateManager = new ProjectTemplateManager();
    this.configGenerator = new EditorConfigGenerator();
  }

  async execute(projectDir: string, options: any) {
    // 检查目录是否存在且不为空
    if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0 && !options.force) {
      throw new Error('Directory is not empty and force option is not set');
    }

    // 生成项目结构
    await this.templateManager.generateProject(
      projectDir,
      options.template,
      options.projectName,
      { git: false, install: false }
    );

    // 生成编辑器配置
    const variables = {
      PROJECT_NAME: options.projectName,
      PROJECT_TYPE: 'Web Application',
      PROJECT_DESCRIPTION: `Generated project: ${options.projectName}`,
      DATE: new Date().toISOString().split('T')[0],
      VERSION: '1.0.0',
      TYPESCRIPT: options.typescript,
      REACT: options.template === 'react-app',
      JEST: options.testing,
      PORT: 3000
    };

    if (options.editors && Array.isArray(options.editors)) {
      await this.configGenerator.generateAllConfigs(projectDir, variables, options.editors);
    }
  }
}

describe('Init Command Integration Tests', () => {
  let tempDir: string;
  let projectDir: string;
  let templatesDir: string;

  beforeEach(() => {
    tempDir = EditorConfigTestUtils.createTempDir('init-integration-');
    projectDir = path.join(tempDir, 'test-project');
    templatesDir = path.join(tempDir, 'templates');

    fs.ensureDirSync(projectDir);
    fs.ensureDirSync(templatesDir);
  });

  afterEach(() => {
    EditorConfigTestUtils.cleanupTempDir(tempDir);
  });

  describe('完整的项目初始化流程', () => {

    it('应该成功初始化项目并生成配置文件', async () => {
      const initCommand = new InitCommandWrapper(templatesDir);

      const options = {
        template: 'web-app',
        editors: ['cursor', 'vscode'],
        projectName: 'my-test-app',
        typescript: true,
        testing: true
      };

      await initCommand.execute(projectDir, options);

      // 验证基本项目文件
      expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, 'README.md'))).toBe(true);

      // 验证编辑器配置文件
      expect(fs.existsSync(path.join(projectDir, '.cursor-rules'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.vscode', 'settings.json'))).toBe(true);

      // 验证package.json内容
      const packageJson = fs.readJsonSync(path.join(projectDir, 'package.json'));
      expect(packageJson.name).toBe('my-test-app');

      // 验证编辑器配置内容
      const cursorRules = fs.readFileSync(path.join(projectDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('my-test-app');
    });

    it('应该支持不同的编辑器配置', async () => {
      const testCases = [
        {
          template: 'web-app',
          editors: ['cursor'],
          projectName: 'cursor-project'
        },
        {
          template: 'api',
          editors: ['vscode'],
          projectName: 'vscode-project'
        }
      ];

      for (const testCase of testCases) {
        const testProjectDir = path.join(tempDir, testCase.projectName);
        fs.ensureDirSync(testProjectDir);

        const initCommand = new InitCommandWrapper(templatesDir);
        await initCommand.execute(testProjectDir, testCase);

        // 验证基本结构
        expect(fs.existsSync(path.join(testProjectDir, 'package.json'))).toBe(true);

        // 验证编辑器配置
        testCase.editors.forEach(editor => {
          switch (editor) {
            case 'cursor':
              expect(fs.existsSync(path.join(testProjectDir, '.cursor-rules'))).toBe(true);
              break;
            case 'vscode':
              expect(fs.existsSync(path.join(testProjectDir, '.vscode', 'settings.json'))).toBe(true);
              break;
          }
        });
      }
    });

    it('应该生成有效的package.json', async () => {
      const initCommand = new InitCommandWrapper(templatesDir);

      const options = {
        template: 'web-app',
        editors: ['cursor'],
        projectName: 'package-test',
        typescript: true
      };

      await initCommand.execute(projectDir, options);

      // 验证package.json的基本结构
      const packageJson = fs.readJsonSync(path.join(projectDir, 'package.json'));
      expect(packageJson.name).toBe('package-test');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.description).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理目标目录已存在的情况', async () => {
      // 创建已存在的文件
      fs.writeFileSync(path.join(projectDir, 'existing-file.txt'), 'existing content');

      const initCommand = new InitCommandWrapper(templatesDir);

      const options = {
        template: 'web-app',
        editors: ['cursor'],
        projectName: 'existing-project',
        force: false
      };

      await expect(initCommand.execute(projectDir, options)).rejects.toThrow();
    });

    it('应该支持强制覆盖已存在的项目', async () => {
      // 创建已存在的文件
      fs.writeFileSync(path.join(projectDir, 'existing-file.txt'), 'existing content');

      const initCommand = new InitCommandWrapper(templatesDir);

      const options = {
        template: 'web-app',
        editors: ['cursor'],
        projectName: 'force-overwrite',
        force: true
      };

      await initCommand.execute(projectDir, options);

      // 验证项目被成功初始化
      expect(fs.existsSync(path.join(projectDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectDir, '.cursor-rules'))).toBe(true);
    });
  });

  describe('并发测试', () => {
    it('应该支持并发的多项目初始化', async () => {
      const projects = Array.from({ length: 3 }, (_, i) => ({
        dir: path.join(tempDir, `concurrent-project-${i}`),
        name: `concurrent-test-${i}`
      }));

      // 创建项目目录
      projects.forEach(project => fs.ensureDirSync(project.dir));

      const initPromises = projects.map(async (project) => {
        const initCommand = new InitCommandWrapper(templatesDir);

        const options = {
          template: 'web-app',
          editors: ['cursor'],
          projectName: project.name
        };

        return initCommand.execute(project.dir, options);
      });

      // 并发执行
      await Promise.all(initPromises);

      // 验证所有项目都被正确初始化
      projects.forEach(project => {
        expect(fs.existsSync(path.join(project.dir, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(project.dir, '.cursor-rules'))).toBe(true);

        const packageJson = fs.readJsonSync(path.join(project.dir, 'package.json'));
        expect(packageJson.name).toBe(project.name);
      });
    });
  });

});
