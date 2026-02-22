/**
 * PRD解析器
 */

export * from './enhanced';
export * from './word';
export * from './pdf';

import path from 'path';
import fs from 'fs-extra';
import MarkdownIt from 'markdown-it';
import { PRDDocument, PRDSection, TaskFlowConfig } from '../../types';
import { SUPPORTED_PRD_FORMATS } from '../../constants';
import { createTaskFlowError } from '../../utils/errors';
import { Logger } from '../../utils/logger';

export class PRDParser {
  private logger: Logger;
  private markdown: MarkdownIt;

  constructor(private config: TaskFlowConfig) {
    this.logger = Logger.getInstance('PRDParser');
    this.markdown = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
  }

  /**
   * 解析PRD文档
   */
  async parse(filePath: string): Promise<PRDDocument> {
    this.logger.info(`开始解析PRD文档: ${filePath}`);

    try {
      // 检查文件是否存在
      if (!(await fs.pathExists(filePath))) {
        throw createTaskFlowError('parsing', 'FILE_NOT_FOUND', `文件不存在: ${filePath}`);
      }

      // 检查文件格式
      const ext = path.extname(filePath).toLowerCase();
      if (!SUPPORTED_PRD_FORMATS.includes(ext as any)) {
        throw createTaskFlowError('parsing', 'UNSUPPORTED_FORMAT', `不支持的文件格式: ${ext}`);
      }

      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf-8');

      // 解析文档
      const document = await this.parseContent(content, filePath);

      this.logger.info(`PRD文档解析完成，包含 ${document.sections.length} 个章节`);

      return document;
    } catch (error) {
      this.logger.error('PRD解析失败:', error);
      throw error;
    }
  }

  /**
   * 解析文档内容
   */
  private async parseContent(content: string, filePath: string): Promise<PRDDocument> {
    const fileName = path.basename(filePath, path.extname(filePath));

    // 解析Markdown内容
    const tokens = this.markdown.parse(content, {});

    // 提取文档信息
    const title = this.extractTitle(tokens) || fileName;
    const sections = this.extractSections(tokens);

    // 估算复杂度和工时
    const estimatedHours = this.estimateWorkHours(sections);
    const complexity = this.determineComplexity(sections, estimatedHours);

    const document: PRDDocument = {
      id: `prd-${Date.now()}`,
      title,
      version: '1.0.0',
      filePath,
      content,
      metadata: {
        author: 'Unknown',
        createDate: new Date(),
        lastModified: new Date(),
        tags: [],
        priority: 'medium',
        complexity,
        estimatedHours,
      },
      sections,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return document;
  }

  /**
   * 提取文档标题
   */
  private extractTitle(tokens: any[]): string | null {
    for (const token of tokens) {
      if (token.type === 'heading_open' && token.tag === 'h1') {
        const nextToken = tokens[tokens.indexOf(token) + 1];
        if (nextToken && nextToken.type === 'inline') {
          return nextToken.content;
        }
      }
    }
    return null;
  }

  /**
   * 提取文档章节
   */
  private extractSections(tokens: any[]): PRDSection[] {
    const sections: PRDSection[] = [];
    let currentSection: Partial<PRDSection> | null = null;
    let sectionOrder = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'heading_open' && ['h2', 'h3'].includes(token.tag)) {
        // 保存之前的章节
        if (currentSection) {
          sections.push(currentSection as PRDSection);
        }

        // 开始新章节
        const nextToken = tokens[i + 1];
        const title = nextToken?.content || 'Untitled Section';

        currentSection = {
          id: `section-${Date.now()}-${sectionOrder}`,
          title,
          type: this.determineSectionType(title),
          content: '',
          requirements: [],
          dependencies: [],
          order: sectionOrder++,
        };
      } else if (currentSection && token.content) {
        // 添加内容到当前章节
        currentSection.content += token.content + '\n';
      }
    }

    // 添加最后一个章节
    if (currentSection) {
      sections.push(currentSection as PRDSection);
    }

    return sections;
  }

  /**
   * 确定章节类型
   */
  private determineSectionType(title: string): PRDSection['type'] {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('概述') || lowerTitle.includes('overview')) {
      return 'overview';
    } else if (lowerTitle.includes('需求') || lowerTitle.includes('requirement')) {
      return 'requirements';
    } else if (lowerTitle.includes('功能') || lowerTitle.includes('function')) {
      return 'functional';
    } else if (lowerTitle.includes('技术') || lowerTitle.includes('technical')) {
      return 'technical';
    } else if (
      lowerTitle.includes('界面') ||
      lowerTitle.includes('ui') ||
      lowerTitle.includes('ux')
    ) {
      return 'ui-ux';
    } else if (lowerTitle.includes('验收') || lowerTitle.includes('acceptance')) {
      return 'acceptance';
    } else {
      return 'functional';
    }
  }

  /**
   * 估算工时
   */
  private estimateWorkHours(sections: PRDSection[]): number {
    let totalHours = 0;

    for (const section of sections) {
      const wordCount = section.content.length;
      const complexity = wordCount > 1000 ? 'complex' : wordCount > 500 ? 'medium' : 'simple';

      switch (complexity) {
        case 'simple':
          totalHours += 8;
          break;
        case 'medium':
          totalHours += 16;
          break;
        case 'complex':
          totalHours += 32;
          break;
      }
    }

    return Math.max(totalHours, 8); // 最少8小时
  }

  /**
   * 确定复杂度
   */
  private determineComplexity(
    sections: PRDSection[],
    estimatedHours: number
  ): 'simple' | 'medium' | 'complex' | 'epic' {
    if (estimatedHours > 200) return 'epic';
    if (estimatedHours > 80) return 'complex';
    if (estimatedHours > 40) return 'medium';
    return 'simple';
  }
}
