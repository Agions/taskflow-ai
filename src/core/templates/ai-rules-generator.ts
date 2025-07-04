/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * AI编辑器规则生成器
 * 专注于为不同编程语言和项目类型生成高质量的AI规则
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Logger } from '../../infra/logger';
import { LogLevel } from '../../types/config';
// import { performanceMonitor, cached } from '../performance/performance-monitor';
import {
  getLanguagePatterns,
  getLanguageBestPractices,
  getModelStrategy,
  getLanguageWorkflows,
  getCodeStyle,
  getNamingConventions,
  getVSCodeLanguageSettings,
  getLanguageId
} from './ai-rules-helpers';

/**
 * 支持的编程语言
 */
export enum ProgrammingLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  CSHARP = 'csharp',
  PHP = 'php'
}

/**
 * 项目类型
 */
export enum ProjectType {
  WEB_APP = 'web-app',
  API = 'api',
  MOBILE = 'mobile',
  AI_ML = 'ai-ml'
}

/**
 * AI规则配置
 */
export interface AIRulesConfig {
  projectName: string;
  projectType: ProjectType;
  language: ProgrammingLanguage;
  framework?: string;
  features: string[];
}

/**
 * AI编辑器规则生成器
 */
export class AIRulesGenerator {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance({
      level: LogLevel.INFO,
      output: 'console'
    });
  }

  /**
   * 生成所有编辑器的AI规则
   */
  public async generateAllAIRules(
    targetDir: string,
    config: AIRulesConfig
  ): Promise<void> {
    this.logger.info(`为${config.language}项目生成AI编辑器规则`);

    // 生成Cursor规则
    await this.generateCursorRules(targetDir, config);
    
    // 生成Windsurf规则
    await this.generateWindsurfRules(targetDir, config);
    
    // 生成Trae规则
    await this.generateTraeRules(targetDir, config);
    
    // 生成VSCode规则
    await this.generateVSCodeRules(targetDir, config);

    this.logger.info(chalk.green('✅ AI编辑器规则生成完成'));
  }

  /**
   * 生成Cursor AI规则
   */
  private async generateCursorRules(
    targetDir: string,
    config: AIRulesConfig
  ): Promise<void> {
    const rules = this.generateLanguageSpecificRules(config);
    await fs.writeFile(path.join(targetDir, '.cursor-rules'), rules);
    console.log(chalk.green('✅ Cursor AI规则已生成'));
  }

  /**
   * 生成Windsurf AI规则
   */
  private async generateWindsurfRules(
    targetDir: string,
    config: AIRulesConfig
  ): Promise<void> {
    const windsurfDir = path.join(targetDir, '.windsurf');
    await fs.ensureDir(windsurfDir);

    const aiConfig = {
      ai: {
        enabled: true,
        provider: 'taskflow-ai',
        language: config.language,
        projectType: config.projectType,
        features: {
          codeCompletion: true,
          codeGeneration: true,
          codeReview: true,
          refactoring: true,
          documentation: true,
          testing: true
        },
        rules: this.getLanguageRules(config.language),
        patterns: getLanguagePatterns(config.language),
        bestPractices: getLanguageBestPractices(config.language)
      },
      orchestration: {
        strategy: 'intelligent',
        models: getModelStrategy(config.language),
        qualityCheck: true,
        fallbackEnabled: true
      }
    };

    await fs.writeFile(
      path.join(windsurfDir, 'ai-config.json'),
      JSON.stringify(aiConfig, null, 2)
    );
    console.log(chalk.green('✅ Windsurf AI规则已生成'));
  }

  /**
   * 生成Trae AI规则
   */
  private async generateTraeRules(
    targetDir: string,
    config: AIRulesConfig
  ): Promise<void> {
    const traeDir = path.join(targetDir, '.trae');
    await fs.ensureDir(traeDir);

    const traeConfig = {
      ai: {
        enabled: true,
        language: config.language,
        projectType: config.projectType,
        workflows: getLanguageWorkflows(config.language),
        codeGeneration: {
          style: getCodeStyle(config.language),
          patterns: getLanguagePatterns(config.language),
          conventions: getNamingConventions(config.language)
        },
        qualityAssurance: {
          linting: true,
          formatting: true,
          testing: true,
          documentation: true
        }
      }
    };

    await fs.writeFile(
      path.join(traeDir, 'ai-config.json'),
      JSON.stringify(traeConfig, null, 2)
    );
    console.log(chalk.green('✅ Trae AI规则已生成'));
  }

  /**
   * 生成VSCode AI规则
   */
  private async generateVSCodeRules(
    targetDir: string,
    config: AIRulesConfig
  ): Promise<void> {
    const vscodeDir = path.join(targetDir, '.vscode');
    await fs.ensureDir(vscodeDir);

    const settings = {
      // 语言特定设置
      ...getVSCodeLanguageSettings(config.language),
      
      // AI助手设置
      'github.copilot.enable': {
        '*': true,
        'plaintext': false,
        'markdown': true,
        [getLanguageId(config.language)]: true
      },
      
      // 代码格式化
      'editor.formatOnSave': true,
      'editor.codeActionsOnSave': {
        'source.fixAll': true,
        'source.organizeImports': true
      },
      
      // 智能建议
      'editor.suggestSelection': 'first',
      'editor.acceptSuggestionOnCommitCharacter': true,
      'editor.acceptSuggestionOnEnter': 'on',
      
      // 项目特定设置
      'taskflow.ai.language': config.language,
      'taskflow.ai.projectType': config.projectType,
      'taskflow.ai.rules': this.getLanguageRules(config.language)
    };

    await fs.writeFile(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(settings, null, 2)
    );
    console.log(chalk.green('✅ VSCode AI规则已生成'));
  }

  /**
   * 生成语言特定的AI规则
   */
  private generateLanguageSpecificRules(config: AIRulesConfig): string {
    const baseRules = this.getBaseRules(config);
    const languageRules = this.getLanguageSpecificContent(config);
    const projectRules = this.getProjectTypeRules(config);
    
    return `${baseRules}\n\n${languageRules}\n\n${projectRules}`;
  }

  /**
   * 获取基础AI规则
   */
  private getBaseRules(config: AIRulesConfig): string {
    return `# ${config.projectName} - AI编辑器规则

## 项目信息
- 项目名称: ${config.projectName}
- 编程语言: ${config.language}
- 项目类型: ${config.projectType}
- 框架: ${config.framework || '无'}
- 特性: ${config.features.join(', ')}

## 通用规则
1. 始终遵循项目的编码规范和最佳实践
2. 优先考虑代码的可读性、可维护性和性能
3. 生成的代码应该包含适当的注释和文档
4. 遵循SOLID原则和设计模式
5. 确保代码的类型安全和错误处理
6. 优先使用项目已有的依赖和工具
7. 生成的代码应该易于测试和调试`;
  }

  /**
   * 获取语言特定的规则内容
   */
  private getLanguageSpecificContent(config: AIRulesConfig): string {
    switch (config.language) {
      case ProgrammingLanguage.TYPESCRIPT:
        return this.getTypeScriptRules(config);
      case ProgrammingLanguage.PYTHON:
        return this.getPythonRules(config);
      case ProgrammingLanguage.JAVA:
        return this.getJavaRules(config);
      case ProgrammingLanguage.GO:
        return this.getGoRules(config);
      case ProgrammingLanguage.RUST:
        return this.getRustRules(config);
      default:
        return this.getGenericRules(config);
    }
  }

  /**
   * 获取TypeScript特定规则
   */
  private getTypeScriptRules(_config: AIRulesConfig): string {
    return `## TypeScript特定规则

### 类型系统
- 始终使用严格的TypeScript配置
- 避免使用any类型，优先使用具体类型或泛型
- 使用接口(interface)定义对象结构
- 使用类型联合(Union Types)和交叉类型(Intersection Types)
- 利用条件类型和映射类型提高类型安全

### 代码风格
- 使用PascalCase命名类和接口
- 使用camelCase命名变量和函数
- 使用UPPER_SNAKE_CASE命名常量
- 优先使用const断言和readonly修饰符
- 使用可选链操作符(?.)和空值合并操作符(??)

### 最佳实践
- 使用ESLint和Prettier保持代码一致性
- 优先使用函数式编程范式
- 使用async/await处理异步操作
- 实现适当的错误边界和错误处理
- 使用Jest进行单元测试和集成测试

### 常用模式
- 工厂模式用于对象创建
- 观察者模式用于事件处理
- 装饰器模式用于功能增强
- 策略模式用于算法选择
- 依赖注入用于解耦合`;
  }

  /**
   * 获取Python特定规则
   */
  private getPythonRules(_config: AIRulesConfig): string {
    return `## Python特定规则

### 代码风格 (PEP 8)
- 使用4个空格缩进，不使用制表符
- 行长度限制为88字符(Black格式化器标准)
- 使用snake_case命名变量和函数
- 使用PascalCase命名类
- 使用UPPER_SNAKE_CASE命名常量

### 类型注解
- 使用类型提示(Type Hints)提高代码可读性
- 使用typing模块的泛型类型
- 为函数参数和返回值添加类型注解
- 使用Optional和Union类型处理可选值
- 使用Protocol定义结构化类型

### 最佳实践
- 使用虚拟环境管理依赖
- 遵循"Pythonic"编程风格
- 使用列表推导式和生成器表达式
- 实现适当的异常处理
- 使用pytest进行测试
- 使用Black进行代码格式化
- 使用flake8或pylint进行代码检查

### 常用模式
- 上下文管理器(with语句)
- 装饰器模式
- 单例模式
- 工厂模式
- MVC架构模式`;
  }

  /**
   * 获取Java特定规则
   */
  private getJavaRules(_config: AIRulesConfig): string {
    return `## Java特定规则

### 代码风格
- 使用4个空格缩进
- 使用PascalCase命名类和接口
- 使用camelCase命名方法和变量
- 使用UPPER_SNAKE_CASE命名常量
- 包名使用小写字母和点分隔

### 面向对象原则
- 遵循封装、继承、多态原则
- 使用接口定义契约
- 优先组合而非继承
- 实现适当的equals()和hashCode()方法
- 使用泛型提高类型安全

### 最佳实践
- 使用try-with-resources处理资源
- 使用Optional处理可能为null的值
- 使用Stream API进行集合操作
- 实现适当的异常处理策略
- 使用JUnit进行单元测试
- 使用Maven或Gradle管理依赖
- 使用Spring框架进行依赖注入和AOP

### 设计模式
- 单例模式
- 工厂模式
- 建造者模式
- 观察者模式
- 策略模式
- 依赖注入模式`;
  }

  /**
   * 获取Go特定规则
   */
  private getGoRules(_config: AIRulesConfig): string {
    return `## Go特定规则

### 代码风格
- 使用gofmt自动格式化代码
- 使用PascalCase命名导出的函数和类型
- 使用camelCase命名未导出的函数和变量
- 包名使用小写字母，简短且有意义
- 接口名通常以-er结尾

### Go惯用法
- 优先使用组合而非继承
- 使用接口定义行为
- 错误处理使用error类型
- 使用defer语句进行资源清理
- 使用goroutine和channel进行并发编程
- 遵循"不要通过共享内存来通信，而要通过通信来共享内存"

### 最佳实践
- 使用go mod管理依赖
- 使用golangci-lint进行代码检查
- 编写简洁的测试函数
- 使用基准测试进行性能测试
- 实现适当的错误处理
- 使用context包处理超时和取消

### 常用模式
- 工厂函数模式
- 选项模式(Functional Options)
- 管道模式(Pipeline)
- 工作池模式(Worker Pool)
- 发布订阅模式`;
  }

  /**
   * 获取Rust特定规则
   */
  private getRustRules(_config: AIRulesConfig): string {
    return `## Rust特定规则

### 代码风格
- 使用rustfmt自动格式化代码
- 使用snake_case命名变量和函数
- 使用PascalCase命名类型和trait
- 使用SCREAMING_SNAKE_CASE命名常量
- 模块名使用snake_case

### 所有权和借用
- 理解并正确使用所有权系统
- 优先使用借用而非移动
- 使用生命周期参数确保内存安全
- 避免不必要的clone()调用
- 使用Rc和Arc进行共享所有权

### 最佳实践
- 使用cargo管理项目和依赖
- 使用clippy进行代码检查
- 编写文档测试和单元测试
- 使用Result类型进行错误处理
- 优先使用迭代器而非循环
- 使用match表达式进行模式匹配

### 常用模式
- 建造者模式
- 新类型模式(Newtype)
- 类型状态模式(Typestate)
- RAII模式
- 错误传播模式(?操作符)`;
  }

  /**
   * 获取通用规则
   */
  private getGenericRules(config: AIRulesConfig): string {
    return `## ${config.language}特定规则

### 代码风格
- 遵循语言官方的代码风格指南
- 使用一致的命名约定
- 保持代码简洁和可读
- 添加适当的注释和文档

### 最佳实践
- 使用语言推荐的包管理工具
- 实现适当的错误处理
- 编写单元测试和集成测试
- 使用静态分析工具
- 遵循安全编程实践`;
  }

  /**
   * 获取项目类型特定规则
   */
  private getProjectTypeRules(config: AIRulesConfig): string {
    switch (config.projectType) {
      case ProjectType.WEB_APP:
        return this.getWebAppRules(config);
      case ProjectType.API:
        return this.getAPIRules(config);
      case ProjectType.MOBILE:
        return this.getMobileRules(config);
      case ProjectType.AI_ML:
        return this.getAIMLRules(config);
      default:
        return '';
    }
  }

  /**
   * 获取Web应用特定规则
   */
  private getWebAppRules(_config: AIRulesConfig): string {
    return `## Web应用特定规则

### 前端开发
- 使用组件化架构
- 实现响应式设计
- 优化性能和加载速度
- 确保可访问性(a11y)
- 实现适当的状态管理
- 使用现代CSS技术

### 用户体验
- 提供良好的用户反馈
- 实现加载状态和错误处理
- 优化移动端体验
- 确保跨浏览器兼容性

### 安全性
- 防止XSS攻击
- 实现CSRF保护
- 使用HTTPS
- 验证用户输入`;
  }

  /**
   * 获取API特定规则
   */
  private getAPIRules(_config: AIRulesConfig): string {
    return `## API特定规则

### RESTful设计
- 使用标准HTTP方法
- 设计清晰的URL结构
- 返回适当的HTTP状态码
- 实现统一的响应格式
- 提供API版本控制

### 安全性
- 实现身份验证和授权
- 使用HTTPS加密传输
- 防止SQL注入和其他攻击
- 实现速率限制
- 验证和清理输入数据

### 性能
- 实现缓存策略
- 使用分页处理大数据集
- 优化数据库查询
- 实现异步处理

### 文档
- 提供完整的API文档
- 包含请求/响应示例
- 说明错误码和处理方式`;
  }

  /**
   * 获取移动应用特定规则
   */
  private getMobileRules(_config: AIRulesConfig): string {
    return `## 移动应用特定规则

### 性能优化
- 优化应用启动时间
- 减少内存使用
- 实现高效的图片加载
- 使用懒加载技术

### 用户体验
- 适配不同屏幕尺寸
- 实现流畅的动画
- 提供离线功能
- 优化触摸交互

### 平台特性
- 遵循平台设计指南
- 使用原生组件
- 实现平台特定功能
- 优化电池使用`;
  }

  /**
   * 获取AI/ML特定规则
   */
  private getAIMLRules(_config: AIRulesConfig): string {
    return `## AI/ML特定规则

### 数据处理
- 实现数据清洗和预处理
- 使用适当的数据格式
- 确保数据质量和一致性
- 实现数据版本控制

### 模型开发
- 使用标准的ML库和框架
- 实现模型验证和测试
- 记录实验和结果
- 使用版本控制管理模型

### 部署和监控
- 实现模型部署管道
- 监控模型性能
- 实现A/B测试
- 处理模型漂移

### 伦理和安全
- 确保数据隐私
- 避免算法偏见
- 实现可解释性
- 遵循AI伦理准则`;
  }

  /**
   * 获取语言规则
   */
  private getLanguageRules(language: ProgrammingLanguage): string[] {
    const commonRules = [
      '遵循语言官方编码规范',
      '使用一致的命名约定',
      '编写清晰的注释和文档',
      '实现适当的错误处理',
      '编写可测试的代码'
    ];

    const languageSpecificRules: Record<ProgrammingLanguage, string[]> = {
      [ProgrammingLanguage.TYPESCRIPT]: [
        '使用严格的TypeScript配置',
        '避免使用any类型',
        '优先使用接口定义对象结构',
        '使用泛型提高类型安全',
        '利用条件类型和映射类型'
      ],
      [ProgrammingLanguage.PYTHON]: [
        '遵循PEP 8编码规范',
        '使用类型提示提高可读性',
        '使用虚拟环境管理依赖',
        '遵循Pythonic编程风格',
        '使用列表推导式和生成器'
      ],
      [ProgrammingLanguage.JAVA]: [
        '遵循Java编码约定',
        '使用接口定义契约',
        '优先组合而非继承',
        '使用泛型提高类型安全',
        '实现适当的equals和hashCode'
      ],
      [ProgrammingLanguage.GO]: [
        '使用gofmt格式化代码',
        '遵循Go惯用法',
        '使用接口定义行为',
        '正确处理错误',
        '使用goroutine进行并发'
      ],
      [ProgrammingLanguage.RUST]: [
        '理解所有权系统',
        '优先使用借用而非移动',
        '使用Result类型处理错误',
        '利用模式匹配',
        '使用迭代器而非循环'
      ],
      [ProgrammingLanguage.JAVASCRIPT]: [
        '使用现代ES6+语法',
        '避免全局变量',
        '使用const和let而非var',
        '使用箭头函数',
        '实现适当的异步处理'
      ],
      [ProgrammingLanguage.CSHARP]: [
        '遵循.NET编码约定',
        '使用LINQ进行数据查询',
        '实现IDisposable接口',
        '使用async/await处理异步',
        '利用泛型和扩展方法'
      ],
      [ProgrammingLanguage.PHP]: [
        '遵循PSR编码标准',
        '使用命名空间组织代码',
        '实现适当的异常处理',
        '使用Composer管理依赖',
        '遵循MVC架构模式'
      ]
    };

    return [...commonRules, ...(languageSpecificRules[language] || [])];
  }
}
