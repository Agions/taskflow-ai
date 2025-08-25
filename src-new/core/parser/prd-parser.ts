/**
 * TaskFlow AI 统一文档解析器
 * 整合原有的PRD解析功能，支持多种文档格式
 */

import fs from 'fs-extra';
import path from 'path';
import MarkdownIt from 'markdown-it';
import { ConfigManager } from '../../infrastructure/config/manager';

export interface ParsedContent {
  text: string;
  structure: DocumentStructure;
  metadata: DocumentMetadata;
}

export interface DocumentStructure {
  title: string;
  sections: DocumentSection[];
  requirements: ParsedRequirement[];
  features: ParsedFeature[];
  acceptanceCriteria: string[];
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string;
  subsections: DocumentSection[];
}

export interface ParsedRequirement {
  id: string;
  title: string;
  description: string;
  priority: RequirementPriority;
  type: RequirementType;
  acceptanceCriteria: string[];
  dependencies: string[];
  estimatedEffort: number;
  metadata: Record<string, any>;
}

export interface ParsedFeature {
  id: string;
  name: string;
  description: string;
  priority: RequirementPriority;
  requirements: string[];
  userStories: UserStory[];
  metadata: Record<string, any>;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: RequirementPriority;
  estimatedPoints: number;
}

export interface DocumentMetadata {
  filename: string;
  filesize: number;
  format: DocumentFormat;
  createdAt: Date;
  modifiedAt: Date;
  encoding: string;
  language: string;
  version: string;
  author?: string;
  project?: string;
}

export enum DocumentFormat {
  MARKDOWN = 'markdown',
  WORD = 'word',
  PDF = 'pdf',
  HTML = 'html',
  TEXT = 'text'
}

export enum RequirementPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum RequirementType {
  FUNCTIONAL = 'functional',
  NON_FUNCTIONAL = 'non_functional',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  UI_UX = 'ui_ux'
}

export interface ParseOptions {
  language?: string;
  extractImages?: boolean;
  includeMetadata?: boolean;
  parseRequirements?: boolean;
  parseFeatures?: boolean;
  customPatterns?: Record<string, RegExp>;
}

/**
 * 统一文档解析器
 * 支持多种格式的PRD文档解析
 */
export class DocumentParser {
  private markdown: MarkdownIt;
  private configManager: ConfigManager;
  private requirementPatterns: Map<string, RegExp>;
  private featurePatterns: Map<string, RegExp>;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.markdown = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });

    this.initializePatterns();
  }

  /**
   * 解析文档
   */
  async parse(filePath: string, options?: ParseOptions): Promise<ParsedContent> {
    console.log(`📄 开始解析文档: ${filePath}`);

    // 检查文件是否存在
    if (!await fs.pathExists(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 获取文件信息
    const stats = await fs.stat(filePath);
    const format = this.detectFormat(filePath);

    // 读取文件内容
    const rawContent = await this.readFile(filePath, format);

    // 创建元数据
    const metadata: DocumentMetadata = {
      filename: path.basename(filePath),
      filesize: stats.size,
      format,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      encoding: 'utf-8',
      language: options?.language || 'zh-CN',
      version: '1.0',
    };

    // 解析内容
    const structure = await this.parseContent(rawContent, format, options);

    const parsedContent: ParsedContent = {
      text: rawContent,
      structure,
      metadata,
    };

    console.log(`✅ 文档解析完成: 发现 ${structure.requirements.length} 个需求, ${structure.features.length} 个功能`);
    return parsedContent;
  }

  /**
   * 检测文档格式
   */
  private detectFormat(filePath: string): DocumentFormat {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.md':
      case '.markdown':
        return DocumentFormat.MARKDOWN;
      case '.doc':
      case '.docx':
        return DocumentFormat.WORD;
      case '.pdf':
        return DocumentFormat.PDF;
      case '.html':
      case '.htm':
        return DocumentFormat.HTML;
      default:
        return DocumentFormat.TEXT;
    }
  }

  /**
   * 读取文件内容
   */
  private async readFile(filePath: string, format: DocumentFormat): Promise<string> {
    switch (format) {
      case DocumentFormat.MARKDOWN:
      case DocumentFormat.TEXT:
      case DocumentFormat.HTML:
        return await fs.readFile(filePath, 'utf-8');
      
      case DocumentFormat.WORD:
        return await this.parseWordDocument(filePath);
      
      case DocumentFormat.PDF:
        return await this.parsePDFDocument(filePath);
      
      default:
        throw new Error(`不支持的文档格式: ${format}`);
    }
  }

  /**
   * 解析文档内容
   */
  private async parseContent(
    content: string, 
    format: DocumentFormat, 
    options?: ParseOptions
  ): Promise<DocumentStructure> {
    
    // 解析文档结构
    const sections = this.parseSections(content, format);
    const title = this.extractTitle(sections);

    // 解析需求
    const requirements = options?.parseRequirements !== false 
      ? this.parseRequirements(content, options)
      : [];

    // 解析功能特性
    const features = options?.parseFeatures !== false
      ? this.parseFeatures(content, options)
      : [];

    // 提取验收标准
    const acceptanceCriteria = this.extractAcceptanceCriteria(content);

    return {
      title,
      sections,
      requirements,
      features,
      acceptanceCriteria,
    };
  }

  /**
   * 解析文档章节
   */
  private parseSections(content: string, format: DocumentFormat): DocumentSection[] {
    if (format === DocumentFormat.MARKDOWN) {
      return this.parseMarkdownSections(content);
    } else {
      return this.parseTextSections(content);
    }
  }

  /**
   * 解析Markdown章节
   */
  private parseMarkdownSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    
    let currentSection: DocumentSection | null = null;
    let sectionContent: string[] = [];
    let sectionCounter = 0;

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // 保存前一个章节
        if (currentSection) {
          currentSection.content = sectionContent.join('\n').trim();
          sections.push(currentSection);
        }

        // 创建新章节
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        
        currentSection = {
          id: `section_${++sectionCounter}`,
          title,
          level,
          content: '',
          subsections: [],
        };
        
        sectionContent = [];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }

    // 保存最后一个章节
    if (currentSection) {
      currentSection.content = sectionContent.join('\n').trim();
      sections.push(currentSection);
    }

    // 构建章节层次结构
    return this.buildSectionHierarchy(sections);
  }

  /**
   * 解析普通文本章节
   */
  private parseTextSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    
    let sectionCounter = 0;
    
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (trimmed.length === 0) continue;

      // 简单的标题检测
      const lines = trimmed.split('\n');
      const firstLine = lines[0];
      
      if (this.isLikelyTitle(firstLine)) {
        sections.push({
          id: `section_${++sectionCounter}`,
          title: firstLine,
          level: 1,
          content: lines.slice(1).join('\n').trim(),
          subsections: [],
        });
      } else {
        sections.push({
          id: `section_${++sectionCounter}`,
          title: `段落 ${sectionCounter}`,
          level: 1,
          content: trimmed,
          subsections: [],
        });
      }
    }

    return sections;
  }

  /**
   * 构建章节层次结构
   */
  private buildSectionHierarchy(flatSections: DocumentSection[]): DocumentSection[] {
    const hierarchy: DocumentSection[] = [];
    const stack: DocumentSection[] = [];

    for (const section of flatSections) {
      // 移除栈中级别大于等于当前章节的项
      while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // 顶级章节
        hierarchy.push(section);
      } else {
        // 子章节
        stack[stack.length - 1].subsections.push(section);
      }

      stack.push(section);
    }

    return hierarchy;
  }

  /**
   * 提取文档标题
   */
  private extractTitle(sections: DocumentSection[]): string {
    if (sections.length > 0) {
      return sections[0].title;
    }
    return '未命名文档';
  }

  /**
   * 解析需求
   */
  private parseRequirements(content: string, options?: ParseOptions): ParsedRequirement[] {
    const requirements: ParsedRequirement[] = [];
    let requirementCounter = 0;

    // 使用正则表达式匹配需求
    for (const [patternName, pattern] of this.requirementPatterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        const requirement = this.extractRequirementFromMatch(match, ++requirementCounter, patternName);
        if (requirement) {
          requirements.push(requirement);
        }
      }
    }

    // 去重
    return this.deduplicateRequirements(requirements);
  }

  /**
   * 解析功能特性
   */
  private parseFeatures(content: string, options?: ParseOptions): ParsedFeature[] {
    const features: ParsedFeature[] = [];
    let featureCounter = 0;

    // 使用正则表达式匹配功能
    for (const [patternName, pattern] of this.featurePatterns) {
      const matches = content.matchAll(pattern);
      
      for (const match of matches) {
        const feature = this.extractFeatureFromMatch(match, ++featureCounter, patternName);
        if (feature) {
          features.push(feature);
        }
      }
    }

    return features;
  }

  /**
   * 提取验收标准
   */
  private extractAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];
    
    // 匹配验收标准的模式
    const patterns = [
      /验收标准[：:]\s*([^\n]+)/gi,
      /acceptance criteria[：:]\s*([^\n]+)/gi,
      /测试场景[：:]\s*([^\n]+)/gi,
      /- \[验收\]\s*([^\n]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim()) {
          criteria.push(match[1].trim());
        }
      }
    }

    return [...new Set(criteria)]; // 去重
  }

  /**
   * 从匹配结果提取需求
   */
  private extractRequirementFromMatch(
    match: RegExpMatchArray, 
    index: number, 
    patternName: string
  ): ParsedRequirement | null {
    
    const title = match[1]?.trim();
    const description = match[2]?.trim() || match[1]?.trim();
    
    if (!title || !description) {
      return null;
    }

    return {
      id: `req_${index}`,
      title,
      description,
      priority: this.extractPriority(match[0]),
      type: this.inferRequirementType(title, description),
      acceptanceCriteria: this.extractCriteriaFromText(match[0]),
      dependencies: [],
      estimatedEffort: this.estimateEffort(description),
      metadata: {
        source: patternName,
        matchText: match[0],
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 从匹配结果提取功能
   */
  private extractFeatureFromMatch(
    match: RegExpMatchArray, 
    index: number, 
    patternName: string
  ): ParsedFeature | null {
    
    const name = match[1]?.trim();
    const description = match[2]?.trim() || match[1]?.trim();
    
    if (!name || !description) {
      return null;
    }

    return {
      id: `feature_${index}`,
      name,
      description,
      priority: this.extractPriority(match[0]),
      requirements: [],
      userStories: [],
      metadata: {
        source: patternName,
        matchText: match[0],
        extractedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 提取优先级
   */
  private extractPriority(text: string): RequirementPriority {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('紧急') || lowerText.includes('critical') || lowerText.includes('高优先级')) {
      return RequirementPriority.CRITICAL;
    } else if (lowerText.includes('重要') || lowerText.includes('high') || lowerText.includes('优先')) {
      return RequirementPriority.HIGH;
    } else if (lowerText.includes('低') || lowerText.includes('low')) {
      return RequirementPriority.LOW;
    } else {
      return RequirementPriority.MEDIUM;
    }
  }

  /**
   * 推断需求类型
   */
  private inferRequirementType(title: string, description: string): RequirementType {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('ui') || text.includes('界面') || text.includes('交互') || text.includes('用户体验')) {
      return RequirementType.UI_UX;
    } else if (text.includes('性能') || text.includes('安全') || text.includes('可靠性') || text.includes('扩展性')) {
      return RequirementType.NON_FUNCTIONAL;
    } else if (text.includes('技术') || text.includes('架构') || text.includes('api') || text.includes('数据库')) {
      return RequirementType.TECHNICAL;
    } else if (text.includes('业务') || text.includes('流程') || text.includes('规则')) {
      return RequirementType.BUSINESS;
    } else {
      return RequirementType.FUNCTIONAL;
    }
  }

  /**
   * 从文本提取验收标准
   */
  private extractCriteriaFromText(text: string): string[] {
    const criteria: string[] = [];
    
    // 查找列表项作为验收标准
    const listItems = text.match(/[-*+]\s+(.+)/g);
    if (listItems) {
      criteria.push(...listItems.map(item => item.replace(/^[-*+]\s+/, '').trim()));
    }

    return criteria;
  }

  /**
   * 估算工作量
   */
  private estimateEffort(description: string): number {
    const words = description.split(/\s+/).length;
    
    // 简单的工作量估算算法
    if (words < 20) {
      return 2; // 2小时
    } else if (words < 50) {
      return 4; // 4小时
    } else if (words < 100) {
      return 8; // 1天
    } else {
      return 16; // 2天
    }
  }

  /**
   * 去重需求
   */
  private deduplicateRequirements(requirements: ParsedRequirement[]): ParsedRequirement[] {
    const unique = new Map<string, ParsedRequirement>();
    
    for (const req of requirements) {
      const key = req.title.toLowerCase().trim();
      if (!unique.has(key) || unique.get(key)!.description.length < req.description.length) {
        unique.set(key, req);
      }
    }
    
    return Array.from(unique.values());
  }

  /**
   * 判断是否像标题
   */
  private isLikelyTitle(text: string): boolean {
    return text.length < 100 && 
           !text.includes('。') && 
           !text.includes('：') &&
           text.trim().length > 0;
  }

  /**
   * 解析Word文档（占位符实现）
   */
  private async parseWordDocument(filePath: string): Promise<string> {
    // TODO: 实现Word文档解析
    throw new Error('Word文档解析功能尚未实现');
  }

  /**
   * 解析PDF文档（占位符实现）
   */
  private async parsePDFDocument(filePath: string): Promise<string> {
    // TODO: 实现PDF文档解析
    throw new Error('PDF文档解析功能尚未实现');
  }

  /**
   * 初始化匹配模式
   */
  private initializePatterns(): void {
    this.requirementPatterns = new Map([
      // 需求模式
      ['requirement_numbered', /(?:需求|要求|Requirement)\s*(\d+)[：:]\s*(.+?)(?=\n(?:需求|要求|Requirement|\d+\.|$))/gis],
      ['requirement_listed', /[-*+]\s*(?:需求|要求)[：:]?\s*(.+?)(?:\n|$)/gi],
      ['requirement_section', /(?:^|\n)#+\s*(.+?)(?:需求|要求).*?\n((?:(?!^#).+\n?)*)/gim],
      
      // 功能模式
      ['function_point', /(?:功能点|Function)[：:]\s*(.+?)(?:\n|$)/gi],
      ['user_story', /作为(.+?)，我希望(.+?)，以便(.+?)。/gi],
      
      // 场景模式
      ['scenario', /(?:场景|情况|Scenario)[：:]\s*(.+?)(?:\n|$)/gi],
    ]);

    this.featurePatterns = new Map([
      // 功能特性模式
      ['feature_header', /(?:^|\n)#+\s*(.+?)(?:功能|特性|Feature).*?\n((?:(?!^#).+\n?)*)/gim],
      ['feature_list', /[-*+]\s*(?:功能|特性|Feature)[：:]?\s*(.+?)(?:\n|$)/gi],
      ['module', /(?:模块|Module)[：:]\s*(.+?)(?:\n|$)/gi],
    ]);
  }

  /**
   * 获取解析器状态
   */
  getStatus(): any {
    return {
      supportedFormats: Object.values(DocumentFormat),
      requirementPatterns: this.requirementPatterns.size,
      featurePatterns: this.featurePatterns.size,
    };
  }
}