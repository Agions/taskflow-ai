import * as fs from 'fs-extra';
import * as path from 'path';
import { ModelCoordinator } from '../models/coordinator';
import { FileType, ParseOptions } from '../../types/model';
import { Logger } from '../../infra/logger';
// ConfigManager 未使用，已移除
import { DocumentProcessor, DocumentStructure, ProcessingOptions } from './document-processor';
import { RequirementExtractor, ExtractionOptions, ExtractionResult } from './requirement-extractor';
import { ParsedPRD, Feature, TaskType, TaskStatus } from '../../types/task';

/**
 * PRD解析结果接口
 */
export interface PRDParseResult {
  title: string;
  description: string;
  sections: PRDSection[];
}

/**
 * PRD章节接口
 */
export interface PRDSection {
  title: string;
  content: string;
  level: number;
  features: PRDFeature[];
  subsections?: PRDSection[];
}

/**
 * PRD功能特性接口
 */
export interface PRDFeature {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * PRD解析器类
 * 负责解析产品需求文档，整合文档处理和需求提取功能
 */
export class PRDParser {
  private modelCoordinator: ModelCoordinator;
  private logger: Logger;
  private documentProcessor: DocumentProcessor;
  private requirementExtractor: RequirementExtractor;

  /**
   * 创建PRD解析器实例
   * @param modelCoordinator 模型协调器实例
   * @param logger 日志记录器实例
   */
  constructor(modelCoordinator: ModelCoordinator, logger: Logger) {
    this.modelCoordinator = modelCoordinator;
    this.logger = logger;
    this.documentProcessor = new DocumentProcessor(logger);
    this.requirementExtractor = new RequirementExtractor(logger);
  }

  /**
   * 从文件中解析PRD
   * @param filePath PRD文件路径
   * @param options 解析选项
   */
  public async parseFromFile(filePath: string, options?: ParseOptions): Promise<ParsedPRD> {
    try {
      this.logger.info(`开始解析PRD文件：${filePath}`);

      // 检查文件是否存在
      if (!await fs.pathExists(filePath)) {
        throw new Error(`文件不存在：${filePath}`);
      }

      // 使用文档处理器处理文档
      const processingOptions: ProcessingOptions = {
        extractTables: true,
        extractImages: false,
        detectLanguage: true,
        analyzeStructure: true,
        extractKeywords: true,
        calculateImportance: true
      };

      const documentStructure = await this.documentProcessor.processDocument(filePath, processingOptions);

      // 使用需求提取器提取需求
      const extractionOptions: ExtractionOptions = {
        includeUserStories: options?.extractFeatures ?? true,
        detectDependencies: true,
        estimateEffort: true,
        analyzePriority: options?.prioritize ?? true,
        extractAcceptanceCriteria: true,
        detectStakeholders: true
      };

      const extractionResult = await this.requirementExtractor.extractRequirements(
        documentStructure,
        extractionOptions
      );

      // 转换为ParsedPRD格式
      return this.convertToParseResult(documentStructure, extractionResult);

    } catch (error) {
      this.logger.error(`解析PRD文件失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 解析PRD内容
   * @param content PRD文档内容
   * @param fileType 文件类型
   * @param options 解析选项
   */
  public async parseContent(content: string, fileType: FileType = FileType.MARKDOWN, options?: ParseOptions): Promise<PRDParseResult> {
    try {
      // 处理不同文件类型的内容
      const processedContent = this.preprocessContent(content, fileType);

      // 使用模型解析内容
      const response = await this.modelCoordinator.parsePRD(processedContent, options);

      // 解析并验证模型返回的JSON结果
      try {
        const result = JSON.parse(response.content) as PRDParseResult;
        this.validateParseResult(result);
        this.logger.info('PRD解析成功');
        return result;
      } catch (error) {
        this.logger.error(`解析模型返回结果失败：${(error as Error).message}`);
        throw new Error(`无法解析模型返回的JSON结果：${(error as Error).message}`);
      }
    } catch (error) {
      this.logger.error(`解析PRD内容失败：${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 预处理不同类型的文档内容
   * @param content 文档内容
   * @param fileType 文件类型
   */
  private preprocessContent(content: string, fileType: FileType): string {
    // 根据不同文件类型进行预处理
    switch (fileType) {
      case FileType.MARKDOWN:
        // Markdown格式不需要特殊处理
        return content;
      case FileType.JSON:
        // 如果是JSON格式，尝试解析并美化输出
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // 如果解析失败，直接返回原内容
          return content;
        }
      default:
        // 其他格式暂时不做特殊处理
        return content;
    }
  }

  /**
   * 根据文件扩展名检测文件类型
   * @param filePath 文件路径
   */
  private detectFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.md':
      case '.markdown':
        return FileType.MARKDOWN;
      case '.pdf':
        return FileType.PDF;
      case '.docx':
      case '.doc':
        return FileType.WORD;
      case '.txt':
        return FileType.TEXT;
      case '.json':
        return FileType.JSON;
      default:
        return FileType.UNKNOWN;
    }
  }

  /**
   * 验证解析结果是否符合预期格式
   * @param result 解析结果
   */
  private validateParseResult(result: PRDParseResult): void {
    // 验证基本结构
    if (!result.title) {
      this.logger.warn('解析结果缺少标题');
    }

    if (!result.description) {
      this.logger.warn('解析结果缺少描述');
    }

    if (!Array.isArray(result.sections) || result.sections.length === 0) {
      throw new Error('解析结果必须包含至少一个章节');
    }

    // 验证每个章节的结构
    result.sections.forEach((section, index) => {
      if (!section.title) {
        this.logger.warn(`第${index + 1}个章节缺少标题`);
      }

      if (!Array.isArray(section.features)) {
        this.logger.warn(`第${index + 1}个章节的features字段不是数组`);
        section.features = [];
      }
    });
  }

  /**
   * 转换为ParsedPRD格式
   * @param documentStructure 文档结构
   * @param extractionResult 需求提取结果
   */
  private convertToParseResult(
    documentStructure: DocumentStructure,
    extractionResult: ExtractionResult
  ): ParsedPRD {
    // 将需求转换为功能特性
    const features: Feature[] = extractionResult.requirements.map(req => ({
      id: req.id,
      name: req.title,
      description: req.description,
      priority: req.priority,
      type: (req.type as unknown) as TaskType,
      dependencies: req.dependencies,
      estimatedHours: req.estimatedEffort,
      tags: req.tags,
      acceptanceCriteria: req.acceptanceCriteria,
      complexity: req.complexity,
      businessValue: req.businessValue,
      technicalRisk: req.technicalRisk,
      stakeholders: req.stakeholders,
      category: req.category,
      status: TaskStatus.NOT_STARTED,
      createdAt: req.metadata.extractedAt,
      updatedAt: req.metadata.extractedAt
    }));

    // 构建ParsedPRD对象
    const parsedPRD: ParsedPRD = {
      id: `prd-${Date.now()}`,
      title: documentStructure.title,
      description: this.extractDescription(documentStructure),
      sections: [], // 临时空数组，后续会填充
      metadata: {
        version: '1.0.0',
        features,
        fileName: documentStructure.metadata.fileName,
        fileSize: documentStructure.metadata.fileSize,
        parsedAt: new Date(),
        language: documentStructure.metadata.language,
        wordCount: documentStructure.metadata.wordCount,
        estimatedReadTime: documentStructure.metadata.estimatedReadTime,
        extractionSummary: extractionResult.summary,
        warnings: extractionResult.warnings,
        suggestions: extractionResult.suggestions,
        documentStructure: {
          sectionsCount: documentStructure.sections.length,
          maxDepth: this.calculateMaxDepth(this.convertToPRDSections(documentStructure.sections)),
          hasTableOfContents: this.hasTableOfContents(documentStructure),
          primaryLanguage: documentStructure.metadata.language
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    return parsedPRD;
  }

  /**
   * 提取文档描述
   * @param documentStructure 文档结构
   */
  private extractDescription(documentStructure: DocumentStructure): string {
    // 查找概述或简介章节
    const overviewSection = documentStructure.sections.find(section =>
      section.type === 'overview' ||
      section.title.toLowerCase().includes('概述') ||
      section.title.toLowerCase().includes('简介') ||
      section.title.toLowerCase().includes('overview')
    );

    if (overviewSection) {
      return overviewSection.content.substring(0, 500).trim();
    }

    // 如果没有找到概述章节，使用第一个章节的内容
    if (documentStructure.sections.length > 0) {
      return documentStructure.sections[0].content.substring(0, 500).trim();
    }

    return '从PRD文档自动提取的产品需求';
  }

  /**
   * 转换DocumentSection到PRDSection
   * @param sections 文档章节列表
   */
  private convertToPRDSections(sections: DocumentStructure['sections']): PRDSection[] {
    return sections.map(section => ({
      title: section.title,
      content: section.content,
      level: section.level,
      features: [], // 默认为空，实际应该从内容中提取
      subsections: section.subsections ? this.convertToPRDSections(section.subsections) : undefined
    }));
  }

  /**
   * 计算最大深度
   * @param sections 章节列表
   */
  private calculateMaxDepth(sections: PRDSection[]): number {
    let maxDepth = 0;

    const calculateDepth = (sectionList: PRDSection[], currentDepth: number = 1): void => {
      maxDepth = Math.max(maxDepth, currentDepth);

      sectionList.forEach(section => {
        if (section.subsections && section.subsections.length > 0) {
          calculateDepth(section.subsections, currentDepth + 1);
        }
      });
    };

    calculateDepth(sections);
    return maxDepth;
  }

  /**
   * 检查是否有目录
   * @param documentStructure 文档结构
   */
  private hasTableOfContents(documentStructure: DocumentStructure): boolean {
    return documentStructure.sections.some(section =>
      section.title.toLowerCase().includes('目录') ||
      section.title.toLowerCase().includes('contents') ||
      section.title.toLowerCase().includes('toc')
    );
  }
}