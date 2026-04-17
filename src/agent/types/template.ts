import { getLogger } from '../../utils/logger';
const logger = getLogger('agent/types/template');

/**
 * 模板相关类型
 */

/**
 * 代码模板
 */
export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  language: string;
  template: string;
  variables: TemplateVariable[];
  validation: ValidationRule[];
}

/**
 * 模板变量
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  description?: string;
}

/**
 * 验证规则
 */
export interface ValidationRule {
  rule: string;
  pattern?: string;
  message?: string;
}

/**
 * 模板上下文
 */
export interface TemplateContext {
  [key: string]: unknown;
}

/**
 * 组件规格
 */
export interface ComponentSpec {
  name: string;
  description: string;
  framework: string;
  props?: ComponentProp[];
  hasState?: boolean;
  hasEffects?: boolean;
  hasStyles?: boolean;
}

/**
 * 组件属性
 */
export interface ComponentProp {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: string;
}

/**
 * 生成的组件
 */
export interface GeneratedComponent {
  name: string;
  framework: string;
  files: GeneratedFile[];
}

/**
 * 生成的文件
 */
export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * 规划引擎接口
 */
export interface PlanningEngine {
  plan(prd: unknown): Promise<any>;
  analyzeRequirements(prd: unknown): Promise<any>;
  estimateEffort(tasks: unknown[]): Promise<unknown[]>;
}
