/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI规则生成器辅助方法
 */

import { ProgrammingLanguage } from './ai-rules-generator';

/**
 * 获取语言模式
 */
export function getLanguagePatterns(language: ProgrammingLanguage): string[] {
  const patterns: Record<ProgrammingLanguage, string[]> = {
    [ProgrammingLanguage.TYPESCRIPT]: [
      'Factory Pattern', 'Observer Pattern', 'Decorator Pattern', 'Strategy Pattern', 'Dependency Injection'
    ],
    [ProgrammingLanguage.PYTHON]: [
      'Context Manager', 'Decorator Pattern', 'Singleton Pattern', 'Factory Pattern', 'MVC Pattern'
    ],
    [ProgrammingLanguage.JAVA]: [
      'Singleton Pattern', 'Factory Pattern', 'Builder Pattern', 'Observer Pattern', 'Strategy Pattern'
    ],
    [ProgrammingLanguage.GO]: [
      'Factory Function', 'Options Pattern', 'Pipeline Pattern', 'Worker Pool', 'Pub-Sub Pattern'
    ],
    [ProgrammingLanguage.RUST]: [
      'Builder Pattern', 'Newtype Pattern', 'Typestate Pattern', 'RAII Pattern', 'Error Propagation'
    ],
    [ProgrammingLanguage.JAVASCRIPT]: [
      'Module Pattern', 'Observer Pattern', 'Promise Pattern', 'Async/Await Pattern', 'Factory Pattern'
    ],
    [ProgrammingLanguage.CSHARP]: [
      'Singleton Pattern', 'Factory Pattern', 'Repository Pattern', 'Unit of Work', 'Dependency Injection'
    ],
    [ProgrammingLanguage.PHP]: [
      'MVC Pattern', 'Repository Pattern', 'Factory Pattern', 'Singleton Pattern', 'Observer Pattern'
    ]
  };

  return patterns[language] || [];
}

/**
 * 获取语言最佳实践
 */
export function getLanguageBestPractices(language: ProgrammingLanguage): string[] {
  const practices: Record<ProgrammingLanguage, string[]> = {
    [ProgrammingLanguage.TYPESCRIPT]: [
      '使用ESLint和Prettier', '编写单元测试', '使用类型守卫', '实现错误边界', '优化性能'
    ],
    [ProgrammingLanguage.PYTHON]: [
      '使用虚拟环境', '编写文档字符串', '使用pytest测试', '使用Black格式化', '实现日志记录'
    ],
    [ProgrammingLanguage.JAVA]: [
      '使用Maven/Gradle', '编写JUnit测试', '使用Spring框架', '实现日志记录', '优化JVM性能'
    ],
    [ProgrammingLanguage.GO]: [
      '使用go mod', '编写基准测试', '使用context包', '实现优雅关闭', '监控性能'
    ],
    [ProgrammingLanguage.RUST]: [
      '使用cargo', '编写文档测试', '使用clippy检查', '实现错误处理', '优化内存使用'
    ],
    [ProgrammingLanguage.JAVASCRIPT]: [
      '使用npm/yarn', '编写Jest测试', '使用Babel转译', '实现代码分割', '优化包大小'
    ],
    [ProgrammingLanguage.CSHARP]: [
      '使用NuGet', '编写xUnit测试', '使用Entity Framework', '实现依赖注入', '优化性能'
    ],
    [ProgrammingLanguage.PHP]: [
      '使用Composer', '编写PHPUnit测试', '使用框架', '实现缓存', '优化数据库查询'
    ]
  };

  return practices[language] || [];
}

/**
 * 获取模型策略
 */
export function getModelStrategy(language: ProgrammingLanguage): Record<string, any> {
  const strategies: Record<ProgrammingLanguage, Record<string, any>> = {
    [ProgrammingLanguage.TYPESCRIPT]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      codeReview: { primary: 'zhipu', fallback: ['deepseek', 'qwen'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.PYTHON]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      dataScience: { primary: 'qwen', fallback: ['deepseek', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.JAVA]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      architecture: { primary: 'qwen', fallback: ['deepseek', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.GO]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      concurrency: { primary: 'qwen', fallback: ['deepseek', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.RUST]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      systemsProgramming: { primary: 'qwen', fallback: ['deepseek', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.JAVASCRIPT]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.CSHARP]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    },
    [ProgrammingLanguage.PHP]: {
      codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
      documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
    }
  };

  return strategies[language] || {
    codeGeneration: { primary: 'deepseek', fallback: ['qwen', 'zhipu'] },
    documentation: { primary: 'moonshot', fallback: ['qwen', 'zhipu'] }
  };
}

/**
 * 获取语言工作流
 */
export function getLanguageWorkflows(language: ProgrammingLanguage): Record<string, any>[] {
  const commonWorkflows = [
    {
      name: 'Code Generation',
      trigger: 'on_request',
      actions: ['analyze_context', 'generate_code', 'apply_patterns', 'add_documentation']
    },
    {
      name: 'Code Review',
      trigger: 'on_save',
      actions: ['check_style', 'analyze_quality', 'suggest_improvements', 'check_security']
    }
  ];

  const languageSpecificWorkflows: Record<ProgrammingLanguage, Record<string, any>[]> = {
    [ProgrammingLanguage.TYPESCRIPT]: [
      {
        name: 'Type Safety Check',
        trigger: 'on_type_change',
        actions: ['validate_types', 'suggest_generics', 'check_null_safety']
      }
    ],
    [ProgrammingLanguage.PYTHON]: [
      {
        name: 'PEP 8 Compliance',
        trigger: 'on_save',
        actions: ['check_pep8', 'format_with_black', 'organize_imports']
      }
    ],
    [ProgrammingLanguage.RUST]: [
      {
        name: 'Ownership Analysis',
        trigger: 'on_borrow_check',
        actions: ['analyze_ownership', 'suggest_lifetimes', 'optimize_borrowing']
      }
    ],
    [ProgrammingLanguage.JAVASCRIPT]: [],
    [ProgrammingLanguage.JAVA]: [],
    [ProgrammingLanguage.GO]: [],
    [ProgrammingLanguage.CSHARP]: [],
    [ProgrammingLanguage.PHP]: []
  };

  return [...commonWorkflows, ...(languageSpecificWorkflows[language] || [])];
}

/**
 * 获取代码风格
 */
export function getCodeStyle(language: ProgrammingLanguage): Record<string, any> {
  const styles: Record<ProgrammingLanguage, Record<string, any>> = {
    [ProgrammingLanguage.TYPESCRIPT]: {
      indentation: 2,
      quotes: 'single',
      semicolons: true,
      trailingComma: 'es5',
      printWidth: 100
    },
    [ProgrammingLanguage.PYTHON]: {
      indentation: 4,
      lineLength: 88,
      quotes: 'double',
      formatter: 'black'
    },
    [ProgrammingLanguage.JAVA]: {
      indentation: 4,
      braceStyle: 'java',
      lineLength: 120,
      formatter: 'google-java-format'
    },
    [ProgrammingLanguage.GO]: {
      formatter: 'gofmt',
      tabWidth: 8,
      useTabs: true
    },
    [ProgrammingLanguage.RUST]: {
      formatter: 'rustfmt',
      indentation: 4,
      lineLength: 100
    },
    [ProgrammingLanguage.JAVASCRIPT]: {
      indentation: 2,
      quotes: 'single',
      semicolons: true,
      lineLength: 100
    },
    [ProgrammingLanguage.CSHARP]: {
      indentation: 4,
      braceStyle: 'csharp',
      lineLength: 120
    },
    [ProgrammingLanguage.PHP]: {
      indentation: 4,
      lineLength: 120,
      formatter: 'php-cs-fixer'
    }
  };

  return styles[language] || { indentation: 4, lineLength: 80 };
}

/**
 * 获取命名约定
 */
export function getNamingConventions(language: ProgrammingLanguage): Record<string, string> {
  const conventions: Record<ProgrammingLanguage, Record<string, string>> = {
    [ProgrammingLanguage.TYPESCRIPT]: {
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      interfaces: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE'
    },
    [ProgrammingLanguage.PYTHON]: {
      variables: 'snake_case',
      functions: 'snake_case',
      classes: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
      modules: 'snake_case'
    },
    [ProgrammingLanguage.JAVA]: {
      variables: 'camelCase',
      methods: 'camelCase',
      classes: 'PascalCase',
      interfaces: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
      packages: 'lowercase'
    },
    [ProgrammingLanguage.GO]: {
      variables: 'camelCase',
      functions: 'camelCase',
      types: 'PascalCase',
      constants: 'PascalCase',
      packages: 'lowercase'
    },
    [ProgrammingLanguage.RUST]: {
      variables: 'snake_case',
      functions: 'snake_case',
      types: 'PascalCase',
      traits: 'PascalCase',
      constants: 'SCREAMING_SNAKE_CASE',
      modules: 'snake_case'
    },
    [ProgrammingLanguage.JAVASCRIPT]: {
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE'
    },
    [ProgrammingLanguage.CSHARP]: {
      variables: 'camelCase',
      methods: 'PascalCase',
      classes: 'PascalCase',
      interfaces: 'PascalCase',
      constants: 'PascalCase'
    },
    [ProgrammingLanguage.PHP]: {
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE'
    }
  };

  return conventions[language] || {
    variables: 'camelCase',
    functions: 'camelCase',
    classes: 'PascalCase'
  };
}

/**
 * 获取VSCode语言设置
 */
export function getVSCodeLanguageSettings(language: ProgrammingLanguage): Record<string, any> {
  const settings: Record<ProgrammingLanguage, Record<string, any>> = {
    [ProgrammingLanguage.TYPESCRIPT]: {
      'typescript.preferences.includePackageJsonAutoImports': 'auto',
      'typescript.suggest.autoImports': true,
      'typescript.updateImportsOnFileMove.enabled': 'always'
    },
    [ProgrammingLanguage.PYTHON]: {
      'python.defaultInterpreterPath': './venv/bin/python',
      'python.formatting.provider': 'black',
      'python.linting.enabled': true,
      'python.linting.flake8Enabled': true
    },
    [ProgrammingLanguage.JAVA]: {
      'java.configuration.updateBuildConfiguration': 'automatic',
      'java.format.settings.url': 'https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml'
    },
    [ProgrammingLanguage.GO]: {
      'go.formatTool': 'gofmt',
      'go.lintTool': 'golangci-lint',
      'go.testFlags': ['-v']
    },
    [ProgrammingLanguage.RUST]: {
      'rust-analyzer.checkOnSave.command': 'clippy',
      'rust-analyzer.cargo.buildScripts.enable': true
    },
    [ProgrammingLanguage.JAVASCRIPT]: {
      'javascript.suggest.autoImports': true,
      'javascript.updateImportsOnFileMove.enabled': 'always'
    },
    [ProgrammingLanguage.CSHARP]: {
      'dotnet.completion.showCompletionItemsFromUnimportedNamespaces': true,
      'omnisharp.enableEditorConfigSupport': true
    },
    [ProgrammingLanguage.PHP]: {
      'php.suggest.basic': true,
      'php.validate.enable': true
    }
  };

  return settings[language] || {};
}

/**
 * 获取语言ID
 */
export function getLanguageId(language: ProgrammingLanguage): string {
  const ids: Record<ProgrammingLanguage, string> = {
    [ProgrammingLanguage.TYPESCRIPT]: 'typescript',
    [ProgrammingLanguage.JAVASCRIPT]: 'javascript',
    [ProgrammingLanguage.PYTHON]: 'python',
    [ProgrammingLanguage.JAVA]: 'java',
    [ProgrammingLanguage.GO]: 'go',
    [ProgrammingLanguage.RUST]: 'rust',
    [ProgrammingLanguage.CSHARP]: 'csharp',
    [ProgrammingLanguage.PHP]: 'php'
  };

  return ids[language] || language;
}
