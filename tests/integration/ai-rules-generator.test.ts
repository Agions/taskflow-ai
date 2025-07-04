/**
 * AI规则生成器集成测试
 */

import fs from 'fs-extra';
import path from 'path';
import { AIRulesGenerator, ProgrammingLanguage, ProjectType, AIRulesConfig } from '../../src/core/templates/ai-rules-generator';

describe('AIRulesGenerator Integration Tests', () => {
  let tempDir: string;
  let aiRulesGenerator: AIRulesGenerator;

  beforeEach(async () => {
    // 创建临时测试目录
    tempDir = path.join(__dirname, '../../temp', `ai-rules-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    // 初始化AI规则生成器
    aiRulesGenerator = new AIRulesGenerator();
  });

  afterEach(async () => {
    // 清理临时目录
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('TypeScript项目AI规则生成', () => {
    it('应该生成TypeScript Web应用的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-typescript-webapp',
        projectType: ProjectType.WEB_APP,
        language: ProgrammingLanguage.TYPESCRIPT,
        framework: 'react',
        features: ['frontend', 'responsive', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      // 验证Cursor规则文件
      expect(await fs.pathExists(path.join(tempDir, '.cursor-rules'))).toBe(true);
      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('test-typescript-webapp');
      expect(cursorRules).toContain('TypeScript特定规则');
      expect(cursorRules).toContain('避免使用any类型');
      expect(cursorRules).toContain('Web应用特定规则');

      // 验证Windsurf配置
      expect(await fs.pathExists(path.join(tempDir, '.windsurf/ai-config.json'))).toBe(true);
      const windsurfConfig = JSON.parse(await fs.readFile(path.join(tempDir, '.windsurf/ai-config.json'), 'utf-8'));
      expect(windsurfConfig.ai.language).toBe('typescript');
      expect(windsurfConfig.ai.projectType).toBe('web-app');
      expect(windsurfConfig.ai.features.codeCompletion).toBe(true);

      // 验证Trae配置
      expect(await fs.pathExists(path.join(tempDir, '.trae/ai-config.json'))).toBe(true);
      const traeConfig = JSON.parse(await fs.readFile(path.join(tempDir, '.trae/ai-config.json'), 'utf-8'));
      expect(traeConfig.ai.language).toBe('typescript');
      expect(traeConfig.ai.codeGeneration.style.indentation).toBe(2);

      // 验证VSCode配置
      expect(await fs.pathExists(path.join(tempDir, '.vscode/settings.json'))).toBe(true);
      const vscodeSettings = JSON.parse(await fs.readFile(path.join(tempDir, '.vscode/settings.json'), 'utf-8'));
      expect(vscodeSettings['typescript.suggest.autoImports']).toBe(true);
      expect(vscodeSettings['taskflow.ai.language']).toBe('typescript');
    });

    it('应该生成TypeScript API项目的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-typescript-api',
        projectType: ProjectType.API,
        language: ProgrammingLanguage.TYPESCRIPT,
        framework: 'express',
        features: ['rest-api', 'authentication', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('API特定规则');
      expect(cursorRules).toContain('RESTful设计');
      expect(cursorRules).toContain('身份验证和授权');
    });
  });

  describe('Python项目AI规则生成', () => {
    it('应该生成Python API项目的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-python-api',
        projectType: ProjectType.API,
        language: ProgrammingLanguage.PYTHON,
        framework: 'fastapi',
        features: ['rest-api', 'database', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      // 验证Cursor规则
      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('Python特定规则');
      expect(cursorRules).toContain('PEP 8');
      expect(cursorRules).toContain('类型提示');
      expect(cursorRules).toContain('snake_case');

      // 验证VSCode Python设置
      const vscodeSettings = JSON.parse(await fs.readFile(path.join(tempDir, '.vscode/settings.json'), 'utf-8'));
      expect(vscodeSettings['python.formatting.provider']).toBe('black');
      expect(vscodeSettings['python.linting.flake8Enabled']).toBe(true);
    });

    it('应该生成Python AI/ML项目的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-python-ml',
        projectType: ProjectType.AI_ML,
        language: ProgrammingLanguage.PYTHON,
        features: ['machine-learning', 'data-processing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('AI/ML特定规则');
      expect(cursorRules).toContain('数据处理');
      expect(cursorRules).toContain('模型开发');
      expect(cursorRules).toContain('AI伦理准则');
    });
  });

  describe('Java项目AI规则生成', () => {
    it('应该生成Java API项目的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-java-api',
        projectType: ProjectType.API,
        language: ProgrammingLanguage.JAVA,
        framework: 'spring-boot',
        features: ['rest-api', 'database', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('Java特定规则');
      expect(cursorRules).toContain('PascalCase命名类');
      expect(cursorRules).toContain('camelCase命名方法');
      expect(cursorRules).toContain('面向对象原则');
      expect(cursorRules).toContain('Spring框架');

      // 验证VSCode Java设置
      const vscodeSettings = JSON.parse(await fs.readFile(path.join(tempDir, '.vscode/settings.json'), 'utf-8'));
      expect(vscodeSettings['java.configuration.updateBuildConfiguration']).toBe('automatic');
    });
  });

  describe('Go项目AI规则生成', () => {
    it('应该生成Go API项目的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-go-api',
        projectType: ProjectType.API,
        language: ProgrammingLanguage.GO,
        framework: 'gin',
        features: ['rest-api', 'concurrency', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('Go特定规则');
      expect(cursorRules).toContain('gofmt');
      expect(cursorRules).toContain('goroutine');
      expect(cursorRules).toContain('channel');
      expect(cursorRules).toContain('Go惯用法');

      // 验证VSCode Go设置
      const vscodeSettings = JSON.parse(await fs.readFile(path.join(tempDir, '.vscode/settings.json'), 'utf-8'));
      expect(vscodeSettings['go.formatTool']).toBe('gofmt');
      expect(vscodeSettings['go.lintTool']).toBe('golangci-lint');
    });
  });

  describe('Rust项目AI规则生成', () => {
    it('应该生成Rust API项目的AI规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-rust-api',
        projectType: ProjectType.API,
        language: ProgrammingLanguage.RUST,
        framework: 'actix-web',
        features: ['rest-api', 'performance', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('Rust特定规则');
      expect(cursorRules).toContain('所有权系统');
      expect(cursorRules).toContain('借用');
      expect(cursorRules).toContain('生命周期');
      expect(cursorRules).toContain('Result类型');

      // 验证VSCode Rust设置
      const vscodeSettings = JSON.parse(await fs.readFile(path.join(tempDir, '.vscode/settings.json'), 'utf-8'));
      expect(vscodeSettings['rust-analyzer.checkOnSave.command']).toBe('clippy');
    });
  });

  describe('多编辑器配置验证', () => {
    it('应该为所有编辑器生成一致的配置', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-multi-editor',
        projectType: ProjectType.WEB_APP,
        language: ProgrammingLanguage.TYPESCRIPT,
        features: ['frontend', 'testing']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      // 验证所有编辑器配置文件都存在
      expect(await fs.pathExists(path.join(tempDir, '.cursor-rules'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.windsurf/ai-config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.trae/ai-config.json'))).toBe(true);
      expect(await fs.pathExists(path.join(tempDir, '.vscode/settings.json'))).toBe(true);

      // 验证配置一致性
      const windsurfConfig = JSON.parse(await fs.readFile(path.join(tempDir, '.windsurf/ai-config.json'), 'utf-8'));
      const traeConfig = JSON.parse(await fs.readFile(path.join(tempDir, '.trae/ai-config.json'), 'utf-8'));
      const vscodeSettings = JSON.parse(await fs.readFile(path.join(tempDir, '.vscode/settings.json'), 'utf-8'));

      expect(windsurfConfig.ai.language).toBe('typescript');
      expect(traeConfig.ai.language).toBe('typescript');
      expect(vscodeSettings['taskflow.ai.language']).toBe('typescript');

      expect(windsurfConfig.ai.projectType).toBe('web-app');
      expect(traeConfig.ai.projectType).toBe('web-app');
      expect(vscodeSettings['taskflow.ai.projectType']).toBe('web-app');
    });
  });

  describe('项目特性验证', () => {
    it('应该根据项目特性生成相应的规则', async () => {
      const config: AIRulesConfig = {
        projectName: 'test-features',
        projectType: ProjectType.MOBILE,
        language: ProgrammingLanguage.TYPESCRIPT,
        features: ['mobile-ui', 'offline', 'performance']
      };

      await aiRulesGenerator.generateAllAIRules(tempDir, config);

      const cursorRules = await fs.readFile(path.join(tempDir, '.cursor-rules'), 'utf-8');
      expect(cursorRules).toContain('移动应用特定规则');
      expect(cursorRules).toContain('性能优化');
      expect(cursorRules).toContain('离线功能');
      expect(cursorRules).toContain('触摸交互');
    });
  });
});
