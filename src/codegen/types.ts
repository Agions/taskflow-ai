/**
 * 代码生成类型定义
 * TaskFlow AI v3.0 - 代码生成与同步
 */

// 代码模板
export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  language: string;
  version: string;
  template: string;
  partials?: Record<string, string>; // Handlebars partials
  variables: TemplateVariable[];
  validation: ValidationRule[];
  metadata: TemplateMetadata;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  description?: string;
  options?: string[]; // 可选值列表
}

export interface ValidationRule {
  rule: string;
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
}

export interface TemplateMetadata {
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: 'component' | 'page' | 'api' | 'model' | 'test' | 'config' | 'other';
  complexity: 'simple' | 'medium' | 'complex';
}

// 模板上下文
export interface TemplateContext {
  [key: string]: unknown;
  projectName?: string;
  componentName?: string;
  description?: string;
  props?: ComponentProp[];
  imports?: string[];
  exports?: string[];
}

// 组件规范
export interface ComponentSpec {
  name: string;
  description: string;
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla';
  language: 'typescript' | 'javascript';
  props?: ComponentProp[];
  hasState?: boolean;
  hasEffects?: boolean;
  hasStyles?: boolean;
  styleType?: 'css' | 'scss' | 'styled' | 'css-in-js' | 'tailwind';
  testType?: 'jest' | 'vitest' | 'cypress' | 'playwright';
}

export interface ComponentProp {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: string;
  description?: string;
}

// 生成的组件
export interface GeneratedComponent {
  name: string;
  framework: string;
  files: GeneratedFile[];
  metadata: {
    generatedAt: Date;
    templateId: string;
    variables: Record<string, unknown>;
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'tsx' | 'ts' | 'jsx' | 'js' | 'css' | 'scss' | 'test' | 'other';
}

// 代码生成结果
export interface CodeGenerationResult {
  success: boolean;
  component?: GeneratedComponent;
  error?: string;
  warnings?: string[];
}

// 代码生成引擎配置
export interface CodegenConfig {
  templatesDir: string;
  outputDir: string;
  defaultFramework: string;
  defaultLanguage: string;
  autoFormat: boolean;
  autoLint: boolean;
  prettierConfig?: Record<string, unknown>;
}

// 框架配置
export interface FrameworkConfig {
  name: string;
  extensions: string[];
  componentPatterns: ComponentPattern[];
  fileStructure: FileStructure;
}

export interface ComponentPattern {
  type: 'functional' | 'class' | 'hook';
  template: string;
  imports: string[];
}

export interface FileStructure {
  styleFile: boolean;
  testFile: boolean;
  storyFile: boolean;
  indexFile: boolean;
}

// 同步配置
export interface SyncConfig {
  strategy: 'overwrite' | 'merge' | 'skip';
  backup: boolean;
  dryRun: boolean;
  ignorePatterns: string[];
}

// 代码生成请求
export interface CodegenRequest {
  spec: ComponentSpec;
  templateId?: string;
  variables?: Record<string, unknown>;
  sync?: SyncConfig;
}

// 模板仓库
export interface TemplateRepository {
  id: string;
  name: string;
  url: string;
  type: 'git' | 'npm' | 'local';
  templates: string[];
}

// 代码质量检查
export interface CodeQualityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// 生成统计
export interface GenerationStats {
  totalFiles: number;
  totalLines: number;
  duration: number;
  templatesUsed: string[];
}
