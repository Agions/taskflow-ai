import { getLogger } from '../../utils/logger';
/**
 * 提示渲染器
 */

import Handlebars from 'handlebars';
import { MCPPrompt, PromptRenderOptions } from './types';
import { Logger } from '../../utils/logger';
const logger = getLogger('mcp/prompts/renderer');

export class PromptRenderer {
  private compiledCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private logger: Logger) {}

  /**
   * 渲染提示模板
   */
  render(prompt: MCPPrompt, args: Record<string, any>, options: PromptRenderOptions = {}): string {
    try {
      const template = this.getCompiledTemplate(prompt);
      const context = this.buildContext(prompt, args);
      return template(context);
    } catch (error) {
      this.logger.error('渲染提示失败:', error);
      if (options.strict) {
        throw error;
      }
      return options.fallback || prompt.template;
    }
  }

  /**
   * 批量渲染
   */
  renderBatch(prompt: MCPPrompt, argsList: Record<string, any>[]): string[] {
    return argsList.map(args => this.render(prompt, args));
  }

  /**
   * 验证参数
   */
  validateArgs(prompt: MCPPrompt, args: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const arg of prompt.arguments) {
      if (arg.required && !(arg.name in args)) {
        errors.push(`缺少必需参数: ${arg.name}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 获取编译后的模板
   */
  private getCompiledTemplate(prompt: MCPPrompt): HandlebarsTemplateDelegate {
    const cacheKey = `${prompt.name}@${prompt.version}`;

    if (!this.compiledCache.has(cacheKey)) {
      this.compiledCache.set(cacheKey, Handlebars.compile(prompt.template));
    }

    return this.compiledCache.get(cacheKey)!;
  }

  /**
   * 构建渲染上下文
   */
  private buildContext(prompt: MCPPrompt, args: Record<string, any>): Record<string, any> {
    const context: Record<string, any> = {};

    for (const arg of prompt.arguments) {
      context[arg.name] = args[arg.name] ?? arg.default;
    }

    return context;
  }
}

type HandlebarsTemplateDelegate = (context: unknown) => string;
