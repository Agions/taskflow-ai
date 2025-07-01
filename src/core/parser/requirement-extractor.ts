/**
 * 需求提取器 - 从文档中智能提取和分析需求
 * 使用自然语言处理和模式匹配技术
 */

import { Logger } from '../../infra/logger';
import { DocumentStructure, DocumentSection, SectionType } from './document-processor';
import { TaskPriority, TaskType } from '../../types/task';

/**
 * 需求类型枚举
 */
export enum RequirementType {
  FUNCTIONAL = 'functional',           // 功能需求
  NON_FUNCTIONAL = 'non_functional',   // 非功能需求
  BUSINESS = 'business',               // 业务需求
  TECHNICAL = 'technical',             // 技术需求
  USER_STORY = 'user_story',          // 用户故事
  CONSTRAINT = 'constraint',           // 约束条件
  ASSUMPTION = 'assumption'            // 假设条件
}

/**
 * 需求接口
 */
export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: TaskPriority;
  category: string;
  source: string;                      // 来源章节
  dependencies: string[];              // 依赖的其他需求
  acceptanceCriteria: string[];        // 验收标准
  estimatedEffort: number;             // 预估工作量(小时)
  complexity: 'low' | 'medium' | 'high'; // 复杂度
  tags: string[];                      // 标签
  stakeholders: string[];              // 相关干系人
  businessValue: number;               // 业务价值(1-10)
  technicalRisk: number;               // 技术风险(1-10)
  metadata: RequirementMetadata;
}

/**
 * 需求元数据
 */
export interface RequirementMetadata {
  extractedAt: Date;
  confidence: number;                  // 提取置信度(0-1)
  extractionMethod: string;            // 提取方法
  keywords: string[];                  // 关键词
  relatedSections: string[];           // 相关章节ID
}

/**
 * 提取选项
 */
export interface ExtractionOptions {
  includeUserStories?: boolean;        // 是否提取用户故事
  detectDependencies?: boolean;        // 是否检测依赖关系
  estimateEffort?: boolean;            // 是否估算工作量
  analyzePriority?: boolean;           // 是否分析优先级
  extractAcceptanceCriteria?: boolean; // 是否提取验收标准
  detectStakeholders?: boolean;        // 是否检测干系人
}

/**
 * 需求提取结果
 */
export interface ExtractionResult {
  requirements: Requirement[];
  summary: ExtractionSummary;
  warnings: string[];
  suggestions: string[];
}

/**
 * 提取摘要
 */
export interface ExtractionSummary {
  totalRequirements: number;
  functionalRequirements: number;
  nonFunctionalRequirements: number;
  userStories: number;
  highPriorityRequirements: number;
  estimatedTotalEffort: number;
  averageComplexity: string;
  coverageScore: number;              // 覆盖度评分(0-1)
}

/**
 * 需求提取器类
 */
export class RequirementExtractor {
  private logger: Logger;
  
  // 需求识别模式
  private readonly requirementPatterns = {
    functional: [
      /系统(应该|必须|需要|能够)(.+)/gi,
      /用户(可以|能够|应该)(.+)/gi,
      /应用程序(应该|必须|需要)(.+)/gi,
      /(实现|支持|提供)(.+)功能/gi,
      /the system (should|must|shall|will)(.+)/gi,
      /users (can|should|must|will be able to)(.+)/gi
    ],
    nonFunctional: [
      /(性能|响应时间|吞吐量)(.+)/gi,
      /(安全|权限|认证)(.+)/gi,
      /(可用性|稳定性|可靠性)(.+)/gi,
      /(兼容性|扩展性|可维护性)(.+)/gi,
      /(performance|security|usability|reliability)(.+)/gi
    ],
    userStory: [
      /作为(.+?)，我希望(.+?)，以便(.+)/gi,
      /As a (.+?), I want (.+?) so that (.+)/gi,
      /Given (.+?) when (.+?) then (.+)/gi
    ],
    constraint: [
      /(限制|约束|不能|禁止)(.+)/gi,
      /(constraint|limitation|restriction)(.+)/gi
    ]
  };

  // 优先级关键词
  private readonly priorityKeywords = {
    critical: ['关键', '核心', '重要', '必须', 'critical', 'essential', 'must', 'key'],
    high: ['高', '优先', '重点', 'high', 'priority', 'important'],
    medium: ['中等', '一般', '普通', 'medium', 'normal', 'standard'],
    low: ['低', '次要', '可选', 'low', 'optional', 'nice to have']
  };

  // 复杂度关键词
  private readonly complexityKeywords = {
    high: ['复杂', '困难', '挑战', '集成', '算法', 'complex', 'difficult', 'challenging', 'integration'],
    medium: ['中等', '标准', '常规', 'medium', 'standard', 'typical'],
    low: ['简单', '基础', '直接', 'simple', 'basic', 'straightforward']
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 从文档结构中提取需求
   * @param documentStructure 文档结构
   * @param options 提取选项
   */
  public async extractRequirements(
    documentStructure: DocumentStructure,
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    try {
      this.logger.info('开始提取需求');

      const requirements: Requirement[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // 遍历所有章节提取需求
      for (const section of documentStructure.sections) {
        const sectionRequirements = await this.extractFromSection(section, options);
        requirements.push(...sectionRequirements);
      }

      // 后处理：检测依赖关系
      if (options.detectDependencies) {
        this.detectDependencies(requirements);
      }

      // 生成摘要
      const summary = this.generateSummary(requirements);

      // 生成建议
      suggestions.push(...this.generateSuggestions(requirements, summary));

      // 验证结果
      warnings.push(...this.validateRequirements(requirements));

      this.logger.info(`需求提取完成: ${requirements.length} 个需求`);

      return {
        requirements,
        summary,
        warnings,
        suggestions
      };

    } catch (error) {
      this.logger.error(`需求提取失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 从单个章节提取需求
   * @param section 文档章节
   * @param options 提取选项
   */
  private async extractFromSection(
    section: DocumentSection,
    options: ExtractionOptions
  ): Promise<Requirement[]> {
    const requirements: Requirement[] = [];
    const content = section.title + '\n' + section.content;

    // 根据章节类型选择提取策略
    switch (section.type) {
      case SectionType.REQUIREMENTS:
        requirements.push(...this.extractFunctionalRequirements(section, content));
        requirements.push(...this.extractNonFunctionalRequirements(section, content));
        break;
      
      case SectionType.FEATURES:
        requirements.push(...this.extractFeatureRequirements(section, content));
        if (options.includeUserStories) {
          requirements.push(...this.extractUserStories(section, content));
        }
        break;
      
      case SectionType.TECHNICAL:
        requirements.push(...this.extractTechnicalRequirements(section, content));
        break;
      
      default:
        // 通用提取
        requirements.push(...this.extractGeneralRequirements(section, content));
        break;
    }

    // 递归处理子章节
    for (const subsection of section.subsections) {
      const subRequirements = await this.extractFromSection(subsection, options);
      requirements.push(...subRequirements);
    }

    return requirements;
  }

  /**
   * 提取功能需求
   * @param section 章节
   * @param content 内容
   */
  private extractFunctionalRequirements(section: DocumentSection, content: string): Requirement[] {
    const requirements: Requirement[] = [];
    let reqCounter = 1;

    this.requirementPatterns.functional.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const description = match[0].trim();
        if (description.length > 10) { // 过滤太短的匹配
          requirements.push(this.createRequirement(
            `${section.id}-func-${reqCounter++}`,
            this.extractTitle(description),
            description,
            RequirementType.FUNCTIONAL,
            section,
            content
          ));
        }
      }
    });

    return requirements;
  }

  /**
   * 提取非功能需求
   * @param section 章节
   * @param content 内容
   */
  private extractNonFunctionalRequirements(section: DocumentSection, content: string): Requirement[] {
    const requirements: Requirement[] = [];
    let reqCounter = 1;

    this.requirementPatterns.nonFunctional.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const description = match[0].trim();
        if (description.length > 10) {
          requirements.push(this.createRequirement(
            `${section.id}-nonfunc-${reqCounter++}`,
            this.extractTitle(description),
            description,
            RequirementType.NON_FUNCTIONAL,
            section,
            content
          ));
        }
      }
    });

    return requirements;
  }

  /**
   * 提取功能特性需求
   * @param section 章节
   * @param content 内容
   */
  private extractFeatureRequirements(section: DocumentSection, content: string): Requirement[] {
    const requirements: Requirement[] = [];
    
    // 按行分析，查找功能描述
    const lines = content.split('\n').filter(line => line.trim());
    let reqCounter = 1;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // 检查是否是功能描述（列表项、编号项等）
      if (this.isFunctionDescription(trimmedLine)) {
        requirements.push(this.createRequirement(
          `${section.id}-feature-${reqCounter++}`,
          this.extractTitle(trimmedLine),
          trimmedLine,
          RequirementType.FUNCTIONAL,
          section,
          content
        ));
      }
    });

    return requirements;
  }

  /**
   * 提取用户故事
   * @param section 章节
   * @param content 内容
   */
  private extractUserStories(section: DocumentSection, content: string): Requirement[] {
    const requirements: Requirement[] = [];
    let storyCounter = 1;

    this.requirementPatterns.userStory.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const description = match[0].trim();
        requirements.push(this.createRequirement(
          `${section.id}-story-${storyCounter++}`,
          `用户故事 ${storyCounter}`,
          description,
          RequirementType.USER_STORY,
          section,
          content
        ));
      }
    });

    return requirements;
  }

  /**
   * 提取技术需求
   * @param section 章节
   * @param content 内容
   */
  private extractTechnicalRequirements(section: DocumentSection, content: string): Requirement[] {
    const requirements: Requirement[] = [];
    
    // 查找技术相关的描述
    const techKeywords = ['技术栈', '架构', '数据库', '框架', '接口', 'API', '服务', '组件'];
    const lines = content.split('\n').filter(line => line.trim());
    let reqCounter = 1;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (techKeywords.some(keyword => trimmedLine.includes(keyword)) && trimmedLine.length > 10) {
        requirements.push(this.createRequirement(
          `${section.id}-tech-${reqCounter++}`,
          this.extractTitle(trimmedLine),
          trimmedLine,
          RequirementType.TECHNICAL,
          section,
          content
        ));
      }
    });

    return requirements;
  }

  /**
   * 提取通用需求
   * @param section 章节
   * @param content 内容
   */
  private extractGeneralRequirements(section: DocumentSection, content: string): Requirement[] {
    const requirements: Requirement[] = [];
    
    // 简单的基于关键词的提取
    const lines = content.split('\n').filter(line => line.trim());
    let reqCounter = 1;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (this.isRequirementLike(trimmedLine)) {
        requirements.push(this.createRequirement(
          `${section.id}-req-${reqCounter++}`,
          this.extractTitle(trimmedLine),
          trimmedLine,
          RequirementType.BUSINESS,
          section,
          content
        ));
      }
    });

    return requirements;
  }

  /**
   * 创建需求对象
   * @param id 需求ID
   * @param title 标题
   * @param description 描述
   * @param type 类型
   * @param section 来源章节
   * @param content 章节内容
   */
  private createRequirement(
    id: string,
    title: string,
    description: string,
    type: RequirementType,
    section: DocumentSection,
    content: string
  ): Requirement {
    return {
      id,
      title,
      description,
      type,
      priority: this.analyzePriority(description),
      category: section.title,
      source: section.id,
      dependencies: [],
      acceptanceCriteria: this.extractAcceptanceCriteria(description),
      estimatedEffort: this.estimateEffort(description, type),
      complexity: this.analyzeComplexity(description),
      tags: this.extractTags(description),
      stakeholders: this.extractStakeholders(description),
      businessValue: this.calculateBusinessValue(description, type),
      technicalRisk: this.calculateTechnicalRisk(description, type),
      metadata: {
        extractedAt: new Date(),
        confidence: this.calculateConfidence(description, type),
        extractionMethod: 'pattern_matching',
        keywords: section.keywords,
        relatedSections: [section.id]
      }
    };
  }

  /**
   * 分析优先级
   * @param text 文本
   */
  private analyzePriority(text: string): TaskPriority {
    const textLower = text.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return priority as TaskPriority;
      }
    }
    
    return TaskPriority.MEDIUM;
  }

  /**
   * 分析复杂度
   * @param text 文本
   */
  private analyzeComplexity(text: string): 'low' | 'medium' | 'high' {
    const textLower = text.toLowerCase();
    
    for (const [complexity, keywords] of Object.entries(this.complexityKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return complexity as 'low' | 'medium' | 'high';
      }
    }
    
    // 基于文本长度判断
    if (text.length > 200) return 'high';
    if (text.length > 100) return 'medium';
    return 'low';
  }

  /**
   * 估算工作量
   * @param description 描述
   * @param type 类型
   */
  private estimateEffort(description: string, type: RequirementType): number {
    let baseHours = 8; // 基础工作量
    
    // 根据类型调整
    switch (type) {
      case RequirementType.TECHNICAL:
        baseHours = 16;
        break;
      case RequirementType.NON_FUNCTIONAL:
        baseHours = 12;
        break;
      case RequirementType.USER_STORY:
        baseHours = 6;
        break;
    }
    
    // 根据复杂度调整
    const complexity = this.analyzeComplexity(description);
    switch (complexity) {
      case 'high':
        baseHours *= 2;
        break;
      case 'low':
        baseHours *= 0.5;
        break;
    }
    
    return Math.round(baseHours);
  }

  /**
   * 计算业务价值
   * @param description 描述
   * @param type 类型
   */
  private calculateBusinessValue(description: string, type: RequirementType): number {
    let value = 5; // 基础值
    
    const valueKeywords = ['收入', '用户', '体验', '效率', '成本', 'revenue', 'user', 'experience', 'efficiency'];
    const textLower = description.toLowerCase();
    
    valueKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        value += 1;
      }
    });
    
    // 根据类型调整
    if (type === RequirementType.BUSINESS) value += 2;
    if (type === RequirementType.USER_STORY) value += 1;
    
    return Math.min(10, value);
  }

  /**
   * 计算技术风险
   * @param description 描述
   * @param type 类型
   */
  private calculateTechnicalRisk(description: string, type: RequirementType): number {
    let risk = 3; // 基础风险
    
    const riskKeywords = ['集成', '新技术', '算法', '性能', '安全', 'integration', 'new', 'algorithm', 'performance', 'security'];
    const textLower = description.toLowerCase();
    
    riskKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        risk += 1;
      }
    });
    
    // 根据类型调整
    if (type === RequirementType.TECHNICAL) risk += 2;
    if (type === RequirementType.NON_FUNCTIONAL) risk += 1;
    
    return Math.min(10, risk);
  }

  /**
   * 计算提取置信度
   * @param description 描述
   * @param type 类型
   */
  private calculateConfidence(description: string, type: RequirementType): number {
    let confidence = 0.5;
    
    // 基于模式匹配的置信度
    if (this.requirementPatterns.functional.some(pattern => pattern.test(description))) {
      confidence += 0.3;
    }
    
    // 基于长度和结构
    if (description.length > 20 && description.length < 500) {
      confidence += 0.2;
    }
    
    return Math.min(1.0, confidence);
  }

  /**
   * 提取验收标准
   * @param description 描述
   */
  private extractAcceptanceCriteria(description: string): string[] {
    const criteria: string[] = [];
    
    // 查找验收标准相关的模式
    const criteriaPatterns = [
      /验收标准[：:]\s*(.+)/gi,
      /acceptance criteria[：:]\s*(.+)/gi,
      /given (.+?) when (.+?) then (.+)/gi
    ];
    
    criteriaPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        criteria.push(match[1] || match[0]);
      }
    });
    
    return criteria;
  }

  /**
   * 提取标签
   * @param description 描述
   */
  private extractTags(description: string): string[] {
    const tags: string[] = [];
    
    // 基于关键词生成标签
    const tagKeywords = {
      'UI': ['界面', '页面', '按钮', 'UI', 'interface', 'page', 'button'],
      'API': ['接口', 'API', 'service', '服务'],
      'Database': ['数据库', '存储', 'database', 'storage'],
      'Security': ['安全', '权限', 'security', 'permission', 'auth'],
      'Performance': ['性能', '速度', 'performance', 'speed']
    };
    
    const textLower = description.toLowerCase();
    
    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  /**
   * 提取干系人
   * @param description 描述
   */
  private extractStakeholders(description: string): string[] {
    const stakeholders: string[] = [];
    
    const stakeholderPatterns = [
      /用户/g, /管理员/g, /开发者/g, /测试人员/g,
      /user/gi, /admin/gi, /developer/gi, /tester/gi
    ];
    
    stakeholderPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        stakeholders.push(...matches);
      }
    });
    
    return [...new Set(stakeholders)]; // 去重
  }

  /**
   * 检测依赖关系
   * @param requirements 需求列表
   */
  private detectDependencies(requirements: Requirement[]): void {
    // 简化的依赖检测：基于关键词匹配
    requirements.forEach(req => {
      requirements.forEach(otherReq => {
        if (req.id !== otherReq.id) {
          // 检查是否有依赖关系的关键词
          if (this.hasDependencyRelation(req.description, otherReq.description)) {
            req.dependencies.push(otherReq.id);
          }
        }
      });
    });
  }

  /**
   * 检查是否有依赖关系
   * @param desc1 描述1
   * @param desc2 描述2
   */
  private hasDependencyRelation(desc1: string, desc2: string): boolean {
    // 简化的依赖检测逻辑
    const dependencyKeywords = ['基于', '依赖', '需要', '使用', 'based on', 'depends on', 'requires', 'uses'];
    
    return dependencyKeywords.some(keyword => 
      desc1.toLowerCase().includes(keyword) && 
      desc2.toLowerCase().includes(keyword)
    );
  }

  /**
   * 生成摘要
   * @param requirements 需求列表
   */
  private generateSummary(requirements: Requirement[]): ExtractionSummary {
    const functionalCount = requirements.filter(r => r.type === RequirementType.FUNCTIONAL).length;
    const nonFunctionalCount = requirements.filter(r => r.type === RequirementType.NON_FUNCTIONAL).length;
    const userStoryCount = requirements.filter(r => r.type === RequirementType.USER_STORY).length;
    const highPriorityCount = requirements.filter(r => r.priority === TaskPriority.HIGH || r.priority === TaskPriority.CRITICAL).length;
    
    const totalEffort = requirements.reduce((sum, req) => sum + req.estimatedEffort, 0);
    
    const complexityScores = requirements.map(r => {
      switch (r.complexity) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });
    
    const avgComplexityScore = complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;
    const avgComplexity = avgComplexityScore > 2.5 ? 'high' : avgComplexityScore > 1.5 ? 'medium' : 'low';
    
    // 计算覆盖度评分（基于需求的完整性和质量）
    const avgConfidence = requirements.reduce((sum, req) => sum + req.metadata.confidence, 0) / requirements.length;
    const coverageScore = Math.min(1.0, avgConfidence * (requirements.length / 10)); // 假设10个需求为完整覆盖
    
    return {
      totalRequirements: requirements.length,
      functionalRequirements: functionalCount,
      nonFunctionalRequirements: nonFunctionalCount,
      userStories: userStoryCount,
      highPriorityRequirements: highPriorityCount,
      estimatedTotalEffort: totalEffort,
      averageComplexity: avgComplexity,
      coverageScore
    };
  }

  /**
   * 生成建议
   * @param requirements 需求列表
   * @param summary 摘要
   */
  private generateSuggestions(requirements: Requirement[], summary: ExtractionSummary): string[] {
    const suggestions: string[] = [];
    
    if (summary.totalRequirements < 5) {
      suggestions.push('需求数量较少，建议检查是否遗漏了重要需求');
    }
    
    if (summary.nonFunctionalRequirements === 0) {
      suggestions.push('未发现非功能需求，建议补充性能、安全、可用性等方面的需求');
    }
    
    if (summary.highPriorityRequirements / summary.totalRequirements > 0.8) {
      suggestions.push('高优先级需求比例过高，建议重新评估需求优先级');
    }
    
    if (summary.coverageScore < 0.6) {
      suggestions.push('需求覆盖度较低，建议补充更详细的需求描述');
    }
    
    const avgEffort = summary.estimatedTotalEffort / summary.totalRequirements;
    if (avgEffort > 20) {
      suggestions.push('平均工作量较高，建议将复杂需求拆分为更小的任务');
    }
    
    return suggestions;
  }

  /**
   * 验证需求
   * @param requirements 需求列表
   */
  private validateRequirements(requirements: Requirement[]): string[] {
    const warnings: string[] = [];
    
    requirements.forEach(req => {
      if (req.description.length < 10) {
        warnings.push(`需求 ${req.id} 描述过于简短`);
      }
      
      if (req.metadata.confidence < 0.3) {
        warnings.push(`需求 ${req.id} 提取置信度较低`);
      }
      
      if (req.acceptanceCriteria.length === 0) {
        warnings.push(`需求 ${req.id} 缺少验收标准`);
      }
    });
    
    return warnings;
  }

  /**
   * 判断是否是功能描述
   * @param line 文本行
   */
  private isFunctionDescription(line: string): boolean {
    const patterns = [
      /^[-*+]\s+/, // 列表项
      /^\d+\.\s+/, // 编号项
      /^[a-zA-Z0-9]+[.)]\s+/, // 字母或数字编号
      /功能|特性|能力/
    ];
    
    return patterns.some(pattern => pattern.test(line)) && line.length > 10;
  }

  /**
   * 判断是否像需求
   * @param line 文本行
   */
  private isRequirementLike(line: string): boolean {
    const requirementIndicators = [
      '需要', '应该', '必须', '能够', '支持', '实现', '提供',
      'need', 'should', 'must', 'shall', 'support', 'implement', 'provide'
    ];
    
    return requirementIndicators.some(indicator => 
      line.toLowerCase().includes(indicator)
    ) && line.length > 15;
  }

  /**
   * 提取标题
   * @param text 文本
   */
  private extractTitle(text: string): string {
    // 提取前50个字符作为标题
    const title = text.substring(0, 50).trim();
    return title.endsWith('...') ? title : title + (text.length > 50 ? '...' : '');
  }
}
