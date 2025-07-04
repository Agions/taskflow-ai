/**
 * 文档处理器 - 支持多种格式的文档解析
 * 作为PRD解析引擎的核心组件
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import MarkdownIt from 'markdown-it';
import { Logger } from '../../infra/logger';

/**
 * 文档类型枚举
 */
export enum DocumentType {
  MARKDOWN = 'markdown',
  TEXT = 'text',
  JSON = 'json',
  HTML = 'html',
  WORD = 'word',
  PDF = 'pdf'
}

/**
 * 文档结构接口
 */
export interface DocumentStructure {
  title: string;
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

/**
 * 文档章节接口
 */
export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  level: number;
  subsections: DocumentSection[];
  type: SectionType;
  keywords: string[];
  importance: number; // 0-1 重要性评分
}

/**
 * 章节类型枚举
 */
export enum SectionType {
  OVERVIEW = 'overview',
  REQUIREMENTS = 'requirements',
  FEATURES = 'features',
  TECHNICAL = 'technical',
  TIMELINE = 'timeline',
  RESOURCES = 'resources',
  APPENDIX = 'appendix',
  OTHER = 'other'
}

/**
 * 文档元数据接口
 */
export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  createdAt: Date;
  modifiedAt: Date;
  documentType: DocumentType;
  language: string;
  wordCount: number;
  estimatedReadTime: number; // 分钟
}

/**
 * 文档处理选项
 */
export interface ProcessingOptions {
  extractTables?: boolean;
  extractImages?: boolean;
  detectLanguage?: boolean;
  analyzeStructure?: boolean;
  extractKeywords?: boolean;
  calculateImportance?: boolean;
}

/**
 * 文档处理器类
 */
export class DocumentProcessor {
  private logger: Logger;
  private markdownParser: MarkdownIt;

  constructor(logger: Logger) {
    this.logger = logger;
    this.markdownParser = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });
  }

  /**
   * 处理文档文件
   * @param filePath 文件路径
   * @param options 处理选项
   */
  public async processDocument(
    filePath: string, 
    options: ProcessingOptions = {}
  ): Promise<DocumentStructure> {
    try {
      this.logger.info(`开始处理文档: ${filePath}`);

      // 检查文件是否存在
      if (!await fs.pathExists(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 获取文件信息
      const stats = await fs.stat(filePath);
      const documentType = this.detectDocumentType(filePath);

      // 读取文件内容
      const content = await this.readFileContent(filePath, documentType);

      // 生成元数据
      const metadata: DocumentMetadata = {
        fileName: path.basename(filePath),
        fileSize: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        documentType,
        language: options.detectLanguage ? this.detectLanguage(content) : 'zh-CN',
        wordCount: this.countWords(content),
        estimatedReadTime: Math.ceil(this.countWords(content) / 200) // 假设每分钟200字
      };

      // 解析文档结构
      const sections = await this.parseDocumentStructure(content, documentType, options);

      const documentStructure: DocumentStructure = {
        title: this.extractTitle(content, documentType) || metadata.fileName,
        sections,
        metadata
      };

      this.logger.info(`文档处理完成: ${sections.length} 个章节`);
      return documentStructure;

    } catch (error) {
      this.logger.error(`文档处理失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 检测文档类型
   * @param filePath 文件路径
   */
  private detectDocumentType(filePath: string): DocumentType {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.md':
      case '.markdown':
        return DocumentType.MARKDOWN;
      case '.txt':
        return DocumentType.TEXT;
      case '.json':
        return DocumentType.JSON;
      case '.html':
      case '.htm':
        return DocumentType.HTML;
      case '.docx':
      case '.doc':
        return DocumentType.WORD;
      case '.pdf':
        return DocumentType.PDF;
      default:
        return DocumentType.TEXT;
    }
  }

  /**
   * 读取文件内容
   * @param filePath 文件路径
   * @param documentType 文档类型
   */
  private async readFileContent(filePath: string, documentType: DocumentType): Promise<string> {
    switch (documentType) {
      case DocumentType.MARKDOWN:
      case DocumentType.TEXT:
      case DocumentType.HTML:
      case DocumentType.JSON:
        return await fs.readFile(filePath, 'utf-8');
      
      case DocumentType.WORD:
        // TODO: 实现Word文档解析
        this.logger.warn('Word文档解析暂未实现，将作为文本处理');
        return await fs.readFile(filePath, 'utf-8');
      
      case DocumentType.PDF:
        // TODO: 实现PDF文档解析
        this.logger.warn('PDF文档解析暂未实现，将作为文本处理');
        return await fs.readFile(filePath, 'utf-8');
      
      default:
        return await fs.readFile(filePath, 'utf-8');
    }
  }

  /**
   * 解析文档结构
   * @param content 文档内容
   * @param documentType 文档类型
   * @param options 处理选项
   */
  private async parseDocumentStructure(
    content: string, 
    documentType: DocumentType, 
    options: ProcessingOptions
  ): Promise<DocumentSection[]> {
    switch (documentType) {
      case DocumentType.MARKDOWN:
        return this.parseMarkdownStructure(content, options);
      case DocumentType.TEXT:
        return this.parseTextStructure(content, options);
      case DocumentType.JSON:
        return this.parseJsonStructure(content, options);
      case DocumentType.HTML:
        return this.parseHtmlStructure(content, options);
      default:
        return this.parseTextStructure(content, options);
    }
  }

  /**
   * 解析Markdown文档结构
   * @param content Markdown内容
   * @param options 处理选项
   */
  private parseMarkdownStructure(content: string, options: ProcessingOptions): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentSection: DocumentSection | null = null;
    let sectionCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测标题
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        
        // 保存上一个章节
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // 创建新章节
        currentSection = {
          id: `section-${++sectionCounter}`,
          title,
          content: '',
          level,
          subsections: [],
          type: this.classifySectionType(title),
          keywords: options.extractKeywords ? this.extractKeywords(title) : [],
          importance: options.calculateImportance ? this.calculateImportance(title, '') : 0.5
        };
      } else if (currentSection && line) {
        // 添加内容到当前章节
        currentSection.content += line + '\n';
      }
    }

    // 添加最后一个章节
    if (currentSection) {
      sections.push(currentSection);
    }

    // 后处理：更新重要性评分和关键词
    if (options.calculateImportance || options.extractKeywords) {
      sections.forEach(section => {
        if (options.extractKeywords) {
          section.keywords = this.extractKeywords(section.title + ' ' + section.content);
        }
        if (options.calculateImportance) {
          section.importance = this.calculateImportance(section.title, section.content);
        }
      });
    }

    return this.buildSectionHierarchy(sections);
  }

  /**
   * 解析纯文本文档结构
   * @param content 文本内容
   * @param options 处理选项
   */
  private parseTextStructure(content: string, options: ProcessingOptions): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      const lines = paragraph.trim().split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      sections.push({
        id: `section-${index + 1}`,
        title: title || `段落 ${index + 1}`,
        content,
        level: 1,
        subsections: [],
        type: this.classifySectionType(title),
        keywords: options.extractKeywords ? this.extractKeywords(paragraph) : [],
        importance: options.calculateImportance ? this.calculateImportance(title, content) : 0.5
      });
    });

    return sections;
  }

  /**
   * 解析JSON文档结构
   * @param content JSON内容
   * @param options 处理选项
   */
  private parseJsonStructure(content: string, _options: ProcessingOptions): DocumentSection[] {
    try {
      const data = JSON.parse(content);
      const sections: DocumentSection[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          sections.push(this.createSectionFromObject(item, `item-${index}`, 1));
        });
      } else if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value], index) => {
          sections.push(this.createSectionFromObject(
            { [key]: value }, 
            `section-${index + 1}`, 
            1
          ));
        });
      }

      return sections;
    } catch (error) {
      this.logger.error(`JSON解析失败: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * 解析HTML文档结构
   * @param content HTML内容
   * @param options 处理选项
   */
  private parseHtmlStructure(content: string, options: ProcessingOptions): DocumentSection[] {
    // 简化的HTML解析，提取标题和内容
    const sections: DocumentSection[] = [];
    const headerRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    let match;
    let sectionCounter = 0;

    while ((match = headerRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      
      sections.push({
        id: `section-${++sectionCounter}`,
        title,
        content: '', // TODO: 提取对应的内容
        level,
        subsections: [],
        type: this.classifySectionType(title),
        keywords: options.extractKeywords ? this.extractKeywords(title) : [],
        importance: options.calculateImportance ? this.calculateImportance(title, '') : 0.5
      });
    }

    return this.buildSectionHierarchy(sections);
  }

  /**
   * 从对象创建章节
   * @param obj 对象
   * @param id 章节ID
   * @param level 层级
   */
  private createSectionFromObject(obj: any, id: string, level: number): DocumentSection {
    const title = typeof obj === 'object' && obj !== null ? 
      Object.keys(obj)[0] || id : 
      String(obj);
    
    const content = typeof obj === 'object' && obj !== null ? 
      JSON.stringify(obj, null, 2) : 
      String(obj);

    return {
      id,
      title,
      content,
      level,
      subsections: [],
      type: this.classifySectionType(title),
      keywords: this.extractKeywords(content),
      importance: this.calculateImportance(title, content)
    };
  }

  /**
   * 构建章节层次结构
   * @param sections 扁平的章节列表
   */
  private buildSectionHierarchy(sections: DocumentSection[]): DocumentSection[] {
    const result: DocumentSection[] = [];
    const stack: DocumentSection[] = [];

    for (const section of sections) {
      // 找到合适的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // 顶级章节
        result.push(section);
      } else {
        // 子章节
        stack[stack.length - 1].subsections.push(section);
      }

      stack.push(section);
    }

    return result;
  }

  /**
   * 分类章节类型
   * @param title 章节标题
   */
  private classifySectionType(title: string): SectionType {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('概述') || titleLower.includes('overview') || titleLower.includes('简介')) {
      return SectionType.OVERVIEW;
    }
    if (titleLower.includes('需求') || titleLower.includes('requirement')) {
      return SectionType.REQUIREMENTS;
    }
    if (titleLower.includes('功能') || titleLower.includes('feature')) {
      return SectionType.FEATURES;
    }
    if (titleLower.includes('技术') || titleLower.includes('technical') || titleLower.includes('架构')) {
      return SectionType.TECHNICAL;
    }
    if (titleLower.includes('时间') || titleLower.includes('timeline') || titleLower.includes('计划')) {
      return SectionType.TIMELINE;
    }
    if (titleLower.includes('资源') || titleLower.includes('resource')) {
      return SectionType.RESOURCES;
    }
    if (titleLower.includes('附录') || titleLower.includes('appendix')) {
      return SectionType.APPENDIX;
    }
    
    return SectionType.OTHER;
  }

  /**
   * 提取关键词
   * @param text 文本内容
   */
  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 统计词频
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // 返回出现频率最高的词
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 计算章节重要性
   * @param title 标题
   * @param content 内容
   */
  private calculateImportance(title: string, content: string): number {
    let score = 0.5; // 基础分数
    
    // 基于标题的重要性关键词
    const importantKeywords = [
      '核心', '关键', '重要', '必须', '主要', 'core', 'key', 'important', 'critical', 'main'
    ];
    
    const titleLower = title.toLowerCase();
    importantKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) {
        score += 0.1;
      }
    });
    
    // 基于内容长度
    const contentLength = content.length;
    if (contentLength > 1000) score += 0.1;
    if (contentLength > 2000) score += 0.1;
    
    // 基于章节类型
    const sectionType = this.classifySectionType(title);
    switch (sectionType) {
      case SectionType.REQUIREMENTS:
      case SectionType.FEATURES:
        score += 0.2;
        break;
      case SectionType.TECHNICAL:
        score += 0.15;
        break;
      case SectionType.OVERVIEW:
        score += 0.1;
        break;
    }
    
    return Math.min(1.0, score);
  }

  /**
   * 提取文档标题
   * @param content 文档内容
   * @param documentType 文档类型
   */
  private extractTitle(content: string, documentType: DocumentType): string | null {
    switch (documentType) {
      case DocumentType.MARKDOWN: {
        const mdTitleMatch = content.match(/^#\s+(.+)$/m);
        return mdTitleMatch ? mdTitleMatch[1].trim() : null;
      }

      case DocumentType.HTML: {
        const htmlTitleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        return htmlTitleMatch ? htmlTitleMatch[1].replace(/<[^>]*>/g, '').trim() : null;
      }

      default: {
        const firstLine = content.split('\n')[0].trim();
        return firstLine.length > 0 && firstLine.length < 100 ? firstLine : null;
      }
    }
  }

  /**
   * 检测文档语言
   * @param content 文档内容
   */
  private detectLanguage(content: string): string {
    // 简化的语言检测
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    const totalChars = content.replace(/\s/g, '').length;
    
    if (chineseChars && chineseChars.length / totalChars > 0.3) {
      return 'zh-CN';
    }
    
    return 'en-US';
  }

  /**
   * 统计单词数量
   * @param content 文档内容
   */
  private countWords(content: string): number {
    // 中英文混合的单词统计
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    const englishWords = content.match(/[a-zA-Z]+/g);
    
    const chineseCount = chineseChars ? chineseChars.length : 0;
    const englishCount = englishWords ? englishWords.length : 0;
    
    return chineseCount + englishCount;
  }
}
