/**
 * Init命令单元测试
 */

import { InitCommand } from '../../../src/commands/init';
import { AIRulesGenerator } from '../../../src/core/templates/ai-rules-generator';
import { ProgrammingLanguage, ProjectType } from '../../../src/types/config';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock dependencies
jest.mock('../../../src/core/templates/ai-rules-generator');
jest.mock('fs-extra');
jest.mock('inquirer');

const MockAIRulesGenerator = AIRulesGenerator as jest.MockedClass<typeof AIRulesGenerator>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('InitCommand Unit Tests', () => {
  let initCommand: InitCommand;
  let mockGenerator: jest.Mocked<AIRulesGenerator>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGenerator = new MockAIRulesGenerator() as jest.Mocked<AIRulesGenerator>;
    MockAIRulesGenerator.mockImplementation(() => mockGenerator);
    
    initCommand = new InitCommand();

    // Mock fs operations
    mockFs.existsSync.mockReturnValue(false);
    mockFs.ensureDirSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.readFileSync.mockReturnValue('{}');
  });

  describe('execute', () => {
    it('应该使用默认参数初始化项目', async () => {
      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP
      };

      await initCommand.execute('test-project', options);

      expect(mockGenerator.generateRules).toHaveBeenCalledWith({
        language: ProgrammingLanguage.TYPESCRIPT,
        projectType: ProjectType.WEB_APP,
        outputDir: expect.stringContaining('test-project'),
        features: expect.any(Array)
      });
    });

    it('应该支持自定义语言和模板', async () => {
      const options = {
        language: ProgrammingLanguage.PYTHON,
        template: ProjectType.API
      };

      await initCommand.execute('python-api', options);

      expect(mockGenerator.generateRules).toHaveBeenCalledWith({
        language: ProgrammingLanguage.PYTHON,
        projectType: ProjectType.API,
        outputDir: expect.stringContaining('python-api'),
        features: expect.any(Array)
      });
    });

    it('应该处理已存在的目录', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP,
        force: false
      };

      await expect(initCommand.execute('existing-project', options))
        .rejects.toThrow('目录已存在');
    });

    it('应该支持强制覆盖已存在的目录', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP,
        force: true
      };

      await initCommand.execute('existing-project', options);

      expect(mockGenerator.generateRules).toHaveBeenCalled();
    });

    it('应该创建项目目录结构', async () => {
      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP
      };

      await initCommand.execute('new-project', options);

      expect(mockFs.ensureDirSync).toHaveBeenCalledWith(
        expect.stringContaining('new-project')
      );
    });

    it('应该生成package.json文件', async () => {
      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP
      };

      await initCommand.execute('ts-project', options);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        expect.stringContaining('"name": "ts-project"'),
        'utf8'
      );
    });

    it('应该生成README.md文件', async () => {
      const options = {
        language: ProgrammingLanguage.PYTHON,
        template: ProjectType.API
      };

      await initCommand.execute('readme-project', options);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('# readme-project'),
        'utf8'
      );
    });

    it('应该生成.gitignore文件', async () => {
      const options = {
        language: ProgrammingLanguage.JAVASCRIPT,
        template: ProjectType.WEB_APP
      };

      await initCommand.execute('git-project', options);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.gitignore'),
        expect.stringContaining('node_modules'),
        'utf8'
      );
    });
  });

  describe('getTemplateFeatures', () => {
    it('应该返回Web应用的特性', () => {
      const features = initCommand.getTemplateFeatures(ProjectType.WEB_APP);
      
      expect(features).toContain('basic');
      expect(features).toContain('testing');
      expect(features.length).toBeGreaterThan(0);
    });

    it('应该返回API项目的特性', () => {
      const features = initCommand.getTemplateFeatures(ProjectType.API);
      
      expect(features).toContain('basic');
      expect(features).toContain('testing');
      expect(features.length).toBeGreaterThan(0);
    });

    it('应该返回移动应用的特性', () => {
      const features = initCommand.getTemplateFeatures(ProjectType.MOBILE_APP);
      
      expect(features).toContain('basic');
      expect(features).toContain('testing');
      expect(features.length).toBeGreaterThan(0);
    });

    it('应该返回AI/ML项目的特性', () => {
      const features = initCommand.getTemplateFeatures(ProjectType.AI_ML);
      
      expect(features).toContain('basic');
      expect(features).toContain('testing');
      expect(features.length).toBeGreaterThan(0);
    });

    it('应该为未知模板返回默认特性', () => {
      const features = initCommand.getTemplateFeatures('unknown' as ProjectType);
      
      expect(features).toEqual(['basic', 'testing']);
    });
  });

  describe('generatePackageJson', () => {
    it('应该生成TypeScript项目的package.json', () => {
      const packageJson = initCommand.generatePackageJson(
        'ts-package',
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      const parsed = JSON.parse(packageJson);
      expect(parsed.name).toBe('ts-package');
      expect(parsed.devDependencies).toHaveProperty('typescript');
      expect(parsed.devDependencies).toHaveProperty('@types/node');
      expect(parsed.scripts).toHaveProperty('build');
      expect(parsed.scripts).toHaveProperty('dev');
    });

    it('应该生成Python项目的package.json', () => {
      const packageJson = initCommand.generatePackageJson(
        'py-package',
        ProgrammingLanguage.PYTHON,
        ProjectType.API
      );

      const parsed = JSON.parse(packageJson);
      expect(parsed.name).toBe('py-package');
      expect(parsed.scripts).toHaveProperty('start');
      expect(parsed.scripts).toHaveProperty('test');
    });

    it('应该包含项目类型特定的依赖', () => {
      const webAppPackage = initCommand.generatePackageJson(
        'web-app',
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      const apiPackage = initCommand.generatePackageJson(
        'api-app',
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.API
      );

      const webParsed = JSON.parse(webAppPackage);
      const apiParsed = JSON.parse(apiPackage);

      // Web应用应该有前端相关依赖
      expect(webParsed.dependencies || webParsed.devDependencies).toBeDefined();
      
      // API应该有后端相关依赖
      expect(apiParsed.dependencies || apiParsed.devDependencies).toBeDefined();
    });
  });

  describe('generateReadme', () => {
    it('应该生成包含项目名称的README', () => {
      const readme = initCommand.generateReadme(
        'test-readme',
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      expect(readme).toContain('# test-readme');
      expect(readme).toContain('TypeScript');
      expect(readme).toContain('Web应用');
    });

    it('应该包含安装和运行说明', () => {
      const readme = initCommand.generateReadme(
        'install-project',
        ProgrammingLanguage.PYTHON,
        ProjectType.API
      );

      expect(readme).toContain('## 安装');
      expect(readme).toContain('## 运行');
      expect(readme).toContain('npm install');
      expect(readme).toContain('npm start');
    });

    it('应该包含AI编辑器配置说明', () => {
      const readme = initCommand.generateReadme(
        'ai-project',
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      expect(readme).toContain('AI编辑器配置');
      expect(readme).toContain('Cursor');
      expect(readme).toContain('Windsurf');
      expect(readme).toContain('Trae');
      expect(readme).toContain('VSCode');
    });
  });

  describe('generateGitignore', () => {
    it('应该生成包含通用忽略规则的.gitignore', () => {
      const gitignore = initCommand.generateGitignore(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      expect(gitignore).toContain('node_modules');
      expect(gitignore).toContain('.env');
      expect(gitignore).toContain('dist');
      expect(gitignore).toContain('.DS_Store');
    });

    it('应该包含语言特定的忽略规则', () => {
      const tsGitignore = initCommand.generateGitignore(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      const pyGitignore = initCommand.generateGitignore(
        ProgrammingLanguage.PYTHON,
        ProjectType.API
      );

      expect(tsGitignore).toContain('*.tsbuildinfo');
      expect(pyGitignore).toContain('__pycache__');
      expect(pyGitignore).toContain('*.pyc');
    });

    it('应该包含项目类型特定的忽略规则', () => {
      const webAppGitignore = initCommand.generateGitignore(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP
      );

      const apiGitignore = initCommand.generateGitignore(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.API
      );

      expect(webAppGitignore).toContain('build');
      expect(apiGitignore).toContain('logs');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的项目名称', async () => {
      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP
      };

      await expect(initCommand.execute('', options))
        .rejects.toThrow('项目名称不能为空');
    });

    it('应该处理无效的语言参数', async () => {
      const options = {
        language: 'invalid' as ProgrammingLanguage,
        template: ProjectType.WEB_APP
      };

      await expect(initCommand.execute('test-project', options))
        .rejects.toThrow();
    });

    it('应该处理文件写入错误', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('写入失败');
      });

      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP
      };

      await expect(initCommand.execute('error-project', options))
        .rejects.toThrow('写入失败');
    });

    it('应该处理目录创建错误', async () => {
      mockFs.ensureDirSync.mockImplementation(() => {
        throw new Error('目录创建失败');
      });

      const options = {
        language: ProgrammingLanguage.TYPESCRIPT,
        template: ProjectType.WEB_APP
      };

      await expect(initCommand.execute('dir-error-project', options))
        .rejects.toThrow('目录创建失败');
    });
  });
});
