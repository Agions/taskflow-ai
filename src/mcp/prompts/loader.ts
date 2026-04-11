import { getLogger } from '../../utils/logger';
/**
 * 提示加载器
 */

import path from 'path';
import fs from 'fs-extra';
import { MCPPrompt } from './types';
import { Logger } from '../../utils/logger';
const logger = getLogger('mcp/prompts/loader');

export class PromptLoader {
  constructor(
    private promptsDir: string,
    private logger: Logger
  ) {}

  /**
   * 加载自定义提示
   */
  async loadCustomPrompts(): Promise<MCPPrompt[]> {
    const prompts: MCPPrompt[] = [];

    try {
      const files = await fs.readdir(this.promptsDir);
      const promptFiles = files.filter(f => f.endsWith('.json'));

      for (const file of promptFiles) {
        try {
          const content = await fs.readJson(path.join(this.promptsDir, file));
          if (this.validatePrompt(content)) {
            prompts.push(content);
            this.logger.info(`加载自定义提示: ${content.name}`);
          }
        } catch (error) {
          this.logger.warn(`加载提示文件失败 ${file}:`, error);
        }
      }
    } catch (error) {
      this.logger.warn('读取提示目录失败:', error);
    }

    return prompts;
  }

  /**
   * 保存提示到文件
   */
  async savePrompt(prompt: MCPPrompt): Promise<void> {
    const filePath = path.join(this.promptsDir, `${prompt.name}.json`);
    await fs.writeJson(filePath, prompt, { spaces: 2 });
  }

  /**
   * 删除提示文件
   */
  async deletePromptFile(name: string): Promise<void> {
    const filePath = path.join(this.promptsDir, `${name}.json`);
    await fs.remove(filePath);
  }

  /**
   * 验证提示格式
   */
  /** 验证原始提示对象（来自 JSON 文件） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validatePrompt(prompt: any): prompt is MCPPrompt {
    return (
      prompt &&
      typeof prompt.name === 'string' &&
      typeof prompt.template === 'string' &&
      Array.isArray(prompt.arguments)
    );
  }
}
