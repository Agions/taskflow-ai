/**
 * PDF 文档解析器
 * 支持 .pdf 格式
 */

import fs from 'fs-extra';
import { Logger } from '../../utils/logger';

export class PDFParser {
  private logger = Logger.getInstance('PDFParser');

  /**
   * 解析 PDF 文档
   */
  async parse(filePath: string): Promise<string> {
    this.logger.info(`解析 PDF 文档: ${filePath}`);

    try {
      // 检查文件是否存在
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 尝试使用 pdf-parse
      // 如果未安装，返回提示
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
      } catch (e) {
        this.logger.warn('pdf-parse 未安装，使用备选方案');
        return this.fallbackParse(filePath);
      }
    } catch (error) {
      this.logger.error('PDF 文档解析失败:', error);
      throw error;
    }
  }

  /**
   * 备选解析方案
   */
  private async fallbackParse(filePath: string): Promise<string> {
    // 简单实现 - 实际应该使用专门的库
    return '无法解析 PDF 文档，请转换为 Markdown 格式。\n\n如需启用 PDF 支持，请运行: npm install pdf-parse';
  }
}

export default PDFParser;
