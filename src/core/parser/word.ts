/**
 * Word 文档解析器
 * 支持 .docx 格式
 */

import fs from 'fs-extra';
import { Logger } from '../../utils/logger';

// 注意: 实际需要安装 docx 解析库
// npm install mammoth

export class WordParser {
  private logger = Logger.getInstance('WordParser');

  /**
   * 解析 Word 文档
   */
  async parse(filePath: string): Promise<string> {
    this.logger.info(`解析 Word 文档: ${filePath}`);

    try {
      // 检查文件是否存在
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 尝试使用 mammoth 解析
      // 如果未安装，返回提示
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (e) {
        this.logger.warn('mammoth 未安装，使用备选方案');
        return this.fallbackParse(filePath);
      }
    } catch (error) {
      this.logger.error('Word 文档解析失败:', error);
      throw error;
    }
  }

  /**
   * 备选解析方案 (读取纯文本)
   */
  private async fallbackParse(filePath: string): Promise<string> {
    // 简单实现 - 实际应该使用专门的库
    const content = await fs.readFile(filePath);
    // 尝试提取可见字符
    const text = content.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '');
    return text || '无法解析 Word 文档，请转换为 Markdown 格式';
  }
}

export default WordParser;
