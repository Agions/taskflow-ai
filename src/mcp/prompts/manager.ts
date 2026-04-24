/**
 * MCP提示管理器
 * 管理AI提示模板和生成智能提示
 */

import path = require('path');
import fs = require('fs-extra');
import { Logger } from '../../utils/logger';
import { MCPPrompt, PromptRenderOptions, PromptArguments, MCPPromptManagerConfig } from './types';
import { defaultPrompts } from './defaults';
import { PromptLoader } from './loader';
import { PromptRenderer } from './renderer';

export * from './types';

export class MCPPromptManager {
  private prompts: Map<string, MCPPrompt> = new Map();
  private logger: Logger;
  private promptsDir: string;
  private loader: PromptLoader;
  private renderer: PromptRenderer;

  constructor(
    private config: MCPPromptManagerConfig = {},
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance('MCPPromptManager');
    const cfg = this.config;
    this.promptsDir = cfg.promptsDir ?? path.join(process.cwd(), '.taskflow', 'prompts');
    this.loader = new PromptLoader(this.promptsDir, this.logger);
    this.renderer = new PromptRenderer(this.logger);
  }

  async initialize(): Promise<void> {
    this.logger.info('正在初始化MCP提示管理器...');
    await fs.ensureDir(this.promptsDir);
    await this.registerDefaultPrompts();
    await this.loadCustomPrompts();
    this.logger.info(`提示管理器初始化完成，共加载 ${this.prompts.size} 个提示`);
  }

  private async registerDefaultPrompts(): Promise<void> {
    for (const prompt of defaultPrompts) {
      this.prompts.set(prompt.name, prompt);
    }
  }

  private async loadCustomPrompts(): Promise<void> {
    const customPrompts = await this.loader.loadCustomPrompts();
    for (const prompt of customPrompts) {
      this.prompts.set(prompt.name, prompt);
    }
  }

  getPrompt(name: string): MCPPrompt | undefined {
    return this.prompts.get(name);
  }

  getAllPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  getPromptsByCategory(category: string): MCPPrompt[] {
    return this.getAllPrompts().filter(p => p.category === category);
  }

  async registerPrompt(prompt: MCPPrompt): Promise<void> {
    this.prompts.set(prompt.name, prompt);
    await this.loader.savePrompt(prompt);
    this.logger.info(`注册提示: ${prompt.name}`);
  }

  async unregisterPrompt(name: string): Promise<void> {
    this.prompts.delete(name);
    await this.loader.deletePromptFile(name);
    this.logger.info(`注销提示: ${name}`);
  }

  renderPrompt(name: string, args: PromptArguments, options?: PromptRenderOptions): string {
    const prompt = this.getPrompt(name);
    if (!prompt) {
      throw new Error(`提示不存在: ${name}`);
    }
    return this.renderer.render(prompt, args, options);
  }

  validatePromptArgs(name: string, args: PromptArguments): { valid: boolean; errors: string[] } {
    const prompt = this.getPrompt(name);
    if (!prompt) {
      return { valid: false, errors: [`提示不存在: ${name}`] };
    }
    return this.renderer.validateArgs(prompt, args);
  }
}
