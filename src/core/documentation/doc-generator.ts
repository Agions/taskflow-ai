/**
 * 文档生成器 - 自动生成项目文档
 * 支持多种文档格式和模板，包括技术文档、用户手册、API文档等
 */

import { Logger } from '../../infra/logger';
import { ConfigManager } from '../../infra/config';
import { Task, TaskPlan, TaskType } from '../../types/task';
import { Requirement } from '../parser/requirement-extractor';
import { OrchestrationResult } from '../ai/intelligent-orchestrator';

/**
 * 文档类型枚举
 */
export enum DocumentType {
  PROJECT_OVERVIEW = 'project_overview',       // 项目概览
  TECHNICAL_SPEC = 'technical_spec',           // 技术规格说明
  API_DOCUMENTATION = 'api_documentation',    // API文档
  USER_MANUAL = 'user_manual',                 // 用户手册
  DEPLOYMENT_GUIDE = 'deployment_guide',       // 部署指南
  DEVELOPMENT_GUIDE = 'development_guide',     // 开发指南
  TEST_PLAN = 'test_plan',                     // 测试计划
  RELEASE_NOTES = 'release_notes',             // 发布说明
  ARCHITECTURE_DOC = 'architecture_doc',       // 架构文档
  REQUIREMENTS_DOC = 'requirements_doc',       // 需求文档
  TASK_BREAKDOWN = 'task_breakdown',           // 任务分解文档
  PROJECT_REPORT = 'project_report'            // 项目报告
}

/**
 * 文档格式枚举
 */
export enum DocumentFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  DOCX = 'docx',
  JSON = 'json',
  CONFLUENCE = 'confluence',
  NOTION = 'notion'
}

/**
 * 文档配置接口
 */
export interface DocumentConfig {
  type: DocumentType;
  format: DocumentFormat;
  title: string;
  author?: string;
  version?: string;
  language: 'zh-CN' | 'en-US';
  template?: string;                           // 模板名称
  includeTableOfContents: boolean;
  includeMetadata: boolean;
  includeTimestamp: boolean;
  customSections?: DocumentSection[];
  styling?: DocumentStyling;
  outputPath?: string;
}

/**
 * 文档章节接口
 */
export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  level: number;                               // 标题级别 1-6
  order: number;                               // 排序
  includeInToc: boolean;                       // 是否包含在目录中
  metadata?: Record<string, any>;
}

/**
 * 文档样式接口
 */
export interface DocumentStyling {
  theme: 'default' | 'professional' | 'modern' | 'minimal';
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  customCss?: string;
  logoUrl?: string;
  headerFooter?: {
    header?: string;
    footer?: string;
  };
}

/**
 * 生成的文档接口
 */
export interface GeneratedDocument {
  id: string;
  config: DocumentConfig;
  content: string;
  sections: DocumentSection[];
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    version: string;
    wordCount: number;
    pageCount?: number;
    lastModified?: Date;
  };
  assets?: DocumentAsset[];                    // 相关资源文件
}

/**
 * 文档资源接口
 */
export interface DocumentAsset {
  id: string;
  type: 'image' | 'diagram' | 'chart' | 'file';
  name: string;
  path: string;
  description?: string;
  size?: number;
}

/**
 * 文档模板接口
 */
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: DocumentType;
  format: DocumentFormat;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  styling: DocumentStyling;
}

/**
 * 模板章节接口
 */
export interface TemplateSection {
  id: string;
  title: string;
  template: string;                            // 模板内容，支持变量替换
  level: number;
  required: boolean;
  conditional?: string;                        // 条件表达式
}

/**
 * 模板变量接口
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  defaultValue?: any;
  required: boolean;
}

/**
 * 文档生成器类
 */
export class DocumentGenerator {
  private logger: Logger;
  private configManager: ConfigManager;
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor(logger: Logger, configManager: ConfigManager) {
    this.logger = logger;
    this.configManager = configManager;
    this.initializeDefaultTemplates();
  }

  /**
   * 生成项目概览文档
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   * @param config 文档配置
   */
  public async generateProjectOverview(
    taskPlan: TaskPlan,
    requirements: Requirement[],
    config?: Partial<DocumentConfig>
  ): Promise<GeneratedDocument> {
    this.logger.info('生成项目概览文档');

    const documentConfig: DocumentConfig = {
      type: DocumentType.PROJECT_OVERVIEW,
      format: DocumentFormat.MARKDOWN,
      title: `${taskPlan.name} - 项目概览`,
      language: 'zh-CN',
      includeTableOfContents: true,
      includeMetadata: true,
      includeTimestamp: true,
      ...config
    };

    const sections: DocumentSection[] = [
      {
        id: 'introduction',
        title: '项目简介',
        content: this.generateIntroductionSection(taskPlan, requirements),
        level: 1,
        order: 1,
        includeInToc: true
      },
      {
        id: 'objectives',
        title: '项目目标',
        content: this.generateObjectivesSection(requirements),
        level: 1,
        order: 2,
        includeInToc: true
      },
      {
        id: 'scope',
        title: '项目范围',
        content: this.generateScopeSection(requirements),
        level: 1,
        order: 3,
        includeInToc: true
      },
      {
        id: 'timeline',
        title: '项目时间线',
        content: this.generateTimelineSection(taskPlan),
        level: 1,
        order: 4,
        includeInToc: true
      },
      {
        id: 'team',
        title: '团队组成',
        content: this.generateTeamSection(taskPlan),
        level: 1,
        order: 5,
        includeInToc: true
      },
      {
        id: 'risks',
        title: '风险评估',
        content: this.generateRisksSection(taskPlan, requirements),
        level: 1,
        order: 6,
        includeInToc: true
      }
    ];

    const content = this.renderDocument(documentConfig, sections);

    return {
      id: this.generateDocumentId(),
      config: documentConfig,
      content,
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TaskFlow AI',
        version: '1.0.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * 生成技术规格文档
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   * @param config 文档配置
   */
  public async generateTechnicalSpec(
    taskPlan: TaskPlan,
    requirements: Requirement[],
    config?: Partial<DocumentConfig>
  ): Promise<GeneratedDocument> {
    this.logger.info('生成技术规格文档');

    const documentConfig: DocumentConfig = {
      type: DocumentType.TECHNICAL_SPEC,
      format: DocumentFormat.MARKDOWN,
      title: `${taskPlan.name} - 技术规格说明`,
      language: 'zh-CN',
      includeTableOfContents: true,
      includeMetadata: true,
      includeTimestamp: true,
      ...config
    };

    const sections: DocumentSection[] = [
      {
        id: 'architecture',
        title: '系统架构',
        content: this.generateArchitectureSection(taskPlan, requirements),
        level: 1,
        order: 1,
        includeInToc: true
      },
      {
        id: 'technology-stack',
        title: '技术栈',
        content: this.generateTechnologyStackSection(taskPlan, requirements),
        level: 1,
        order: 2,
        includeInToc: true
      },
      {
        id: 'data-model',
        title: '数据模型',
        content: this.generateDataModelSection(requirements),
        level: 1,
        order: 3,
        includeInToc: true
      },
      {
        id: 'api-design',
        title: 'API设计',
        content: this.generateApiDesignSection(requirements),
        level: 1,
        order: 4,
        includeInToc: true
      },
      {
        id: 'security',
        title: '安全设计',
        content: this.generateSecuritySection(requirements),
        level: 1,
        order: 5,
        includeInToc: true
      },
      {
        id: 'performance',
        title: '性能要求',
        content: this.generatePerformanceSection(requirements),
        level: 1,
        order: 6,
        includeInToc: true
      }
    ];

    const content = this.renderDocument(documentConfig, sections);

    return {
      id: this.generateDocumentId(),
      config: documentConfig,
      content,
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TaskFlow AI',
        version: '1.0.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * 生成任务分解文档
   * @param taskPlan 任务计划
   * @param orchestrationResult 编排结果
   * @param config 文档配置
   */
  public async generateTaskBreakdown(
    taskPlan: TaskPlan,
    orchestrationResult?: OrchestrationResult,
    config?: Partial<DocumentConfig>
  ): Promise<GeneratedDocument> {
    this.logger.info('生成任务分解文档');

    const documentConfig: DocumentConfig = {
      type: DocumentType.TASK_BREAKDOWN,
      format: DocumentFormat.MARKDOWN,
      title: `${taskPlan.name} - 任务分解文档`,
      language: 'zh-CN',
      includeTableOfContents: true,
      includeMetadata: true,
      includeTimestamp: true,
      ...config
    };

    const sections: DocumentSection[] = [
      {
        id: 'summary',
        title: '任务概要',
        content: this.generateTaskSummarySection(taskPlan),
        level: 1,
        order: 1,
        includeInToc: true
      },
      {
        id: 'task-list',
        title: '任务清单',
        content: this.generateTaskListSection(taskPlan),
        level: 1,
        order: 2,
        includeInToc: true
      },
      {
        id: 'dependencies',
        title: '依赖关系',
        content: this.generateDependenciesSection(taskPlan),
        level: 1,
        order: 3,
        includeInToc: true
      },
      {
        id: 'timeline',
        title: '时间安排',
        content: this.generateTaskTimelineSection(taskPlan, orchestrationResult),
        level: 1,
        order: 4,
        includeInToc: true
      },
      {
        id: 'resources',
        title: '资源分配',
        content: this.generateResourceAllocationSection(taskPlan),
        level: 1,
        order: 5,
        includeInToc: true
      }
    ];

    if (orchestrationResult) {
      sections.push({
        id: 'optimization',
        title: '优化建议',
        content: this.generateOptimizationSection(orchestrationResult),
        level: 1,
        order: 6,
        includeInToc: true
      });
    }

    const content = this.renderDocument(documentConfig, sections);

    return {
      id: this.generateDocumentId(),
      config: documentConfig,
      content,
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TaskFlow AI',
        version: '1.0.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * 生成API文档
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   * @param config 文档配置
   */
  public async generateApiDocumentation(
    taskPlan: TaskPlan,
    requirements: Requirement[],
    config?: Partial<DocumentConfig>
  ): Promise<GeneratedDocument> {
    this.logger.info('生成API文档');

    const documentConfig: DocumentConfig = {
      type: DocumentType.API_DOCUMENTATION,
      format: DocumentFormat.MARKDOWN,
      title: `${taskPlan.name} - API文档`,
      language: 'zh-CN',
      includeTableOfContents: true,
      includeMetadata: true,
      includeTimestamp: true,
      ...config
    };

    const apiEndpoints = this.extractApiEndpoints(requirements);
    const sections: DocumentSection[] = [
      {
        id: 'overview',
        title: 'API概览',
        content: this.generateApiOverviewSection(apiEndpoints),
        level: 1,
        order: 1,
        includeInToc: true
      },
      {
        id: 'authentication',
        title: '认证方式',
        content: this.generateAuthenticationSection(requirements),
        level: 1,
        order: 2,
        includeInToc: true
      },
      {
        id: 'endpoints',
        title: 'API端点',
        content: this.generateEndpointsSection(apiEndpoints),
        level: 1,
        order: 3,
        includeInToc: true
      },
      {
        id: 'data-models',
        title: '数据模型',
        content: this.generateApiDataModelsSection(apiEndpoints),
        level: 1,
        order: 4,
        includeInToc: true
      },
      {
        id: 'error-codes',
        title: '错误码',
        content: this.generateErrorCodesSection(),
        level: 1,
        order: 5,
        includeInToc: true
      },
      {
        id: 'examples',
        title: '使用示例',
        content: this.generateApiExamplesSection(apiEndpoints),
        level: 1,
        order: 6,
        includeInToc: true
      }
    ];

    const content = this.renderDocument(documentConfig, sections);

    return {
      id: this.generateDocumentId(),
      config: documentConfig,
      content,
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TaskFlow AI',
        version: '1.0.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * 生成用户手册
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   * @param config 文档配置
   */
  public async generateUserManual(
    taskPlan: TaskPlan,
    requirements: Requirement[],
    config?: Partial<DocumentConfig>
  ): Promise<GeneratedDocument> {
    this.logger.info('生成用户手册');

    const documentConfig: DocumentConfig = {
      type: DocumentType.USER_MANUAL,
      format: DocumentFormat.MARKDOWN,
      title: `${taskPlan.name} - 用户手册`,
      language: 'zh-CN',
      includeTableOfContents: true,
      includeMetadata: true,
      includeTimestamp: true,
      ...config
    };

    const userFeatures = this.extractUserFeatures(requirements);
    const sections: DocumentSection[] = [
      {
        id: 'getting-started',
        title: '快速开始',
        content: this.generateGettingStartedSection(userFeatures),
        level: 1,
        order: 1,
        includeInToc: true
      },
      {
        id: 'features',
        title: '功能介绍',
        content: this.generateFeaturesSection(userFeatures),
        level: 1,
        order: 2,
        includeInToc: true
      },
      {
        id: 'tutorials',
        title: '使用教程',
        content: this.generateTutorialsSection(userFeatures),
        level: 1,
        order: 3,
        includeInToc: true
      },
      {
        id: 'faq',
        title: '常见问题',
        content: this.generateFaqSection(userFeatures),
        level: 1,
        order: 4,
        includeInToc: true
      },
      {
        id: 'troubleshooting',
        title: '故障排除',
        content: this.generateTroubleshootingSection(),
        level: 1,
        order: 5,
        includeInToc: true
      }
    ];

    const content = this.renderDocument(documentConfig, sections);

    return {
      id: this.generateDocumentId(),
      config: documentConfig,
      content,
      sections,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TaskFlow AI',
        version: '1.0.0',
        wordCount: this.countWords(content)
      }
    };
  }

  /**
   * 批量生成文档
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   * @param orchestrationResult 编排结果
   * @param documentTypes 要生成的文档类型
   */
  public async generateDocumentSuite(
    taskPlan: TaskPlan,
    requirements: Requirement[],
    orchestrationResult?: OrchestrationResult,
    documentTypes: DocumentType[] = [
      DocumentType.PROJECT_OVERVIEW,
      DocumentType.TECHNICAL_SPEC,
      DocumentType.TASK_BREAKDOWN,
      DocumentType.API_DOCUMENTATION
    ]
  ): Promise<GeneratedDocument[]> {
    this.logger.info(`批量生成文档: ${documentTypes.join(', ')}`);

    const documents: GeneratedDocument[] = [];

    for (const docType of documentTypes) {
      try {
        let document: GeneratedDocument;

        switch (docType) {
          case DocumentType.PROJECT_OVERVIEW:
            document = await this.generateProjectOverview(taskPlan, requirements);
            break;
          case DocumentType.TECHNICAL_SPEC:
            document = await this.generateTechnicalSpec(taskPlan, requirements);
            break;
          case DocumentType.TASK_BREAKDOWN:
            document = await this.generateTaskBreakdown(taskPlan, orchestrationResult);
            break;
          case DocumentType.API_DOCUMENTATION:
            document = await this.generateApiDocumentation(taskPlan, requirements);
            break;
          case DocumentType.USER_MANUAL:
            document = await this.generateUserManual(taskPlan, requirements);
            break;
          default:
            this.logger.warn(`不支持的文档类型: ${docType}`);
            continue;
        }

        documents.push(document);
        this.logger.info(`成功生成${docType}文档`);
      } catch (error) {
        this.logger.error(`生成${docType}文档失败: ${(error as Error).message}`);
      }
    }

    return documents;
  }

  // 私有辅助方法

  /**
   * 初始化默认模板
   */
  private initializeDefaultTemplates(): void {
    // 项目概览模板
    const projectOverviewTemplate: DocumentTemplate = {
      id: 'project-overview-default',
      name: '默认项目概览模板',
      description: '标准的项目概览文档模板',
      type: DocumentType.PROJECT_OVERVIEW,
      format: DocumentFormat.MARKDOWN,
      sections: [
        {
          id: 'intro',
          title: '项目简介',
          template: '{{project.description}}',
          level: 1,
          required: true
        }
      ],
      variables: [
        {
          name: 'project',
          type: 'object',
          description: '项目信息',
          required: true
        }
      ],
      styling: {
        theme: 'professional'
      }
    };

    this.templates.set(projectOverviewTemplate.id, projectOverviewTemplate);
  }

  /**
   * 生成文档ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 渲染文档
   * @param config 文档配置
   * @param sections 文档章节
   */
  private renderDocument(config: DocumentConfig, sections: DocumentSection[]): string {
    let content = '';

    // 添加文档头部
    if (config.includeMetadata) {
      content += this.generateDocumentHeader(config);
    }

    // 添加目录
    if (config.includeTableOfContents) {
      content += this.generateTableOfContents(sections);
    }

    // 添加章节内容
    sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        content += this.renderSection(section);
      });

    // 添加文档尾部
    if (config.includeTimestamp) {
      content += this.generateDocumentFooter();
    }

    return content;
  }

  /**
   * 生成文档头部
   * @param config 文档配置
   */
  private generateDocumentHeader(config: DocumentConfig): string {
    const header = `# ${config.title}\n\n`;

    let metadata = '---\n';
    metadata += `title: "${config.title}"\n`;
    if (config.author) metadata += `author: "${config.author}"\n`;
    if (config.version) metadata += `version: "${config.version}"\n`;
    metadata += `language: "${config.language}"\n`;
    metadata += `generated: "${new Date().toISOString()}"\n`;
    metadata += '---\n\n';

    return metadata + header;
  }

  /**
   * 生成目录
   * @param sections 文档章节
   */
  private generateTableOfContents(sections: DocumentSection[]): string {
    let toc = '## 目录\n\n';

    sections
      .filter(section => section.includeInToc)
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        const indent = '  '.repeat(section.level - 1);
        const link = section.id.toLowerCase().replace(/\s+/g, '-');
        toc += `${indent}- [${section.title}](#${link})\n`;
      });

    return toc + '\n';
  }

  /**
   * 渲染章节
   * @param section 文档章节
   */
  private renderSection(section: DocumentSection): string {
    const headerLevel = '#'.repeat(section.level);
    return `${headerLevel} ${section.title}\n\n${section.content}\n\n`;
  }

  /**
   * 生成文档尾部
   */
  private generateDocumentFooter(): string {
    return `---\n\n*本文档由 TaskFlow AI 自动生成于 ${new Date().toLocaleString('zh-CN')}*\n`;
  }

  /**
   * 统计字数
   * @param content 文档内容
   */
  private countWords(content: string): number {
    // 移除Markdown标记
    const plainText = content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/---/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    // 中英文混合字数统计
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length;

    return chineseChars + englishWords;
  }

  /**
   * 生成项目简介章节
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   */
  private generateIntroductionSection(taskPlan: TaskPlan, requirements: Requirement[]): string {
    let content = `${taskPlan.description || '本项目旨在实现一个功能完整的系统解决方案。'}\n\n`;

    content += '### 项目背景\n\n';
    content += '基于业务需求分析，本项目将通过系统化的开发流程，实现以下核心价值：\n\n';

    const businessRequirements = requirements.filter(r => r.type === 'business');
    if (businessRequirements.length > 0) {
      businessRequirements.forEach(req => {
        content += `- ${req.title}: ${req.description}\n`;
      });
    } else {
      content += '- 提升业务效率和用户体验\n';
      content += '- 实现系统功能的完整性和稳定性\n';
      content += '- 确保技术架构的可扩展性和可维护性\n';
    }

    content += '\n### 项目特点\n\n';
    content += `- **任务总数**: ${taskPlan.tasks.length} 个\n`;
    content += `- **预计工期**: ${this.calculateProjectDuration(taskPlan)} 天\n`;
    content += `- **团队规模**: ${this.getTeamSize(taskPlan)} 人\n`;
    content += `- **技术栈**: ${this.extractTechnologyStack(requirements).join(', ') || '现代化技术栈'}\n`;

    return content;
  }

  /**
   * 生成项目目标章节
   * @param requirements 需求列表
   */
  private generateObjectivesSection(requirements: Requirement[]): string {
    let content = '本项目的主要目标包括：\n\n';

    const highPriorityReqs = requirements.filter(r => r.priority === 'high' || r.priority === 'critical');

    if (highPriorityReqs.length > 0) {
      highPriorityReqs.forEach((req, index) => {
        content += `${index + 1}. **${req.title}**\n`;
        content += `   ${req.description}\n\n`;
      });
    } else {
      content += '1. **功能完整性**: 实现所有核心业务功能\n';
      content += '2. **系统稳定性**: 确保系统稳定可靠运行\n';
      content += '3. **用户体验**: 提供良好的用户交互体验\n';
      content += '4. **技术先进性**: 采用现代化技术架构\n';
    }

    content += '\n### 成功标准\n\n';
    content += '项目成功的衡量标准：\n\n';
    content += '- 所有功能需求得到实现\n';
    content += '- 系统性能满足预期指标\n';
    content += '- 用户验收测试通过\n';
    content += '- 项目按时交付\n';

    return content;
  }

  /**
   * 生成项目范围章节
   * @param requirements 需求列表
   */
  private generateScopeSection(requirements: Requirement[]): string {
    let content = '### 项目包含的功能模块\n\n';

    const functionalReqs = requirements.filter(r => r.type === 'functional');
    const modules = this.groupRequirementsByModule(functionalReqs);

    Object.entries(modules).forEach(([module, reqs]) => {
      content += `#### ${module}\n\n`;
      reqs.forEach(req => {
        content += `- ${req.title}\n`;
      });
      content += '\n';
    });

    content += '### 项目不包含的内容\n\n';
    content += '为了明确项目边界，以下内容不在本项目范围内：\n\n';
    content += '- 第三方系统集成（除非明确说明）\n';
    content += '- 历史数据迁移（除非明确说明）\n';
    content += '- 运维监控系统\n';
    content += '- 用户培训和支持\n';

    const nonFunctionalReqs = requirements.filter(r => r.type === 'non_functional');
    if (nonFunctionalReqs.length > 0) {
      content += '\n### 非功能性要求\n\n';
      nonFunctionalReqs.forEach(req => {
        content += `- **${req.title}**: ${req.description}\n`;
      });
    }

    return content;
  }

  /**
   * 生成时间线章节
   * @param taskPlan 任务计划
   */
  private generateTimelineSection(taskPlan: TaskPlan): string {
    let content = '### 项目里程碑\n\n';

    const phases = this.groupTasksByPhase(taskPlan.tasks);
    let currentDate = new Date();

    Object.entries(phases).forEach(([phase, tasks]) => {
      const phaseDuration = tasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0) / 8;
      const phaseEndDate = new Date(currentDate.getTime() + phaseDuration * 24 * 60 * 60 * 1000);

      content += `- **${phase}**: ${currentDate.toLocaleDateString()} - ${phaseEndDate.toLocaleDateString()}\n`;
      content += `  - 任务数量: ${tasks.length}\n`;
      content += `  - 预计工期: ${Math.ceil(phaseDuration)} 天\n\n`;

      currentDate = phaseEndDate;
    });

    content += '### 关键时间节点\n\n';
    content += '| 里程碑 | 预计完成时间 | 交付物 |\n';
    content += '|--------|-------------|--------|\n';

    Object.entries(phases).forEach(([phase, tasks]) => {
      const deliverables = this.getPhaseDeliverables(phase, tasks);
      content += `| ${phase} | ${currentDate.toLocaleDateString()} | ${deliverables.join(', ')} |\n`;
    });

    return content;
  }

  /**
   * 生成团队章节
   * @param taskPlan 任务计划
   */
  private generateTeamSection(taskPlan: TaskPlan): string {
    const assignees = [...new Set(taskPlan.tasks.map(t => t.assignee).filter(Boolean))];
    const roles = this.inferRoles(taskPlan.tasks);

    let content = '### 团队组成\n\n';

    if (assignees.length > 0) {
      content += '| 成员 | 角色 | 负责任务数 |\n';
      content += '|------|------|----------|\n';

      assignees.forEach(assignee => {
        const taskCount = taskPlan.tasks.filter(t => t.assignee === assignee).length;
        const role = roles.get(assignee!) || '开发工程师';
        content += `| ${assignee} | ${role} | ${taskCount} |\n`;
      });
    } else {
      content += '团队规模建议：\n\n';
      content += '- **项目经理**: 1人，负责项目整体协调\n';
      content += '- **架构师**: 1人，负责技术架构设计\n';
      content += '- **前端开发**: 2人，负责用户界面开发\n';
      content += '- **后端开发**: 2人，负责服务端开发\n';
      content += '- **测试工程师**: 1人，负责质量保证\n';
      content += '- **UI/UX设计师**: 1人，负责界面设计\n';
    }

    content += '\n### 技能要求\n\n';
    const skills = this.extractRequiredSkills(taskPlan.tasks);
    skills.forEach(skill => {
      content += `- ${skill}\n`;
    });

    return content;
  }

  /**
   * 生成风险评估章节
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   */
  private generateRisksSection(taskPlan: TaskPlan, requirements: Requirement[]): string {
    let content = '### 主要风险识别\n\n';

    const risks = this.identifyProjectRisks(taskPlan, requirements);

    content += '| 风险类型 | 风险描述 | 影响程度 | 应对措施 |\n';
    content += '|----------|----------|----------|----------|\n';

    risks.forEach(risk => {
      content += `| ${risk.type} | ${risk.description} | ${risk.impact} | ${risk.mitigation} |\n`;
    });

    content += '\n### 风险监控\n\n';
    content += '项目执行过程中将持续监控以下风险指标：\n\n';
    content += '- 任务完成进度偏差\n';
    content += '- 技术难点解决时间\n';
    content += '- 团队成员可用性变化\n';
    content += '- 需求变更频率\n';

    return content;
  }

  /**
   * 计算项目工期
   * @param taskPlan 任务计划
   */
  private calculateProjectDuration(taskPlan: TaskPlan): number {
    const totalHours = taskPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0);
    const teamSize = this.getTeamSize(taskPlan);
    return Math.ceil(totalHours / (8 * teamSize));
  }

  /**
   * 获取团队规模
   * @param taskPlan 任务计划
   */
  private getTeamSize(taskPlan: TaskPlan): number {
    const assignees = new Set(taskPlan.tasks.map(t => t.assignee).filter(Boolean));
    return Math.max(assignees.size, 3); // 最少3人团队
  }

  /**
   * 提取技术栈
   * @param requirements 需求列表
   */
  private extractTechnologyStack(requirements: Requirement[]): string[] {
    const techKeywords = [
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Spring Boot',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
      'TypeScript', 'JavaScript', 'Python', 'Java', 'Go'
    ];

    const technologies = new Set<string>();
    const allText = requirements.map(r => `${r.title} ${r.description}`).join(' ');

    techKeywords.forEach(tech => {
      if (allText.toLowerCase().includes(tech.toLowerCase())) {
        technologies.add(tech);
      }
    });

    return Array.from(technologies);
  }

  /**
   * 按模块分组需求
   * @param requirements 需求列表
   */
  private groupRequirementsByModule(requirements: Requirement[]): Record<string, Requirement[]> {
    const modules: Record<string, Requirement[]> = {};

    requirements.forEach(req => {
      const module = this.inferModule(req.title);
      if (!modules[module]) {
        modules[module] = [];
      }
      modules[module].push(req);
    });

    return modules;
  }

  /**
   * 推断需求所属模块
   * @param title 需求标题
   */
  private inferModule(title: string): string {
    const moduleKeywords = {
      '用户管理': ['用户', '登录', '注册', '认证', '权限'],
      '商品管理': ['商品', '产品', '库存', '价格'],
      '订单管理': ['订单', '购买', '支付', '结算'],
      '系统管理': ['系统', '配置', '监控', '日志'],
      '数据管理': ['数据', '报表', '统计', '分析']
    };

    for (const [module, keywords] of Object.entries(moduleKeywords)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return module;
      }
    }

    return '其他功能';
  }

  /**
   * 按阶段分组任务
   * @param tasks 任务列表
   */
  private groupTasksByPhase(tasks: Task[]): Record<string, Task[]> {
    const phases: Record<string, Task[]> = {
      '需求分析': [],
      '设计阶段': [],
      '开发阶段': [],
      '测试阶段': [],
      '部署阶段': []
    };

    tasks.forEach(task => {
      const phase = this.inferTaskPhase(task);
      if (phases[phase]) {
        phases[phase].push(task);
      }
    });

    return phases;
  }

  /**
   * 推断任务所属阶段
   * @param task 任务
   */
  private inferTaskPhase(task: Task): string {
    const title = task.title.toLowerCase();
    const type = task.type;

    if (type === 'research' || title.includes('分析') || title.includes('调研')) {
      return '需求分析';
    }
    if (type === 'design' || title.includes('设计') || title.includes('架构')) {
      return '设计阶段';
    }
    if (type === 'feature' || type === 'refactor' || title.includes('开发') || title.includes('实现')) {
      return '开发阶段';
    }
    if (type === 'test' || title.includes('测试') || title.includes('验证')) {
      return '测试阶段';
    }
    if (type === 'deployment' || title.includes('部署') || title.includes('发布')) {
      return '部署阶段';
    }

    return '开发阶段'; // 默认阶段
  }

  /**
   * 获取阶段交付物
   * @param phase 阶段名称
   * @param tasks 阶段任务
   */
  private getPhaseDeliverables(phase: string, tasks: Task[]): string[] {
    const deliverables: Record<string, string[]> = {
      '需求分析': ['需求规格说明书', '用户故事', '验收标准'],
      '设计阶段': ['系统架构图', '数据库设计', 'UI设计稿', 'API设计文档'],
      '开发阶段': ['功能代码', '单元测试', '集成测试'],
      '测试阶段': ['测试报告', '缺陷报告', '性能测试报告'],
      '部署阶段': ['部署文档', '运维手册', '用户手册']
    };

    return deliverables[phase] || ['阶段成果物'];
  }

  /**
   * 推断角色
   * @param tasks 任务列表
   */
  private inferRoles(tasks: Task[]): Map<string, string> {
    const roles = new Map<string, string>();
    const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];

    assignees.forEach(assignee => {
      const assigneeTasks = tasks.filter(t => t.assignee === assignee);
      const taskTypes = assigneeTasks.map(t => t.type);

      if (taskTypes.includes(TaskType.DESIGN)) {
        roles.set(assignee!, '设计师');
      } else if (taskTypes.includes(TaskType.TEST)) {
        roles.set(assignee!, '测试工程师');
      } else if (taskTypes.includes(TaskType.DEPLOYMENT)) {
        roles.set(assignee!, '运维工程师');
      } else {
        roles.set(assignee!, '开发工程师');
      }
    });

    return roles;
  }

  /**
   * 提取所需技能
   * @param tasks 任务列表
   */
  private extractRequiredSkills(tasks: Task[]): string[] {
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
      'Node.js', 'Python', 'Java', 'Go', 'PHP',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'Docker', 'Kubernetes', 'AWS', 'Azure',
      'UI设计', 'UX设计', '测试', '项目管理'
    ];

    const skills = new Set<string>();
    const allText = tasks.map(t => `${t.title} ${t.description}`).join(' ');

    skillKeywords.forEach(skill => {
      if (allText.toLowerCase().includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  /**
   * 识别项目风险
   * @param taskPlan 任务计划
   * @param requirements 需求列表
   */
  private identifyProjectRisks(taskPlan: TaskPlan, requirements: Requirement[]): Array<{
    type: string;
    description: string;
    impact: string;
    mitigation: string;
  }> {
    const risks = [];

    // 技术风险
    const complexTasks = taskPlan.tasks.filter(t => (t.estimatedHours || 8) > 40);
    if (complexTasks.length > 0) {
      risks.push({
        type: '技术风险',
        description: '存在高复杂度任务，可能遇到技术难点',
        impact: '高',
        mitigation: '提前进行技术调研，安排有经验的开发人员'
      });
    }

    // 时间风险
    const totalHours = taskPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0);
    if (totalHours > 1000) {
      risks.push({
        type: '进度风险',
        description: '项目规模较大，存在延期风险',
        impact: '中',
        mitigation: '合理分解任务，增加进度检查点'
      });
    }

    // 需求风险
    const unclearReqs = requirements.filter(r => !r.acceptanceCriteria || r.acceptanceCriteria.length === 0);
    if (unclearReqs.length > 0) {
      risks.push({
        type: '需求风险',
        description: '部分需求缺乏明确的验收标准',
        impact: '中',
        mitigation: '与业务方确认需求细节，完善验收标准'
      });
    }

    // 资源风险
    const assignees = new Set(taskPlan.tasks.map(t => t.assignee).filter(Boolean));
    if (assignees.size < 3) {
      risks.push({
        type: '资源风险',
        description: '团队规模较小，关键人员离职风险',
        impact: '高',
        mitigation: '知识共享，交叉培训，建立备份方案'
      });
    }

    return risks;
  }

  /**
   * 生成架构设计章节
   */
  private generateArchitectureSection(taskPlan: TaskPlan, requirements: Requirement[]): string {
    const sections = [];

    sections.push('## 系统架构概述');
    sections.push('本系统采用分层架构设计，确保系统的可扩展性和可维护性。');

    sections.push('\n### 架构层次');
    sections.push('- **表现层**: 用户界面和API接口');
    sections.push('- **业务层**: 核心业务逻辑处理');
    sections.push('- **数据层**: 数据存储和访问');
    sections.push('- **基础设施层**: 系统支撑服务');

    return sections.join('\n');
  }

  /**
   * 生成技术栈章节
   */
  private generateTechnologyStackSection(taskPlan: TaskPlan, requirements: Requirement[]): string {
    const sections = [];

    sections.push('## 技术栈选择');
    sections.push('基于项目需求和团队技术栈，选择以下技术：');

    sections.push('\n### 前端技术');
    sections.push('- **框架**: React/Vue.js');
    sections.push('- **状态管理**: Redux/Vuex');
    sections.push('- **UI组件**: Ant Design/Element UI');

    sections.push('\n### 后端技术');
    sections.push('- **运行时**: Node.js');
    sections.push('- **框架**: Express/Koa');
    sections.push('- **数据库**: MongoDB/MySQL');

    return sections.join('\n');
  }

  /**
   * 生成数据模型章节
   */
  private generateDataModelSection(requirements: Requirement[]): string {
    const sections = [];

    sections.push('## 数据模型设计');
    sections.push('系统核心数据模型定义：');

    sections.push('\n### 核心实体');
    sections.push('- **用户模型**: 用户基本信息和权限');
    sections.push('- **业务模型**: 核心业务数据结构');
    sections.push('- **配置模型**: 系统配置和参数');

    return sections.join('\n');
  }

  /**
   * 生成API设计章节
   */
  private generateApiDesignSection(requirements: Requirement[]): string {
    const sections = [];

    sections.push('## API设计规范');
    sections.push('遵循RESTful设计原则，提供统一的API接口。');

    sections.push('\n### 接口规范');
    sections.push('- **协议**: HTTPS');
    sections.push('- **格式**: JSON');
    sections.push('- **认证**: JWT Token');

    return sections.join('\n');
  }

  /**
   * 生成安全设计章节
   */
  private generateSecuritySection(requirements: Requirement[]): string {
    const sections = [];

    sections.push('## 安全设计');
    sections.push('系统安全策略和防护措施：');

    sections.push('\n### 安全措施');
    sections.push('- **身份认证**: 多因子认证');
    sections.push('- **数据加密**: 传输和存储加密');
    sections.push('- **访问控制**: 基于角色的权限管理');

    return sections.join('\n');
  }

  /**
   * 生成性能设计章节
   */
  private generatePerformanceSection(requirements: Requirement[]): string {
    const sections = [];

    sections.push('## 性能设计');
    sections.push('系统性能优化策略：');

    sections.push('\n### 性能指标');
    sections.push('- **响应时间**: < 200ms');
    sections.push('- **并发用户**: 1000+');
    sections.push('- **可用性**: 99.9%');

    return sections.join('\n');
  }

  /**
   * 生成任务摘要章节
   */
  private generateTaskSummarySection(taskPlan: TaskPlan): string {
    const sections = [];

    sections.push('## 任务摘要');
    sections.push(`项目包含 ${taskPlan.tasks.length} 个主要任务。`);

    const statusCounts = this.getTaskStatusCounts(taskPlan.tasks);
    sections.push('\n### 任务状态分布');
    Object.entries(statusCounts).forEach(([status, count]) => {
      sections.push(`- ${status}: ${count} 个任务`);
    });

    return sections.join('\n');
  }

  /**
   * 生成任务列表章节
   */
  private generateTaskListSection(taskPlan: TaskPlan): string {
    const sections = [];

    sections.push('## 详细任务列表');

    taskPlan.tasks.forEach((task, index) => {
      sections.push(`\n### ${index + 1}. ${task.name}`);
      sections.push(`**状态**: ${task.status}`);
      sections.push(`**优先级**: ${task.priority}`);
      sections.push(`**描述**: ${task.description}`);

      if (task.dependencies.length > 0) {
        sections.push(`**依赖**: ${task.dependencies.join(', ')}`);
      }
    });

    return sections.join('\n');
  }

  /**
   * 生成依赖关系章节
   */
  private generateDependenciesSection(taskPlan: TaskPlan): string {
    const sections = [];

    sections.push('## 任务依赖关系');
    sections.push('任务间的依赖关系图：');

    const dependencies = taskPlan.tasks.filter(t => t.dependencies.length > 0);
    if (dependencies.length > 0) {
      sections.push('\n### 依赖关系');
      dependencies.forEach(task => {
        sections.push(`- ${task.name} 依赖于: ${task.dependencies.join(', ')}`);
      });
    } else {
      sections.push('\n暂无任务依赖关系。');
    }

    return sections.join('\n');
  }

  /**
   * 生成任务时间线章节
   */
  private generateTaskTimelineSection(taskPlan: TaskPlan, orchestrationResult?: any): string {
    const sections = [];

    sections.push('## 任务时间线');
    sections.push('项目执行时间规划：');

    sections.push('\n### 里程碑');
    sections.push('- **项目启动**: 第1周');
    sections.push('- **开发阶段**: 第2-8周');
    sections.push('- **测试阶段**: 第9-10周');
    sections.push('- **部署上线**: 第11周');

    return sections.join('\n');
  }

  /**
   * 生成资源分配章节
   */
  private generateResourceAllocationSection(taskPlan: TaskPlan): string {
    const sections = [];

    sections.push('## 资源分配');
    sections.push('项目人力资源分配计划：');

    const assignees = new Set(taskPlan.tasks.map(t => t.assignee).filter(Boolean));
    sections.push(`\n### 团队成员 (${assignees.size}人)`);
    assignees.forEach(assignee => {
      const tasks = taskPlan.tasks.filter(t => t.assignee === assignee);
      sections.push(`- **${assignee}**: ${tasks.length} 个任务`);
    });

    return sections.join('\n');
  }

  /**
   * 生成优化建议章节
   */
  private generateOptimizationSection(orchestrationResult?: any): string {
    const sections = [];

    sections.push('## 优化建议');
    sections.push('基于任务分析的优化建议：');

    sections.push('\n### 执行建议');
    sections.push('- 优先执行高优先级任务');
    sections.push('- 并行执行无依赖任务');
    sections.push('- 定期评估进度和风险');

    return sections.join('\n');
  }

  /**
   * 获取任务状态统计
   */
  private getTaskStatusCounts(tasks: Task[]): Record<string, number> {
    const counts: Record<string, number> = {};
    tasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
    });
    return counts;
  }

  /**
   * 提取API端点信息
   */
  private extractApiEndpoints(requirements: Requirement[]): any[] {
    // 简化实现，返回示例API端点
    return [
      {
        method: 'GET',
        path: '/api/users',
        description: '获取用户列表',
        parameters: [],
        responses: { 200: '成功返回用户列表' }
      },
      {
        method: 'POST',
        path: '/api/users',
        description: '创建新用户',
        parameters: ['name', 'email'],
        responses: { 201: '用户创建成功', 400: '参数错误' }
      }
    ];
  }

  /**
   * 生成API概览章节
   */
  private generateApiOverviewSection(apiEndpoints: any[]): string {
    const sections = [];

    sections.push('## API概览');
    sections.push(`系统提供 ${apiEndpoints.length} 个API接口。`);

    sections.push('\n### 接口列表');
    apiEndpoints.forEach(endpoint => {
      sections.push(`- **${endpoint.method} ${endpoint.path}**: ${endpoint.description}`);
    });

    return sections.join('\n');
  }

  /**
   * 生成认证章节
   */
  private generateAuthenticationSection(requirements: Requirement[]): string {
    const sections = [];

    sections.push('## 认证机制');
    sections.push('API使用JWT Token进行身份认证。');

    sections.push('\n### 认证流程');
    sections.push('1. 用户登录获取Token');
    sections.push('2. 请求头携带Authorization: Bearer <token>');
    sections.push('3. 服务器验证Token有效性');

    return sections.join('\n');
  }

  /**
   * 生成端点详情章节
   */
  private generateEndpointsSection(apiEndpoints: any[]): string {
    const sections = [];

    sections.push('## 接口详情');

    apiEndpoints.forEach(endpoint => {
      sections.push(`\n### ${endpoint.method} ${endpoint.path}`);
      sections.push(`**描述**: ${endpoint.description}`);

      if (endpoint.parameters.length > 0) {
        sections.push(`**参数**: ${endpoint.parameters.join(', ')}`);
      }

      sections.push('**响应**:');
      Object.entries(endpoint.responses).forEach(([code, desc]) => {
        sections.push(`- ${code}: ${desc}`);
      });
    });

    return sections.join('\n');
  }

  /**
   * 生成API数据模型章节
   */
  private generateApiDataModelsSection(apiEndpoints: any[]): string {
    const sections = [];

    sections.push('## 数据模型');
    sections.push('API使用的数据结构定义：');

    sections.push('\n### 用户模型');
    sections.push('```json');
    sections.push('{');
    sections.push('  "id": "string",');
    sections.push('  "name": "string",');
    sections.push('  "email": "string"');
    sections.push('}');
    sections.push('```');

    return sections.join('\n');
  }

  /**
   * 生成错误码章节
   */
  private generateErrorCodesSection(): string {
    const sections = [];

    sections.push('## 错误码说明');
    sections.push('API错误响应码定义：');

    sections.push('\n### 常见错误码');
    sections.push('- **400**: 请求参数错误');
    sections.push('- **401**: 未授权访问');
    sections.push('- **403**: 权限不足');
    sections.push('- **404**: 资源不存在');
    sections.push('- **500**: 服务器内部错误');

    return sections.join('\n');
  }

  /**
   * 生成API示例章节
   */
  private generateApiExamplesSection(apiEndpoints: any[]): string {
    const sections = [];

    sections.push('## 使用示例');
    sections.push('API调用示例：');

    sections.push('\n### 获取用户列表');
    sections.push('```bash');
    sections.push('curl -X GET "https://api.example.com/users" \\');
    sections.push('  -H "Authorization: Bearer <token>"');
    sections.push('```');

    return sections.join('\n');
  }

  /**
   * 提取用户功能
   */
  private extractUserFeatures(requirements: Requirement[]): any[] {
    // 简化实现，返回示例功能
    return [
      {
        name: '用户管理',
        description: '用户注册、登录、信息管理',
        priority: 'high'
      },
      {
        name: '数据管理',
        description: '数据的增删改查操作',
        priority: 'medium'
      }
    ];
  }

  /**
   * 生成快速开始章节
   */
  private generateGettingStartedSection(userFeatures: any[]): string {
    const sections = [];

    sections.push('## 快速开始');
    sections.push('系统使用入门指南：');

    sections.push('\n### 安装步骤');
    sections.push('1. 下载安装包');
    sections.push('2. 运行安装程序');
    sections.push('3. 完成初始配置');
    sections.push('4. 开始使用系统');

    return sections.join('\n');
  }

  /**
   * 生成功能说明章节
   */
  private generateFeaturesSection(userFeatures: any[]): string {
    const sections = [];

    sections.push('## 功能说明');
    sections.push('系统主要功能介绍：');

    userFeatures.forEach(feature => {
      sections.push(`\n### ${feature.name}`);
      sections.push(`**描述**: ${feature.description}`);
      sections.push(`**优先级**: ${feature.priority}`);
    });

    return sections.join('\n');
  }

  /**
   * 生成教程章节
   */
  private generateTutorialsSection(userFeatures: any[]): string {
    const sections = [];

    sections.push('## 使用教程');
    sections.push('详细的操作指南：');

    sections.push('\n### 基础操作');
    sections.push('1. 登录系统');
    sections.push('2. 浏览功能菜单');
    sections.push('3. 执行基本操作');

    return sections.join('\n');
  }

  /**
   * 生成FAQ章节
   */
  private generateFaqSection(userFeatures: any[]): string {
    const sections = [];

    sections.push('## 常见问题');
    sections.push('用户常见问题解答：');

    sections.push('\n### Q: 如何重置密码？');
    sections.push('A: 在登录页面点击"忘记密码"，按提示操作。');

    sections.push('\n### Q: 如何联系技术支持？');
    sections.push('A: 发送邮件至 support@example.com 或拨打客服电话。');

    return sections.join('\n');
  }

  /**
   * 生成故障排除章节
   */
  private generateTroubleshootingSection(): string {
    const sections = [];

    sections.push('## 故障排除');
    sections.push('常见问题的解决方案：');

    sections.push('\n### 登录问题');
    sections.push('- 检查用户名和密码是否正确');
    sections.push('- 确认网络连接正常');
    sections.push('- 清除浏览器缓存');

    sections.push('\n### 性能问题');
    sections.push('- 检查系统资源使用情况');
    sections.push('- 优化数据库查询');
    sections.push('- 升级硬件配置');

    return sections.join('\n');
  }
}
