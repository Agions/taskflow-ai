/**
 * AI规则生成器单元测试
 * 测试AI编辑器规则生成的核心功能
 */

import { AIRulesGenerator } from '../../../../src/core/templates/ai-rules-generator';
import { ProgrammingLanguage, ProjectType } from '../../../../src/types/config';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('AIRulesGenerator Unit Tests', () => {
  let generator: AIRulesGenerator;
  const testOutputDir = '/test/output';

  beforeEach(() => {
    generator = new AIRulesGenerator();
    jest.clearAllMocks();
    
    // Mock fs operations
    mockFs.ensureDirSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.existsSync.mockReturnValue(false);
  });

  describe('generateRules', () => {
    it('应该为TypeScript Web应用生成完整的AI规则', async () => {
      const config = {
        language: ProgrammingLanguage.TYPESCRIPT,
        projectType: ProjectType.WEB_APP,
        outputDir: testOutputDir,
        features: ['testing', 'linting', 'performance']
      };

      await generator.generateRules(config);

      // 验证目录创建
      expect(mockFs.ensureDirSync).toHaveBeenCalledWith(testOutputDir);
      expect(mockFs.ensureDirSync).toHaveBeenCalledWith(path.join(testOutputDir, '.windsurf'));
      expect(mockFs.ensureDirSync).toHaveBeenCalledWith(path.join(testOutputDir, '.trae'));
      expect(mockFs.ensureDirSync).toHaveBeenCalledWith(path.join(testOutputDir, '.vscode'));

      // 验证文件写入
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(4); // Cursor, Windsurf, Trae, VSCode
    });

    it('应该为Python API项目生成正确的规则', async () => {
      const config = {
        language: ProgrammingLanguage.PYTHON,
        projectType: ProjectType.API,
        outputDir: testOutputDir,
        features: ['testing', 'documentation']
      };

      await generator.generateRules(config);

      // 验证生成了所有编辑器的配置
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(4);
      
      // 检查Cursor规则内容包含Python特定规则
      const cursorCall = mockFs.writeFileSync.mock.calls.find(call => 
        call[0].toString().endsWith('.cursor-rules')
      );
      expect(cursorCall).toBeDefined();
      expect(cursorCall![1]).toContain('Python');
      expect(cursorCall![1]).toContain('PEP 8');
    });

    it('应该处理无效的配置参数', async () => {
      const invalidConfig = {
        language: 'invalid' as ProgrammingLanguage,
        projectType: ProjectType.WEB_APP,
        outputDir: testOutputDir
      };

      await expect(generator.generateRules(invalidConfig)).rejects.toThrow();
    });
  });

  describe('generateCursorRules', () => {
    it('应该生成包含语言特定规则的Cursor配置', () => {
      const rules = generator.generateCursorRules(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP,
        ['testing', 'performance']
      );

      expect(rules).toContain('TypeScript');
      expect(rules).toContain('严格类型检查');
      expect(rules).toContain('避免使用any类型');
      expect(rules).toContain('性能优化');
      expect(rules).toContain('测试驱动开发');
    });

    it('应该为不同项目类型生成不同的规则', () => {
      const webAppRules = generator.generateCursorRules(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP,
        []
      );
      
      const apiRules = generator.generateCursorRules(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.API,
        []
      );

      expect(webAppRules).toContain('响应式设计');
      expect(apiRules).toContain('RESTful API');
      expect(webAppRules).not.toEqual(apiRules);
    });
  });

  describe('generateWindsurfRules', () => {
    it('应该生成有效的JSON配置', () => {
      const config = generator.generateWindsurfRules(
        ProgrammingLanguage.PYTHON,
        ProjectType.API,
        ['testing']
      );

      expect(() => JSON.parse(config)).not.toThrow();
      
      const parsed = JSON.parse(config);
      expect(parsed).toHaveProperty('aiConfig');
      expect(parsed.aiConfig).toHaveProperty('codeGeneration');
      expect(parsed.aiConfig).toHaveProperty('codeReview');
    });

    it('应该包含多模型配置', () => {
      const config = generator.generateWindsurfRules(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP,
        []
      );

      const parsed = JSON.parse(config);
      expect(parsed.aiConfig.models).toBeInstanceOf(Array);
      expect(parsed.aiConfig.models.length).toBeGreaterThan(0);
    });
  });

  describe('generateTraeRules', () => {
    it('应该生成包含工作流配置的JSON', () => {
      const config = generator.generateTraeRules(
        ProgrammingLanguage.JAVA,
        ProjectType.API,
        ['testing', 'documentation']
      );

      const parsed = JSON.parse(config);
      expect(parsed).toHaveProperty('workflows');
      expect(parsed).toHaveProperty('codeGeneration');
      expect(parsed.workflows).toBeInstanceOf(Array);
    });
  });

  describe('generateVSCodeRules', () => {
    it('应该生成VSCode设置JSON', () => {
      const config = generator.generateVSCodeRules(
        ProgrammingLanguage.RUST,
        ProjectType.API,
        ['linting']
      );

      const parsed = JSON.parse(config);
      expect(parsed).toHaveProperty('editor.formatOnSave');
      expect(parsed).toHaveProperty('files.associations');
      expect(parsed['editor.formatOnSave']).toBe(true);
    });

    it('应该包含语言特定的设置', () => {
      const tsConfig = generator.generateVSCodeRules(
        ProgrammingLanguage.TYPESCRIPT,
        ProjectType.WEB_APP,
        []
      );

      const parsed = JSON.parse(tsConfig);
      expect(parsed).toHaveProperty('typescript.preferences.quoteStyle');
      expect(parsed).toHaveProperty('typescript.suggest.autoImports');
    });
  });

  describe('getLanguageSpecificRules', () => {
    it('应该返回TypeScript特定规则', () => {
      const rules = generator.getLanguageSpecificRules(ProgrammingLanguage.TYPESCRIPT);
      
      expect(rules).toContain('严格类型检查');
      expect(rules).toContain('避免使用any类型');
      expect(rules).toContain('使用接口定义对象结构');
    });

    it('应该返回Python特定规则', () => {
      const rules = generator.getLanguageSpecificRules(ProgrammingLanguage.PYTHON);
      
      expect(rules).toContain('遵循PEP 8编码规范');
      expect(rules).toContain('使用类型提示');
      expect(rules).toContain('编写Pythonic代码');
    });

    it('应该为所有支持的语言返回规则', () => {
      const languages = [
        ProgrammingLanguage.TYPESCRIPT,
        ProgrammingLanguage.PYTHON,
        ProgrammingLanguage.JAVA,
        ProgrammingLanguage.GO,
        ProgrammingLanguage.RUST
      ];

      languages.forEach(lang => {
        const rules = generator.getLanguageSpecificRules(lang);
        expect(rules.length).toBeGreaterThan(0);
        expect(typeof rules[0]).toBe('string');
      });
    });
  });

  describe('getProjectTypeRules', () => {
    it('应该返回Web应用特定规则', () => {
      const rules = generator.getProjectTypeRules(ProjectType.WEB_APP);
      
      expect(rules).toContain('响应式设计原则');
      expect(rules).toContain('性能优化');
      expect(rules).toContain('可访问性标准');
    });

    it('应该返回API项目特定规则', () => {
      const rules = generator.getProjectTypeRules(ProjectType.API);
      
      expect(rules).toContain('RESTful API设计');
      expect(rules).toContain('API安全性');
      expect(rules).toContain('错误处理');
    });
  });

  describe('getFeatureRules', () => {
    it('应该返回测试特性规则', () => {
      const rules = generator.getFeatureRules(['testing']);
      
      expect(rules).toContain('编写单元测试');
      expect(rules).toContain('测试覆盖率');
      expect(rules).toContain('测试驱动开发');
    });

    it('应该返回多个特性的组合规则', () => {
      const rules = generator.getFeatureRules(['testing', 'performance', 'security']);
      
      expect(rules.length).toBeGreaterThan(3); // 应该包含所有特性的规则
      expect(rules.some(rule => rule.includes('测试'))).toBe(true);
      expect(rules.some(rule => rule.includes('性能'))).toBe(true);
      expect(rules.some(rule => rule.includes('安全'))).toBe(true);
    });

    it('应该处理空特性数组', () => {
      const rules = generator.getFeatureRules([]);
      expect(rules).toEqual([]);
    });
  });

  describe('错误处理', () => {
    it('应该处理文件写入错误', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('写入失败');
      });

      const config = {
        language: ProgrammingLanguage.TYPESCRIPT,
        projectType: ProjectType.WEB_APP,
        outputDir: testOutputDir
      };

      await expect(generator.generateRules(config)).rejects.toThrow('写入失败');
    });

    it('应该处理目录创建错误', async () => {
      mockFs.ensureDirSync.mockImplementation(() => {
        throw new Error('目录创建失败');
      });

      const config = {
        language: ProgrammingLanguage.TYPESCRIPT,
        projectType: ProjectType.WEB_APP,
        outputDir: testOutputDir
      };

      await expect(generator.generateRules(config)).rejects.toThrow('目录创建失败');
    });
  });
});
