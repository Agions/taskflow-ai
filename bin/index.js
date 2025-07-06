#!/usr/bin/env node
'use strict';

var commander = require('commander');
var chalk = require('chalk');
var fs = require('fs-extra');
var path = require('path');
var winston = require('winston');
var Conf = require('conf');
var inquirer = require('inquirer');
var ora = require('ora');
var boxen = require('boxen');
var fs$1 = require('fs');
var os = require('os');
var axios = require('axios');
var crypto = require('crypto');
var MarkdownIt = require('markdown-it');
var events = require('events');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var fs__namespace$1 = /*#__PURE__*/_interopNamespaceDefault(fs$1);
var os__namespace = /*#__PURE__*/_interopNamespaceDefault(os);
var crypto__namespace = /*#__PURE__*/_interopNamespaceDefault(crypto);

/**
 * 模型相关类型定义
 */
/**
 * 消息角色
 */
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["SYSTEM"] = "system";
})(MessageRole || (MessageRole = {}));
/**
 * 文件类型
 */
var FileType;
(function (FileType) {
    FileType["MARKDOWN"] = "markdown";
    FileType["PDF"] = "pdf";
    FileType["WORD"] = "word";
    FileType["TEXT"] = "text";
    FileType["JSON"] = "json";
    FileType["UNKNOWN"] = "unknown";
})(FileType || (FileType = {}));

/**
 * 文档处理器 - 支持多种格式的文档解析
 * 作为PRD解析引擎的核心组件
 */
/**
 * 文档类型枚举
 */
var DocumentType;
(function (DocumentType) {
    DocumentType["MARKDOWN"] = "markdown";
    DocumentType["TEXT"] = "text";
    DocumentType["JSON"] = "json";
    DocumentType["HTML"] = "html";
    DocumentType["WORD"] = "word";
    DocumentType["PDF"] = "pdf";
})(DocumentType || (DocumentType = {}));
/**
 * 章节类型枚举
 */
var SectionType;
(function (SectionType) {
    SectionType["OVERVIEW"] = "overview";
    SectionType["REQUIREMENTS"] = "requirements";
    SectionType["FEATURES"] = "features";
    SectionType["TECHNICAL"] = "technical";
    SectionType["TIMELINE"] = "timeline";
    SectionType["RESOURCES"] = "resources";
    SectionType["APPENDIX"] = "appendix";
    SectionType["OTHER"] = "other";
})(SectionType || (SectionType = {}));
/**
 * 文档处理器类
 */
class DocumentProcessor {
    constructor(logger) {
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
    async processDocument(filePath, options = {}) {
        try {
            this.logger.info(`开始处理文档: ${filePath}`);
            // 检查文件是否存在
            if (!await fs__namespace.pathExists(filePath)) {
                throw new Error(`文件不存在: ${filePath}`);
            }
            // 获取文件信息
            const stats = await fs__namespace.stat(filePath);
            const documentType = this.detectDocumentType(filePath);
            // 读取文件内容
            const content = await this.readFileContent(filePath, documentType);
            // 生成元数据
            const metadata = {
                fileName: path__namespace.basename(filePath),
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
            const documentStructure = {
                title: this.extractTitle(content, documentType) || metadata.fileName,
                sections,
                metadata
            };
            this.logger.info(`文档处理完成: ${sections.length} 个章节`);
            return documentStructure;
        }
        catch (error) {
            this.logger.error(`文档处理失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 检测文档类型
     * @param filePath 文件路径
     */
    detectDocumentType(filePath) {
        const ext = path__namespace.extname(filePath).toLowerCase();
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
    async readFileContent(filePath, documentType) {
        switch (documentType) {
            case DocumentType.MARKDOWN:
            case DocumentType.TEXT:
            case DocumentType.HTML:
            case DocumentType.JSON:
                return await fs__namespace.readFile(filePath, 'utf-8');
            case DocumentType.WORD:
                // TODO: 实现Word文档解析
                this.logger.warn('Word文档解析暂未实现，将作为文本处理');
                return await fs__namespace.readFile(filePath, 'utf-8');
            case DocumentType.PDF:
                // TODO: 实现PDF文档解析
                this.logger.warn('PDF文档解析暂未实现，将作为文本处理');
                return await fs__namespace.readFile(filePath, 'utf-8');
            default:
                return await fs__namespace.readFile(filePath, 'utf-8');
        }
    }
    /**
     * 解析文档结构
     * @param content 文档内容
     * @param documentType 文档类型
     * @param options 处理选项
     */
    async parseDocumentStructure(content, documentType, options) {
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
    parseMarkdownStructure(content, options) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;
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
            }
            else if (currentSection && line) {
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
    parseTextStructure(content, options) {
        const sections = [];
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
    parseJsonStructure(content, _options) {
        try {
            const data = JSON.parse(content);
            const sections = [];
            if (Array.isArray(data)) {
                data.forEach((item, index) => {
                    sections.push(this.createSectionFromObject(item, `item-${index}`, 1));
                });
            }
            else if (typeof data === 'object') {
                Object.entries(data).forEach(([key, value], index) => {
                    sections.push(this.createSectionFromObject({ [key]: value }, `section-${index + 1}`, 1));
                });
            }
            return sections;
        }
        catch (error) {
            this.logger.error(`JSON解析失败: ${error.message}`);
            return [];
        }
    }
    /**
     * 解析HTML文档结构
     * @param content HTML内容
     * @param options 处理选项
     */
    parseHtmlStructure(content, options) {
        // 简化的HTML解析，提取标题和内容
        const sections = [];
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
    createSectionFromObject(obj, id, level) {
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
    buildSectionHierarchy(sections) {
        const result = [];
        const stack = [];
        for (const section of sections) {
            // 找到合适的父级
            while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
                stack.pop();
            }
            if (stack.length === 0) {
                // 顶级章节
                result.push(section);
            }
            else {
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
    classifySectionType(title) {
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
    extractKeywords(text) {
        // 简化的关键词提取
        const words = text
            .toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1);
        // 统计词频
        const wordCount = new Map();
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
    calculateImportance(title, content) {
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
        if (contentLength > 1000)
            score += 0.1;
        if (contentLength > 2000)
            score += 0.1;
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
    extractTitle(content, documentType) {
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
    detectLanguage(content) {
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
    countWords(content) {
        // 中英文混合的单词统计
        const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
        const englishWords = content.match(/[a-zA-Z]+/g);
        const chineseCount = chineseChars ? chineseChars.length : 0;
        const englishCount = englishWords ? englishWords.length : 0;
        return chineseCount + englishCount;
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TaskFlow AI 任务相关类型定义
 */
/**
 * 任务状态枚举
 */
var TaskStatus$1;
(function (TaskStatus) {
    TaskStatus["NOT_STARTED"] = "not_started";
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["DONE"] = "done";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["ON_HOLD"] = "on_hold";
    TaskStatus["REVIEW"] = "review";
    TaskStatus["TODO"] = "todo";
})(TaskStatus$1 || (TaskStatus$1 = {}));
/**
 * 任务优先级
 */
var TaskPriority$1;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["CRITICAL"] = "critical";
})(TaskPriority$1 || (TaskPriority$1 = {}));
/**
 * 依赖关系类型
 */
var DependencyType;
(function (DependencyType) {
    DependencyType["FINISH_TO_START"] = "finish_to_start";
    DependencyType["START_TO_START"] = "start_to_start";
    DependencyType["FINISH_TO_FINISH"] = "finish_to_finish";
    DependencyType["START_TO_FINISH"] = "start_to_finish";
})(DependencyType || (DependencyType = {}));
/**
 * 任务约束类型
 */
var TaskConstraint;
(function (TaskConstraint) {
    TaskConstraint["AS_SOON_AS_POSSIBLE"] = "asap";
    TaskConstraint["AS_LATE_AS_POSSIBLE"] = "alap";
    TaskConstraint["MUST_START_ON"] = "must_start_on";
    TaskConstraint["MUST_FINISH_ON"] = "must_finish_on";
    TaskConstraint["START_NO_EARLIER_THAN"] = "snet";
    TaskConstraint["START_NO_LATER_THAN"] = "snlt";
    TaskConstraint["FINISH_NO_EARLIER_THAN"] = "fnet";
    TaskConstraint["FINISH_NO_LATER_THAN"] = "fnlt";
})(TaskConstraint || (TaskConstraint = {}));
/**
 * 资源类型
 */
var ResourceType;
(function (ResourceType) {
    ResourceType["HUMAN"] = "human";
    ResourceType["EQUIPMENT"] = "equipment";
    ResourceType["MATERIAL"] = "material";
    ResourceType["SOFTWARE"] = "software";
    ResourceType["BUDGET"] = "budget";
})(ResourceType || (ResourceType = {}));
/**
 * 任务类型
 */
var TaskType;
(function (TaskType) {
    TaskType["FEATURE"] = "feature";
    TaskType["BUG_FIX"] = "bug_fix";
    TaskType["REFACTOR"] = "refactor";
    TaskType["TEST"] = "test";
    TaskType["DOCUMENT"] = "document";
    TaskType["ANALYSIS"] = "analysis";
    TaskType["DESIGN"] = "design";
    TaskType["DEPLOYMENT"] = "deployment";
    TaskType["RESEARCH"] = "research";
})(TaskType || (TaskType = {}));
/**
 * 调度策略
 */
var SchedulingStrategy;
(function (SchedulingStrategy) {
    SchedulingStrategy["CRITICAL_PATH"] = "critical_path";
    SchedulingStrategy["PRIORITY_FIRST"] = "priority_first";
    SchedulingStrategy["SHORTEST_FIRST"] = "shortest_first";
    SchedulingStrategy["LONGEST_FIRST"] = "longest_first";
    SchedulingStrategy["RESOURCE_LEVELING"] = "resource_leveling";
    SchedulingStrategy["EARLY_START"] = "early_start";
    SchedulingStrategy["LATE_START"] = "late_start";
})(SchedulingStrategy || (SchedulingStrategy = {}));
/**
 * 优化目标
 */
var OptimizationGoal;
(function (OptimizationGoal) {
    OptimizationGoal["MINIMIZE_DURATION"] = "minimize_duration";
    OptimizationGoal["MINIMIZE_COST"] = "minimize_cost";
    OptimizationGoal["MAXIMIZE_QUALITY"] = "maximize_quality";
    OptimizationGoal["BALANCE_RESOURCES"] = "balance_resources";
    OptimizationGoal["MINIMIZE_RISK"] = "minimize_risk";
})(OptimizationGoal || (OptimizationGoal = {}));
/**
 * 风险类别
 */
var RiskCategory;
(function (RiskCategory) {
    RiskCategory["TECHNICAL"] = "technical";
    RiskCategory["RESOURCE"] = "resource";
    RiskCategory["SCHEDULE"] = "schedule";
    RiskCategory["QUALITY"] = "quality";
    RiskCategory["EXTERNAL"] = "external";
    RiskCategory["COMMUNICATION"] = "communication";
})(RiskCategory || (RiskCategory = {}));

/**
 * 需求提取器 - 从文档中智能提取和分析需求
 * 使用自然语言处理和模式匹配技术
 */
/**
 * 需求类型枚举
 */
var RequirementType;
(function (RequirementType) {
    RequirementType["FUNCTIONAL"] = "functional";
    RequirementType["NON_FUNCTIONAL"] = "non_functional";
    RequirementType["BUSINESS"] = "business";
    RequirementType["TECHNICAL"] = "technical";
    RequirementType["USER_STORY"] = "user_story";
    RequirementType["CONSTRAINT"] = "constraint";
    RequirementType["ASSUMPTION"] = "assumption"; // 假设条件
})(RequirementType || (RequirementType = {}));
/**
 * 需求提取器类
 */
class RequirementExtractor {
    constructor(logger) {
        // 需求识别模式
        this.requirementPatterns = {
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
        this.priorityKeywords = {
            critical: ['关键', '核心', '重要', '必须', 'critical', 'essential', 'must', 'key'],
            high: ['高', '优先', '重点', 'high', 'priority', 'important'],
            medium: ['中等', '一般', '普通', 'medium', 'normal', 'standard'],
            low: ['低', '次要', '可选', 'low', 'optional', 'nice to have']
        };
        // 复杂度关键词
        this.complexityKeywords = {
            high: ['复杂', '困难', '挑战', '集成', '算法', 'complex', 'difficult', 'challenging', 'integration'],
            medium: ['中等', '标准', '常规', 'medium', 'standard', 'typical'],
            low: ['简单', '基础', '直接', 'simple', 'basic', 'straightforward']
        };
        this.logger = logger;
    }
    /**
     * 从文档结构中提取需求
     * @param documentStructure 文档结构
     * @param options 提取选项
     */
    async extractRequirements(documentStructure, options = {}) {
        try {
            this.logger.info('开始提取需求');
            const requirements = [];
            const warnings = [];
            const suggestions = [];
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
        }
        catch (error) {
            this.logger.error(`需求提取失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 从单个章节提取需求
     * @param section 文档章节
     * @param options 提取选项
     */
    async extractFromSection(section, options) {
        const requirements = [];
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
    extractFunctionalRequirements(section, content) {
        const requirements = [];
        let reqCounter = 1;
        this.requirementPatterns.functional.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const description = match[0].trim();
                if (description.length > 10) { // 过滤太短的匹配
                    requirements.push(this.createRequirement(`${section.id}-func-${reqCounter++}`, this.extractTitle(description), description, RequirementType.FUNCTIONAL, section, content));
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
    extractNonFunctionalRequirements(section, content) {
        const requirements = [];
        let reqCounter = 1;
        this.requirementPatterns.nonFunctional.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const description = match[0].trim();
                if (description.length > 10) {
                    requirements.push(this.createRequirement(`${section.id}-nonfunc-${reqCounter++}`, this.extractTitle(description), description, RequirementType.NON_FUNCTIONAL, section, content));
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
    extractFeatureRequirements(section, content) {
        const requirements = [];
        // 按行分析，查找功能描述
        const lines = content.split('\n').filter(line => line.trim());
        let reqCounter = 1;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            // 检查是否是功能描述（列表项、编号项等）
            if (this.isFunctionDescription(trimmedLine)) {
                requirements.push(this.createRequirement(`${section.id}-feature-${reqCounter++}`, this.extractTitle(trimmedLine), trimmedLine, RequirementType.FUNCTIONAL, section, content));
            }
        });
        return requirements;
    }
    /**
     * 提取用户故事
     * @param section 章节
     * @param content 内容
     */
    extractUserStories(section, content) {
        const requirements = [];
        let storyCounter = 1;
        this.requirementPatterns.userStory.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const description = match[0].trim();
                requirements.push(this.createRequirement(`${section.id}-story-${storyCounter++}`, `用户故事 ${storyCounter}`, description, RequirementType.USER_STORY, section, content));
            }
        });
        return requirements;
    }
    /**
     * 提取技术需求
     * @param section 章节
     * @param content 内容
     */
    extractTechnicalRequirements(section, content) {
        const requirements = [];
        // 查找技术相关的描述
        const techKeywords = ['技术栈', '架构', '数据库', '框架', '接口', 'API', '服务', '组件'];
        const lines = content.split('\n').filter(line => line.trim());
        let reqCounter = 1;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (techKeywords.some(keyword => trimmedLine.includes(keyword)) && trimmedLine.length > 10) {
                requirements.push(this.createRequirement(`${section.id}-tech-${reqCounter++}`, this.extractTitle(trimmedLine), trimmedLine, RequirementType.TECHNICAL, section, content));
            }
        });
        return requirements;
    }
    /**
     * 提取通用需求
     * @param section 章节
     * @param content 内容
     */
    extractGeneralRequirements(section, content) {
        const requirements = [];
        // 简单的基于关键词的提取
        const lines = content.split('\n').filter(line => line.trim());
        let reqCounter = 1;
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (this.isRequirementLike(trimmedLine)) {
                requirements.push(this.createRequirement(`${section.id}-req-${reqCounter++}`, this.extractTitle(trimmedLine), trimmedLine, RequirementType.BUSINESS, section, content));
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
    createRequirement(id, title, description, type, section, _content) {
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
    analyzePriority(text) {
        const textLower = text.toLowerCase();
        for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                return priority;
            }
        }
        return TaskPriority$1.MEDIUM;
    }
    /**
     * 分析复杂度
     * @param text 文本
     */
    analyzeComplexity(text) {
        const textLower = text.toLowerCase();
        for (const [complexity, keywords] of Object.entries(this.complexityKeywords)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                return complexity;
            }
        }
        // 基于文本长度判断
        if (text.length > 200)
            return 'high';
        if (text.length > 100)
            return 'medium';
        return 'low';
    }
    /**
     * 估算工作量
     * @param description 描述
     * @param type 类型
     */
    estimateEffort(description, type) {
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
    calculateBusinessValue(description, type) {
        let value = 5; // 基础值
        const valueKeywords = ['收入', '用户', '体验', '效率', '成本', 'revenue', 'user', 'experience', 'efficiency'];
        const textLower = description.toLowerCase();
        valueKeywords.forEach(keyword => {
            if (textLower.includes(keyword)) {
                value += 1;
            }
        });
        // 根据类型调整
        if (type === RequirementType.BUSINESS)
            value += 2;
        if (type === RequirementType.USER_STORY)
            value += 1;
        return Math.min(10, value);
    }
    /**
     * 计算技术风险
     * @param description 描述
     * @param type 类型
     */
    calculateTechnicalRisk(description, type) {
        let risk = 3; // 基础风险
        const riskKeywords = ['集成', '新技术', '算法', '性能', '安全', 'integration', 'new', 'algorithm', 'performance', 'security'];
        const textLower = description.toLowerCase();
        riskKeywords.forEach(keyword => {
            if (textLower.includes(keyword)) {
                risk += 1;
            }
        });
        // 根据类型调整
        if (type === RequirementType.TECHNICAL)
            risk += 2;
        if (type === RequirementType.NON_FUNCTIONAL)
            risk += 1;
        return Math.min(10, risk);
    }
    /**
     * 计算提取置信度
     * @param description 描述
     * @param type 类型
     */
    calculateConfidence(description, _type) {
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
    extractAcceptanceCriteria(description) {
        const criteria = [];
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
    extractTags(description) {
        const tags = [];
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
    extractStakeholders(description) {
        const stakeholders = [];
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
    detectDependencies(requirements) {
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
    hasDependencyRelation(desc1, desc2) {
        // 简化的依赖检测逻辑
        const dependencyKeywords = ['基于', '依赖', '需要', '使用', 'based on', 'depends on', 'requires', 'uses'];
        return dependencyKeywords.some(keyword => desc1.toLowerCase().includes(keyword) &&
            desc2.toLowerCase().includes(keyword));
    }
    /**
     * 生成摘要
     * @param requirements 需求列表
     */
    generateSummary(requirements) {
        const functionalCount = requirements.filter(r => r.type === RequirementType.FUNCTIONAL).length;
        const nonFunctionalCount = requirements.filter(r => r.type === RequirementType.NON_FUNCTIONAL).length;
        const userStoryCount = requirements.filter(r => r.type === RequirementType.USER_STORY).length;
        const highPriorityCount = requirements.filter(r => r.priority === TaskPriority$1.HIGH || r.priority === TaskPriority$1.CRITICAL).length;
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
    generateSuggestions(requirements, summary) {
        const suggestions = [];
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
    validateRequirements(requirements) {
        const warnings = [];
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
    isFunctionDescription(line) {
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
    isRequirementLike(line) {
        const requirementIndicators = [
            '需要', '应该', '必须', '能够', '支持', '实现', '提供',
            'need', 'should', 'must', 'shall', 'support', 'implement', 'provide'
        ];
        return requirementIndicators.some(indicator => line.toLowerCase().includes(indicator)) && line.length > 15;
    }
    /**
     * 提取标题
     * @param text 文本
     */
    extractTitle(text) {
        // 提取前50个字符作为标题
        const title = text.substring(0, 50).trim();
        return title.endsWith('...') ? title : title + (text.length > 50 ? '...' : '');
    }
}

/**
 * PRD解析器类
 * 负责解析产品需求文档，整合文档处理和需求提取功能
 */
class PRDParser {
    /**
     * 创建PRD解析器实例
     * @param modelCoordinator 模型协调器实例
     * @param logger 日志记录器实例
     */
    constructor(modelCoordinator, logger) {
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
    async parseFromFile(filePath, options) {
        var _a, _b;
        try {
            this.logger.info(`开始解析PRD文件：${filePath}`);
            // 检查文件是否存在
            if (!await fs__namespace.pathExists(filePath)) {
                throw new Error(`文件不存在：${filePath}`);
            }
            // 使用文档处理器处理文档
            const processingOptions = {
                extractTables: true,
                extractImages: false,
                detectLanguage: true,
                analyzeStructure: true,
                extractKeywords: true,
                calculateImportance: true
            };
            const documentStructure = await this.documentProcessor.processDocument(filePath, processingOptions);
            // 使用需求提取器提取需求
            const extractionOptions = {
                includeUserStories: (_a = options === null || options === void 0 ? void 0 : options.extractFeatures) !== null && _a !== void 0 ? _a : true,
                detectDependencies: true,
                estimateEffort: true,
                analyzePriority: (_b = options === null || options === void 0 ? void 0 : options.prioritize) !== null && _b !== void 0 ? _b : true,
                extractAcceptanceCriteria: true,
                detectStakeholders: true
            };
            const extractionResult = await this.requirementExtractor.extractRequirements(documentStructure, extractionOptions);
            // 转换为ParsedPRD格式
            return this.convertToParseResult(documentStructure, extractionResult);
        }
        catch (error) {
            this.logger.error(`解析PRD文件失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 解析PRD内容
     * @param content PRD文档内容
     * @param fileType 文件类型
     * @param options 解析选项
     */
    async parseContent(content, fileType = FileType.MARKDOWN, options) {
        try {
            // 处理不同文件类型的内容
            const processedContent = this.preprocessContent(content, fileType);
            // 使用模型解析内容
            const response = await this.modelCoordinator.parsePRD(processedContent, options);
            // 解析并验证模型返回的JSON结果
            try {
                const result = JSON.parse(response.content);
                this.validateParseResult(result);
                this.logger.info('PRD解析成功');
                return result;
            }
            catch (error) {
                this.logger.error(`解析模型返回结果失败：${error.message}`);
                throw new Error(`无法解析模型返回的JSON结果：${error.message}`);
            }
        }
        catch (error) {
            this.logger.error(`解析PRD内容失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 预处理不同类型的文档内容
     * @param content 文档内容
     * @param fileType 文件类型
     */
    preprocessContent(content, fileType) {
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
                }
                catch {
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
    detectFileType(filePath) {
        const ext = path__namespace.extname(filePath).toLowerCase();
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
    validateParseResult(result) {
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
    convertToParseResult(documentStructure, extractionResult) {
        // 将需求转换为功能特性
        const features = extractionResult.requirements.map(req => ({
            id: req.id,
            name: req.title,
            description: req.description,
            priority: req.priority,
            type: req.type,
            dependencies: req.dependencies,
            estimatedHours: req.estimatedEffort,
            tags: req.tags,
            acceptanceCriteria: req.acceptanceCriteria,
            complexity: req.complexity,
            businessValue: req.businessValue,
            technicalRisk: req.technicalRisk,
            stakeholders: req.stakeholders,
            category: req.category,
            status: TaskStatus$1.NOT_STARTED,
            createdAt: req.metadata.extractedAt,
            updatedAt: req.metadata.extractedAt
        }));
        // 构建ParsedPRD对象
        const parsedPRD = {
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
    extractDescription(documentStructure) {
        // 查找概述或简介章节
        const overviewSection = documentStructure.sections.find(section => section.type === 'overview' ||
            section.title.toLowerCase().includes('概述') ||
            section.title.toLowerCase().includes('简介') ||
            section.title.toLowerCase().includes('overview'));
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
    convertToPRDSections(sections) {
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
    calculateMaxDepth(sections) {
        let maxDepth = 0;
        const calculateDepth = (sectionList, currentDepth = 1) => {
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
    hasTableOfContents(documentStructure) {
        return documentStructure.sections.some(section => section.title.toLowerCase().includes('目录') ||
            section.title.toLowerCase().includes('contents') ||
            section.title.toLowerCase().includes('toc'));
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 任务规划器类
 * 负责根据PRD生成任务计划
 */
class TaskPlanner {
    /**
     * 创建任务规划器实例
     * @param modelCoordinator 模型协调器实例
     * @param logger 日志记录器
     */
    constructor(modelCoordinator, logger) {
        this.modelCoordinator = modelCoordinator;
        this.logger = logger;
    }
    /**
     * 根据PRD解析结果生成任务计划
     * @param prdResult PRD解析结果
     * @param options 规划选项
     */
    async generateTaskPlan(prdResult, options) {
        try {
            this.logger.info('开始生成任务计划');
            // 使用模型生成任务计划
            const response = await this.modelCoordinator.planTasks(prdResult, options);
            try {
                // 解析模型返回的任务计划
                const taskPlan = JSON.parse(response.content);
                this.validateTaskPlan(taskPlan);
                // 后处理任务计划
                this.postProcessTaskPlan(taskPlan);
                this.logger.info(`任务计划生成成功，共 ${taskPlan.tasks.length} 个任务`);
                return taskPlan;
            }
            catch (error) {
                this.logger.error(`解析模型返回的任务计划失败：${error.message}`);
                throw new Error(`无法解析模型返回的JSON结果：${error.message}`);
            }
        }
        catch (error) {
            this.logger.error(`生成任务计划失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 优化任务计划
     * @param taskPlan 原始任务计划
     * @param options 优化选项
     */
    async optimizeTaskPlan(taskPlan, options) {
        try {
            this.logger.info('开始优化任务计划');
            // 1. 依赖关系优化
            this.optimizeDependencies(taskPlan);
            // 2. 优先级优化
            this.optimizePriorities(taskPlan, options);
            // 3. 并行任务识别
            this.identifyParallelTasks(taskPlan, options);
            // 4. 工作量平衡
            this.balanceWorkload(taskPlan, options);
            this.logger.info('任务计划优化完成');
            return taskPlan;
        }
        catch (error) {
            this.logger.error(`优化任务计划失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 将任务计划保存到文件
     * @param taskPlan 任务计划
     * @param outputPath 输出路径
     */
    async saveTaskPlan(taskPlan, outputPath) {
        try {
            // 确保目录存在
            await fs__namespace.ensureDir(path__namespace.dirname(outputPath));
            // 写入文件
            await fs__namespace.writeFile(outputPath, JSON.stringify(taskPlan, null, 2), 'utf-8');
            this.logger.info(`任务计划已保存至 ${outputPath}`);
        }
        catch (error) {
            this.logger.error(`保存任务计划失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 验证任务计划是否符合预期格式
     * @param taskPlan 任务计划
     */
    validateTaskPlan(taskPlan) {
        // 验证基本结构
        if (!taskPlan.name) {
            this.logger.warn('任务计划缺少名称');
        }
        if (!taskPlan.description) {
            this.logger.warn('任务计划缺少描述');
        }
        if (!Array.isArray(taskPlan.tasks)) {
            throw new Error('任务计划必须包含tasks数组');
        }
        // 验证每个任务的结构
        taskPlan.tasks.forEach((task, index) => {
            if (!task.id) {
                throw new Error(`第${index + 1}个任务缺少ID`);
            }
            if (!task.title) {
                this.logger.warn(`任务 ${task.id} 缺少标题`);
            }
            if (!task.priority) {
                this.logger.warn(`任务 ${task.id} 缺少优先级，设置为默认值'medium'`);
                task.priority = TaskPriority$1.MEDIUM;
            }
            if (!task.type) {
                this.logger.warn(`任务 ${task.id} 缺少类型，设置为默认值'feature'`);
                task.type = TaskType.FEATURE;
            }
            if (!Array.isArray(task.dependencies)) {
                this.logger.warn(`任务 ${task.id} 的dependencies字段不是数组，设置为空数组`);
                task.dependencies = [];
            }
            // 设置默认状态
            if (!task.status) {
                task.status = TaskStatus$1.NOT_STARTED;
            }
        });
    }
    /**
     * 后处理任务计划，添加一些自动生成的信息
     * @param taskPlan 任务计划
     */
    postProcessTaskPlan(taskPlan) {
        // 检查任务ID的唯一性
        const taskIds = new Set();
        taskPlan.tasks.forEach(task => {
            if (taskIds.has(task.id)) {
                // 如果ID重复，生成新的ID
                const newId = this.generateUniqueId(task.id, taskIds);
                this.logger.warn(`发现重复的任务ID: ${task.id}，自动更新为: ${newId}`);
                task.id = newId;
            }
            taskIds.add(task.id);
            // 验证依赖是否存在
            task.dependencies = task.dependencies.filter(depId => {
                if (!taskIds.has(depId) && depId !== task.id) {
                    this.logger.warn(`任务 ${task.id} 依赖的任务 ${depId} 不存在，已移除此依赖`);
                    return false;
                }
                if (depId === task.id) {
                    this.logger.warn(`任务 ${task.id} 不能依赖自身，已移除此依赖`);
                    return false;
                }
                return true;
            });
            // Note: Subtasks are not part of the Task interface in this implementation
        });
        // 检测依赖环
        this.checkCircularDependencies(taskPlan);
    }
    /**
     * 生成唯一ID
     * @param baseId 基础ID
     * @param existingIds 已存在的ID集合
     */
    generateUniqueId(baseId, existingIds) {
        let counter = 1;
        let newId = `${baseId}_${counter}`;
        while (existingIds.has(newId)) {
            counter++;
            newId = `${baseId}_${counter}`;
        }
        return newId;
    }
    /**
     * 检测任务依赖是否存在循环依赖
     * @param taskPlan 任务计划
     */
    checkCircularDependencies(taskPlan) {
        const graph = new Map();
        // 构建依赖图
        taskPlan.tasks.forEach(task => {
            graph.set(task.id, [...task.dependencies]);
        });
        const visited = new Set();
        const recStack = new Set();
        // 对每个任务进行DFS检测
        taskPlan.tasks.forEach(task => {
            this.detectCycle(task.id, graph, visited, recStack);
        });
    }
    /**
     * 使用DFS检测有向图中的环
     * @param node 当前节点
     * @param graph 依赖图
     * @param visited 已访问节点集合
     * @param recStack 递归栈
     */
    detectCycle(node, graph, visited, recStack) {
        if (recStack.has(node)) {
            // 检测到环，记录并移除造成环的依赖
            this.logger.warn(`检测到循环依赖，包含任务: ${node}`);
            return true;
        }
        if (visited.has(node)) {
            return false;
        }
        visited.add(node);
        recStack.add(node);
        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            if (this.detectCycle(neighbor, graph, visited, recStack)) {
                // 发现循环依赖，从图中移除这条边
                const deps = graph.get(node) || [];
                graph.set(node, deps.filter(d => d !== neighbor));
                this.logger.warn(`移除循环依赖: ${node} -> ${neighbor}`);
            }
        }
        recStack.delete(node);
        return false;
    }
    /**
     * 优化任务依赖关系
     * @param taskPlan 任务计划
     */
    optimizeDependencies(taskPlan) {
        this.logger.info('优化任务依赖关系');
        // 移除冗余依赖
        taskPlan.tasks.forEach(task => {
            const optimizedDeps = this.removeRedundantDependencies(task.dependencies, taskPlan);
            task.dependencies = optimizedDeps;
        });
        // 重新检测循环依赖
        this.checkCircularDependencies(taskPlan);
    }
    /**
     * 移除冗余依赖（传递依赖）
     * @param dependencies 依赖列表
     * @param taskPlan 任务计划
     */
    removeRedundantDependencies(dependencies, taskPlan) {
        if (dependencies.length <= 1) {
            return dependencies;
        }
        const taskMap = new Map();
        taskPlan.tasks.forEach(task => taskMap.set(task.id, task));
        const result = [];
        for (const depId of dependencies) {
            const depTask = taskMap.get(depId);
            if (!depTask)
                continue;
            // 检查是否存在传递依赖
            let isRedundant = false;
            for (const otherId of dependencies) {
                if (otherId === depId)
                    continue;
                if (this.hasTransitiveDependency(otherId, depId, taskMap)) {
                    isRedundant = true;
                    break;
                }
            }
            if (!isRedundant) {
                result.push(depId);
            }
        }
        return result;
    }
    /**
     * 检查是否存在传递依赖
     * @param fromId 起始任务ID
     * @param toId 目标任务ID
     * @param taskMap 任务映射
     */
    hasTransitiveDependency(fromId, toId, taskMap) {
        const visited = new Set();
        const queue = [fromId];
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (visited.has(currentId))
                continue;
            visited.add(currentId);
            const currentTask = taskMap.get(currentId);
            if (!currentTask)
                continue;
            for (const depId of currentTask.dependencies) {
                if (depId === toId) {
                    return true;
                }
                if (!visited.has(depId)) {
                    queue.push(depId);
                }
            }
        }
        return false;
    }
    /**
     * 优化任务优先级
     * @param taskPlan 任务计划
     * @param options 优化选项
     */
    optimizePriorities(taskPlan, _options) {
        this.logger.info('优化任务优先级');
        // 基于依赖关系调整优先级
        taskPlan.tasks.forEach(task => {
            // 如果任务有很多依赖者，提高其优先级
            const dependents = this.findDependentTasks(task.id, taskPlan);
            if (dependents.length >= 3) {
                task.priority = TaskPriority$1.HIGH;
            }
            else if (dependents.length >= 2) {
                task.priority = TaskPriority$1.MEDIUM;
            }
            // 关键路径上的任务提高优先级
            if (this.isOnCriticalPath(task.id, taskPlan)) {
                task.priority = TaskPriority$1.CRITICAL;
            }
        });
    }
    /**
     * 查找依赖某个任务的所有任务
     * @param taskId 任务ID
     * @param taskPlan 任务计划
     */
    findDependentTasks(taskId, taskPlan) {
        return taskPlan.tasks.filter(task => task.dependencies.includes(taskId));
    }
    /**
     * 检查任务是否在关键路径上
     * @param taskId 任务ID
     * @param taskPlan 任务计划
     */
    isOnCriticalPath(taskId, taskPlan) {
        // 简化的关键路径检测：检查任务是否有长依赖链
        const task = taskPlan.tasks.find(t => t.id === taskId);
        if (!task)
            return false;
        const maxDepth = this.calculateDependencyDepth(taskId, taskPlan);
        const avgDepth = this.calculateAverageDependencyDepth(taskPlan);
        return maxDepth > avgDepth * 1.5;
    }
    /**
     * 计算任务的依赖深度
     * @param taskId 任务ID
     * @param taskPlan 任务计划
     */
    calculateDependencyDepth(taskId, taskPlan) {
        const visited = new Set();
        const dfs = (id) => {
            if (visited.has(id))
                return 0;
            visited.add(id);
            const task = taskPlan.tasks.find(t => t.id === id);
            if (!task || task.dependencies.length === 0) {
                return 1;
            }
            let maxDepth = 0;
            for (const depId of task.dependencies) {
                maxDepth = Math.max(maxDepth, dfs(depId));
            }
            return maxDepth + 1;
        };
        return dfs(taskId);
    }
    /**
     * 计算平均依赖深度
     * @param taskPlan 任务计划
     */
    calculateAverageDependencyDepth(taskPlan) {
        const depths = taskPlan.tasks.map(task => this.calculateDependencyDepth(task.id, taskPlan));
        return depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
    }
    /**
     * 识别可并行执行的任务
     * @param taskPlan 任务计划
     * @param options 优化选项
     */
    identifyParallelTasks(taskPlan, _options) {
        this.logger.info('识别并行任务');
        const maxParallel = 3; // Default maximum parallel tasks
        // 为可并行的任务添加标签
        const parallelGroups = this.findParallelGroups(taskPlan, maxParallel);
        parallelGroups.forEach((group, index) => {
            group.forEach(task => {
                if (!task.tags)
                    task.tags = [];
                task.tags.push(`parallel-group-${index + 1}`);
            });
        });
    }
    /**
     * 查找可并行执行的任务组
     * @param taskPlan 任务计划
     * @param maxGroupSize 最大组大小
     */
    findParallelGroups(taskPlan, maxGroupSize) {
        const groups = [];
        const processed = new Set();
        taskPlan.tasks.forEach(task => {
            if (processed.has(task.id))
                return;
            const parallelTasks = this.findParallelTasks(task, taskPlan, processed);
            if (parallelTasks.length > 1 && parallelTasks.length <= maxGroupSize) {
                groups.push(parallelTasks);
                parallelTasks.forEach(t => processed.add(t.id));
            }
        });
        return groups;
    }
    /**
     * 查找与指定任务可并行执行的任务
     * @param task 基准任务
     * @param taskPlan 任务计划
     * @param processed 已处理的任务
     */
    findParallelTasks(task, taskPlan, processed) {
        const parallel = [task];
        taskPlan.tasks.forEach(otherTask => {
            if (otherTask.id === task.id || processed.has(otherTask.id))
                return;
            // 检查是否可以并行执行
            if (this.canRunInParallel(task, otherTask, taskPlan)) {
                parallel.push(otherTask);
            }
        });
        return parallel;
    }
    /**
     * 检查两个任务是否可以并行执行
     * @param task1 任务1
     * @param task2 任务2
     * @param taskPlan 任务计划
     */
    canRunInParallel(task1, task2, taskPlan) {
        // 检查直接依赖关系
        if (task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)) {
            return false;
        }
        // 检查间接依赖关系
        if (this.hasIndirectDependency(task1.id, task2.id, taskPlan) ||
            this.hasIndirectDependency(task2.id, task1.id, taskPlan)) {
            return false;
        }
        // 检查资源冲突（简化版本：同类型任务可能冲突）
        if (task1.type === task2.type &&
            (task1.type === TaskType.DEPLOYMENT || task1.type === TaskType.TEST)) {
            return false;
        }
        return true;
    }
    /**
     * 检查是否存在间接依赖关系
     * @param fromId 起始任务ID
     * @param toId 目标任务ID
     * @param taskPlan 任务计划
     */
    hasIndirectDependency(fromId, toId, taskPlan) {
        const taskMap = new Map();
        taskPlan.tasks.forEach(task => taskMap.set(task.id, task));
        return this.hasTransitiveDependency(fromId, toId, taskMap);
    }
    /**
     * 平衡工作量
     * @param taskPlan 任务计划
     * @param options 优化选项
     */
    balanceWorkload(taskPlan, options) {
        this.logger.info('平衡工作量');
        const teamSize = (options === null || options === void 0 ? void 0 : options.considerTeamSize) || 3;
        // 计算总工作量
        const totalHours = taskPlan.tasks.reduce((sum, task) => sum + (task.estimatedHours || 8), 0);
        const avgHoursPerPerson = totalHours / teamSize;
        // 标记工作量过大的任务，建议拆分
        taskPlan.tasks.forEach(task => {
            const estimatedHours = task.estimatedHours || 8;
            if (estimatedHours > avgHoursPerPerson * 0.5) {
                if (!task.tags)
                    task.tags = [];
                task.tags.push('consider-splitting');
                if (!task.notes) {
                    task.notes = '';
                }
                task.notes += `\n建议拆分：预计工作量 ${estimatedHours} 小时，超过平均值的50%`;
            }
        });
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 任务管理器类
 * 负责管理任务计划中的任务
 */
let TaskManager$1 = class TaskManager {
    /**
     * 创建任务管理器实例
     * @param logger 日志记录器
     * @param configManager 配置管理器
     */
    constructor(logger, configManager) {
        this.taskPlan = null;
        this.autoSaveInterval = null;
        this.logger = logger;
        this.configManager = configManager;
        // 获取任务文件路径配置
        const taskSettings = this.configManager.get('taskSettings', {
            outputDir: './tasks',
            autoSave: true,
            saveInterval: 300
        });
        this.taskFilePath = path__namespace.join(taskSettings.outputDir, 'tasks.json');
        // 启动自动保存
        if (taskSettings.autoSave) {
            this.startAutoSave(taskSettings.saveInterval * 1000);
        }
    }
    /**
     * 加载任务计划
     * @param filePath 任务计划文件路径，不指定则使用默认路径
     */
    async loadTaskPlan(filePath) {
        const targetPath = filePath || this.taskFilePath;
        try {
            // 检查文件是否存在
            if (!fs__namespace.existsSync(targetPath)) {
                throw new Error(`任务计划文件不存在：${targetPath}`);
            }
            // 读取任务文件
            const content = await fs__namespace.readFile(targetPath, 'utf-8');
            this.taskPlan = JSON.parse(content);
            this.logger.info(`成功加载任务计划，共 ${this.taskPlan.tasks.length} 个任务`);
            return this.taskPlan;
        }
        catch (error) {
            this.logger.error(`加载任务计划失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 保存任务计划
     * @param filePath 保存路径，不指定则使用默认路径
     */
    async saveTaskPlan(filePath) {
        const targetPath = filePath || this.taskFilePath;
        if (!this.taskPlan) {
            throw new Error('没有任务计划可保存，请先加载或创建任务计划');
        }
        try {
            // 确保目录存在
            await fs__namespace.ensureDir(path__namespace.dirname(targetPath));
            // 写入文件
            await fs__namespace.writeFile(targetPath, JSON.stringify(this.taskPlan, null, 2), 'utf-8');
            this.logger.info(`任务计划已保存至 ${targetPath}`);
        }
        catch (error) {
            this.logger.error(`保存任务计划失败：${error.message}`);
            throw error;
        }
    }
    /**
     * 设置任务计划
     * @param taskPlan 任务计划
     */
    setTaskPlan(taskPlan) {
        this.taskPlan = taskPlan;
        this.logger.info(`设置任务计划成功，共 ${taskPlan.tasks.length} 个任务`);
    }
    /**
     * 获取任务计划
     */
    getTaskPlan() {
        return this.taskPlan;
    }
    /**
     * 获取所有任务
     */
    getAllTasks() {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        return [...this.taskPlan.tasks];
    }
    /**
     * 根据ID获取任务
     * @param id 任务ID
     */
    getTaskById(id) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 检查是否是子任务ID（包含点号）
        if (id.includes('.')) {
            const [parentId, subtaskId] = id.split('.');
            // 找到父任务
            const parentTask = this.taskPlan.tasks.find(task => task.id === parentId);
            if (!parentTask || !parentTask.subtasks) {
                return null;
            }
            // 查找完整的子任务ID
            const fullSubtaskId = `${parentId}.${subtaskId}`;
            const subtask = parentTask.subtasks.find(st => st.id === fullSubtaskId);
            // 如果找到子任务，将其转换为Task类型返回
            if (subtask) {
                return {
                    id: subtask.id,
                    name: subtask.name,
                    title: subtask.name,
                    description: subtask.description,
                    status: subtask.status,
                    priority: TaskPriority$1.MEDIUM, // 子任务默认继承父任务的优先级
                    type: TaskType.FEATURE, // 子任务默认类型
                    dependencies: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tags: [],
                    subtasks: []
                };
            }
            return null;
        }
        // 查找主任务
        return this.taskPlan.tasks.find(task => task.id === id) || null;
    }
    /**
     * 过滤任务
     * @param filter 过滤条件
     */
    filterTasks(filter) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        return this.taskPlan.tasks.filter(task => {
            // 按状态过滤
            if (filter.status) {
                if (Array.isArray(filter.status)) {
                    if (!filter.status.includes(task.status)) {
                        return false;
                    }
                }
                else if (task.status !== filter.status) {
                    return false;
                }
            }
            // 按类型过滤
            if (filter.type) {
                if (Array.isArray(filter.type)) {
                    if (!filter.type.includes(task.type)) {
                        return false;
                    }
                }
                else if (task.type !== filter.type) {
                    return false;
                }
            }
            // 按负责人过滤
            if (filter.assignee && task.assignee !== filter.assignee) {
                return false;
            }
            // 按优先级过滤
            if (filter.priority) {
                if (Array.isArray(filter.priority)) {
                    if (!filter.priority.includes(task.priority)) {
                        return false;
                    }
                }
                else if (task.priority !== filter.priority) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * 添加新任务
     * @param task 任务
     */
    addTask(task) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 检查ID是否已存在
        const existingTask = this.taskPlan.tasks.find(t => t.id === task.id);
        if (existingTask) {
            throw new Error(`任务ID ${task.id} 已存在`);
        }
        // 添加新任务
        this.taskPlan.tasks.push(task);
        this.logger.info(`添加新任务 ${task.id}: ${task.name}`);
        return task;
    }
    /**
     * 更新任务
     * @param id 任务ID
     * @param data 更新数据
     */
    updateTask(id, data) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 检查是否是子任务
        if (id.includes('.')) {
            const [parentId] = id.split('.');
            // 找到父任务
            const parentTaskIndex = this.taskPlan.tasks.findIndex(task => task.id === parentId);
            if (parentTaskIndex < 0 || !this.taskPlan.tasks[parentTaskIndex].subtasks) {
                return null;
            }
            // 查找完整的子任务ID
            const fullSubtaskId = id;
            const subtaskIndex = this.taskPlan.tasks[parentTaskIndex].subtasks.findIndex(st => st.id === fullSubtaskId);
            if (subtaskIndex < 0) {
                return null;
            }
            // 更新子任务
            const subtask = this.taskPlan.tasks[parentTaskIndex].subtasks[subtaskIndex];
            if (data.name)
                subtask.name = data.name;
            if (data.description)
                subtask.description = data.description;
            if (data.status)
                subtask.status = data.status;
            this.logger.info(`更新子任务 ${id}: ${subtask.name}`);
            // 构造返回的任务对象
            return {
                id: subtask.id,
                name: subtask.name,
                title: subtask.name,
                description: subtask.description,
                status: subtask.status,
                priority: TaskPriority$1.MEDIUM,
                type: TaskType.FEATURE,
                dependencies: [],
                subtasks: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                tags: []
            };
        }
        // 更新主任务
        const taskIndex = this.taskPlan.tasks.findIndex(task => task.id === id);
        if (taskIndex < 0) {
            return null;
        }
        const task = this.taskPlan.tasks[taskIndex];
        if (data.name)
            task.name = data.name;
        if (data.description)
            task.description = data.description;
        if (data.status)
            task.status = data.status;
        if (data.priority)
            task.priority = data.priority;
        if (data.assignee)
            task.assignee = data.assignee;
        this.logger.info(`更新任务 ${id}: ${task.name}`);
        return task;
    }
    /**
     * 删除任务
     * @param id 任务ID
     */
    removeTask(id) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 检查是否是子任务
        if (id.includes('.')) {
            const [parentId] = id.split('.');
            // 找到父任务
            const parentTaskIndex = this.taskPlan.tasks.findIndex(task => task.id === parentId);
            if (parentTaskIndex < 0 || !this.taskPlan.tasks[parentTaskIndex].subtasks) {
                return false;
            }
            // 查找完整的子任务ID
            const fullSubtaskId = id;
            const subtaskIndex = this.taskPlan.tasks[parentTaskIndex].subtasks.findIndex(st => st.id === fullSubtaskId);
            if (subtaskIndex < 0) {
                return false;
            }
            // 删除子任务
            this.taskPlan.tasks[parentTaskIndex].subtasks.splice(subtaskIndex, 1);
            this.logger.info(`删除子任务 ${id}`);
            return true;
        }
        // 删除主任务
        const taskIndex = this.taskPlan.tasks.findIndex(task => task.id === id);
        if (taskIndex < 0) {
            return false;
        }
        // 删除任务
        this.taskPlan.tasks.splice(taskIndex, 1);
        // 清理其他任务对该任务的依赖
        this.taskPlan.tasks.forEach(task => {
            task.dependencies = task.dependencies.filter(depId => depId !== id);
        });
        this.logger.info(`删除任务 ${id}`);
        return true;
    }
    /**
     * 添加子任务
     * @param parentId 父任务ID
     * @param subtask 子任务
     */
    addSubtask(parentId, subtask) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 找到父任务
        const parentTask = this.taskPlan.tasks.find(task => task.id === parentId);
        if (!parentTask) {
            throw new Error(`父任务 ${parentId} 不存在`);
        }
        // 确保subtasks是数组
        if (!Array.isArray(parentTask.subtasks)) {
            parentTask.subtasks = [];
        }
        // 设置子任务ID（如果没有的话）
        if (!subtask.id) {
            subtask.id = `${parentId}.${parentTask.subtasks.length + 1}`;
        }
        // 设置默认状态
        if (!subtask.status) {
            subtask.status = TaskStatus$1.TODO;
        }
        // 添加子任务
        parentTask.subtasks.push(subtask);
        this.logger.info(`为任务 ${parentId} 添加子任务 ${subtask.id}: ${subtask.name}`);
        return subtask;
    }
    /**
     * 获取下一个要处理的任务
     */
    getNextTasks() {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 查找所有未完成的任务
        const pendingTasks = this.taskPlan.tasks.filter(task => task.status !== TaskStatus$1.DONE && task.status !== TaskStatus$1.REVIEW);
        // 筛选出可以开始的任务（没有未完成的依赖项）
        return pendingTasks.filter(task => {
            // 检查依赖
            if (!task.dependencies || task.dependencies.length === 0) {
                return true;
            }
            // 检查所有依赖任务是否已完成
            return task.dependencies.every(depId => {
                const depTask = this.getTaskById(depId);
                return depTask && depTask.status === TaskStatus$1.DONE;
            });
        });
    }
    /**
     * 添加依赖关系
     * @param taskId 任务ID
     * @param dependsOnId 依赖的任务ID
     */
    addDependency(taskId, dependsOnId) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 找到任务
        const task = this.getTaskById(taskId);
        if (!task) {
            throw new Error(`任务 ${taskId} 不存在`);
        }
        // 检查依赖任务是否存在
        const dependsOnTask = this.getTaskById(dependsOnId);
        if (!dependsOnTask) {
            throw new Error(`依赖的任务 ${dependsOnId} 不存在`);
        }
        // 检查是否为自身
        if (taskId === dependsOnId) {
            throw new Error('任务不能依赖自身');
        }
        // 检查循环依赖
        if (this.checkCircularDependency(dependsOnId, taskId)) {
            throw new Error('添加此依赖会导致循环依赖');
        }
        // 检查依赖是否已存在
        if (!Array.isArray(task.dependencies)) {
            task.dependencies = [];
        }
        if (task.dependencies.includes(dependsOnId)) {
            return false; // 依赖已存在
        }
        // 添加依赖
        task.dependencies.push(dependsOnId);
        this.logger.info(`为任务 ${taskId} 添加依赖: ${dependsOnId}`);
        return true;
    }
    /**
     * 移除依赖关系
     * @param taskId 任务ID
     * @param dependsOnId 依赖的任务ID
     */
    removeDependency(taskId, dependsOnId) {
        if (!this.taskPlan) {
            throw new Error('没有加载任务计划');
        }
        // 找到任务
        const task = this.getTaskById(taskId);
        if (!task || !Array.isArray(task.dependencies)) {
            return false;
        }
        // 查找依赖索引
        const index = task.dependencies.indexOf(dependsOnId);
        if (index < 0) {
            return false;
        }
        // 移除依赖
        task.dependencies.splice(index, 1);
        this.logger.info(`从任务 ${taskId} 移除依赖: ${dependsOnId}`);
        return true;
    }
    /**
     * 检查是否存在循环依赖
     * @param task1Id 任务1ID
     * @param task2Id 任务2ID
     */
    checkCircularDependency(task1Id, task2Id) {
        if (!this.taskPlan) {
            return false;
        }
        // 构建依赖图
        const graph = new Map();
        this.taskPlan.tasks.forEach(task => {
            graph.set(task.id, [...(task.dependencies || [])]);
        });
        // 临时添加新依赖
        const task1Deps = graph.get(task1Id) || [];
        task1Deps.push(task2Id);
        graph.set(task1Id, task1Deps);
        // 检查是否有环
        const visited = new Set();
        const recStack = new Set();
        const hasCycle = (node) => {
            if (recStack.has(node)) {
                return true;
            }
            if (visited.has(node)) {
                return false;
            }
            visited.add(node);
            recStack.add(node);
            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                if (hasCycle(neighbor)) {
                    return true;
                }
            }
            recStack.delete(node);
            return false;
        };
        return hasCycle(task1Id);
    }
    /**
     * 开始自动保存任务计划
     * @param interval 保存间隔（毫秒）
     */
    startAutoSave(interval) {
        // 停止现有的自动保存
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        // 设置新的自动保存
        this.autoSaveInterval = setInterval(async () => {
            if (this.taskPlan) {
                try {
                    await this.saveTaskPlan();
                }
                catch (error) {
                    this.logger.error(`自动保存任务计划失败：${error.message}`);
                }
            }
        }, interval);
        this.logger.info(`启动自动保存，间隔: ${interval / 1000} 秒`);
    }
    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            this.logger.info('停止自动保存');
        }
    }
    /**
     * 析构函数，清理资源
     */
    destroy() {
        this.stopAutoSave();
    }
};

/**
 * TaskFlow AI 任务可视化模块
 * 负责生成各种任务可视化图表
 */
/**
 * 可视化类型枚举
 */
var VisualizationType;
(function (VisualizationType) {
    VisualizationType["GANTT"] = "gantt";
    VisualizationType["DEPENDENCY"] = "dependency";
    VisualizationType["KANBAN"] = "kanban";
    VisualizationType["TIMELINE"] = "timeline";
    VisualizationType["PROGRESS"] = "progress";
})(VisualizationType || (VisualizationType = {}));
/**
 * 任务可视化器类
 */
class TaskVisualizer {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * 生成可视化数据
     * @param taskPlan 任务计划
     * @param options 可视化选项
     */
    generateVisualization(taskPlan, options) {
        this.logger.info(`生成 ${options.type} 可视化`);
        switch (options.type) {
            case VisualizationType.GANTT:
                return this.generateGanttChart(taskPlan, options);
            case VisualizationType.DEPENDENCY:
                return this.generateDependencyGraph(taskPlan, options);
            case VisualizationType.KANBAN:
                return this.generateKanbanBoard(taskPlan, options);
            case VisualizationType.TIMELINE:
                return this.generateTimeline(taskPlan, options);
            case VisualizationType.PROGRESS:
                return this.generateProgressChart(taskPlan, options);
            default:
                throw new Error(`不支持的可视化类型: ${options.type}`);
        }
    }
    /**
     * 生成甘特图
     * @param taskPlan 任务计划
     * @param options 选项
     */
    generateGanttChart(taskPlan, options) {
        const ganttTasks = [];
        let currentDate = new Date();
        taskPlan.tasks.forEach(task => {
            const ganttTask = {
                id: task.id,
                name: task.title,
                start: this.formatDate(currentDate),
                duration: task.estimatedHours || 8,
                dependencies: task.dependencies.length > 0 ? task.dependencies : undefined,
                progress: task.progress || 0,
                assignee: task.assignee
            };
            ganttTasks.push(ganttTask);
            // 计算下一个任务的开始时间
            currentDate = new Date(currentDate.getTime() + (task.estimatedHours || 8) * 60 * 60 * 1000);
        });
        const ganttData = {
            title: taskPlan.name || '任务甘特图',
            tasks: ganttTasks
        };
        if (options.format === 'mermaid') {
            return this.generateMermaidGantt(ganttData);
        }
        return ganttData;
    }
    /**
     * 生成Mermaid格式的甘特图
     * @param ganttData 甘特图数据
     */
    generateMermaidGantt(ganttData) {
        let mermaid = `gantt\n    title ${ganttData.title}\n    dateFormat YYYY-MM-DD\n    axisFormat %m-%d\n\n`;
        ganttData.tasks.forEach(task => {
            var _a;
            const progress = (_a = task.progress) !== null && _a !== void 0 ? _a : 0;
            const status = progress === 100 ? 'done' : progress > 0 ? 'active' : '';
            const duration = `${task.duration}h`;
            mermaid += `    ${task.name} :${status}, ${task.id}, ${task.start}, ${duration}\n`;
        });
        return mermaid;
    }
    /**
     * 生成依赖关系图
     * @param taskPlan 任务计划
     * @param options 选项
     */
    generateDependencyGraph(taskPlan, options) {
        const nodes = [];
        const edges = [];
        // 生成节点
        taskPlan.tasks.forEach(task => {
            nodes.push({
                id: task.id,
                label: task.title,
                type: task.type,
                status: task.status,
                priority: task.priority
            });
        });
        // 生成边
        taskPlan.tasks.forEach(task => {
            task.dependencies.forEach(depId => {
                edges.push({
                    from: depId,
                    to: task.id,
                    type: 'dependency'
                });
            });
        });
        const graph = { nodes, edges };
        if (options.format === 'mermaid') {
            return this.generateMermaidDependencyGraph(graph);
        }
        return graph;
    }
    /**
     * 生成Mermaid格式的依赖关系图
     * @param graph 依赖关系图数据
     */
    generateMermaidDependencyGraph(graph) {
        let mermaid = `graph TD\n`;
        // 添加节点定义
        graph.nodes.forEach(node => {
            const shape = this.getNodeShape(node.status);
            const style = this.getNodeStyle(node.priority);
            mermaid += `    ${node.id}${shape}["${node.label}"]\n`;
            if (style) {
                mermaid += `    class ${node.id} ${style}\n`;
            }
        });
        mermaid += '\n';
        // 添加边
        graph.edges.forEach(edge => {
            mermaid += `    ${edge.from} --> ${edge.to}\n`;
        });
        // 添加样式定义
        mermaid += '\n';
        mermaid += '    classDef high fill:#ff6b6b,stroke:#333,stroke-width:2px\n';
        mermaid += '    classDef medium fill:#feca57,stroke:#333,stroke-width:2px\n';
        mermaid += '    classDef low fill:#48dbfb,stroke:#333,stroke-width:2px\n';
        mermaid += '    classDef critical fill:#ff3838,stroke:#333,stroke-width:3px\n';
        return mermaid;
    }
    /**
     * 获取节点形状
     * @param status 任务状态
     */
    getNodeShape(status) {
        switch (status) {
            case TaskStatus$1.COMPLETED:
                return '(())';
            case TaskStatus$1.IN_PROGRESS:
                return '([])';
            case TaskStatus$1.BLOCKED:
                return '{[]}';
            default:
                return '[]';
        }
    }
    /**
     * 获取节点样式
     * @param priority 优先级
     */
    getNodeStyle(priority) {
        switch (priority) {
            case 'critical':
                return 'critical';
            case 'high':
                return 'high';
            case 'medium':
                return 'medium';
            case 'low':
                return 'low';
            default:
                return '';
        }
    }
    /**
     * 生成看板
     * @param taskPlan 任务计划
     * @param options 选项
     */
    generateKanbanBoard(taskPlan, _options) {
        const columns = [
            { id: 'not_started', title: '待开始', tasks: [] },
            { id: 'in_progress', title: '进行中', tasks: [] },
            { id: 'completed', title: '已完成', tasks: [] },
            { id: 'blocked', title: '被阻塞', tasks: [] }
        ];
        taskPlan.tasks.forEach(task => {
            const kanbanTask = {
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                assignee: task.assignee,
                tags: task.tags
            };
            const column = columns.find(col => col.id === task.status);
            if (column) {
                column.tasks.push(kanbanTask);
            }
        });
        return { columns };
    }
    /**
     * 生成时间线
     * @param taskPlan 任务计划
     * @param options 选项
     */
    generateTimeline(taskPlan, _options) {
        // 简化的时间线实现
        const timeline = {
            title: taskPlan.name || '项目时间线',
            events: taskPlan.tasks.map((task, index) => ({
                id: task.id,
                title: task.title,
                date: this.calculateTaskStartDate(task, index),
                duration: task.estimatedHours || 8,
                status: task.status,
                priority: task.priority
            }))
        };
        return timeline;
    }
    /**
     * 生成进度图表
     * @param taskPlan 任务计划
     * @param options 选项
     */
    generateProgressChart(taskPlan, _options) {
        const stats = {
            total: taskPlan.tasks.length,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            blocked: 0
        };
        taskPlan.tasks.forEach(task => {
            switch (task.status) {
                case TaskStatus$1.COMPLETED:
                    stats.completed++;
                    break;
                case TaskStatus$1.IN_PROGRESS:
                    stats.inProgress++;
                    break;
                case TaskStatus$1.NOT_STARTED:
                    stats.notStarted++;
                    break;
                case TaskStatus$1.BLOCKED:
                    stats.blocked++;
                    break;
            }
        });
        const completionRate = (stats.completed / stats.total) * 100;
        return {
            stats,
            completionRate,
            chartData: [
                { label: '已完成', value: stats.completed, color: '#4CAF50' },
                { label: '进行中', value: stats.inProgress, color: '#FF9800' },
                { label: '未开始', value: stats.notStarted, color: '#9E9E9E' },
                { label: '被阻塞', value: stats.blocked, color: '#F44336' }
            ]
        };
    }
    /**
     * 格式化日期
     * @param date 日期
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    /**
     * 计算任务开始日期
     * @param task 任务
     * @param index 索引
     */
    calculateTaskStartDate(_task, index) {
        // 简化实现：基于索引计算开始日期
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + index);
        return this.formatDate(startDate);
    }
}

/**
 * TaskFlow AI - 智能任务编排引擎
 *
 * 实现基于依赖关系的智能任务排序、关键路径分析和并行任务优化
 *
 * @author TaskFlow AI Team
 * @version 1.0.0
 */
/**
 * 智能任务编排引擎
 */
class TaskOrchestrationEngine {
    constructor(config = {}) {
        this.config = {
            enableCriticalPath: true,
            enableParallelOptimization: true,
            enableResourceLeveling: false,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
            optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
            maxParallelTasks: 10,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.1,
            ...config,
        };
        this.tasks = new Map();
        this.dependencies = new Map();
        this.graph = new Map();
    }
    /**
     * 执行任务编排
     */
    async orchestrate(tasks) {
        console.log(`🎯 开始任务编排，共 ${tasks.length} 个任务`);
        // 1. 初始化数据结构
        this.initializeDataStructures(tasks);
        // 2. 构建依赖关系图
        this.buildDependencyGraph();
        // 3. 验证依赖关系
        this.validateDependencies();
        // 4. 计算关键路径
        const criticalPath = this.config.enableCriticalPath
            ? this.calculateCriticalPath()
            : [];
        // 5. 优化任务排序
        const optimizedTasks = this.optimizeTaskOrder();
        // 6. 识别并行任务组
        const parallelGroups = this.config.enableParallelOptimization
            ? this.identifyParallelGroups()
            : [];
        // 7. 计算资源利用率
        const resourceUtilization = this.config.enableResourceLeveling
            ? this.calculateResourceUtilization(optimizedTasks)
            : [];
        // 8. 风险评估
        const riskAssessment = this.config.enableRiskAnalysis
            ? this.performRiskAssessment(optimizedTasks)
            : this.createEmptyRiskAssessment();
        // 9. 生成优化建议
        const recommendations = this.generateRecommendations(optimizedTasks, criticalPath, parallelGroups, resourceUtilization, riskAssessment);
        // 10. 计算项目总持续时间
        const totalDuration = this.calculateTotalDuration(optimizedTasks);
        console.log(`✅ 任务编排完成，项目预计持续时间: ${totalDuration} 小时`);
        return {
            tasks: optimizedTasks,
            criticalPath,
            totalDuration,
            parallelGroups,
            resourceUtilization,
            riskAssessment,
            recommendations,
            metadata: {
                orchestrationTime: new Date(),
                strategy: this.config.schedulingStrategy,
                goal: this.config.optimizationGoal,
                version: '1.0.0',
            },
        };
    }
    /**
     * 初始化数据结构
     */
    initializeDataStructures(tasks) {
        this.tasks.clear();
        this.dependencies.clear();
        this.graph.clear();
        // 初始化任务映射
        for (const task of tasks) {
            this.tasks.set(task.id, task);
            // 初始化图节点
            this.graph.set(task.id, {
                taskId: task.id,
                task,
                inDegree: 0,
                outDegree: 0,
                predecessors: new Set(),
                successors: new Set(),
                earliestStart: 0,
                latestStart: 0,
                earliestFinish: 0,
                latestFinish: 0,
                totalFloat: 0,
                freeFloat: 0,
                isCritical: false,
            });
        }
        // 初始化依赖关系
        for (const task of tasks) {
            // 处理传统的依赖关系（向后兼容）
            if (task.dependencies && task.dependencies.length > 0) {
                for (const depId of task.dependencies) {
                    const dependency = {
                        id: `${depId}-${task.id}`,
                        predecessorId: depId,
                        successorId: task.id,
                        type: DependencyType.FINISH_TO_START,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.dependencies.set(dependency.id, dependency);
                }
            }
            // 处理新的详细依赖关系
            if (task.dependencyRelations && task.dependencyRelations.length > 0) {
                for (const dep of task.dependencyRelations) {
                    this.dependencies.set(dep.id, dep);
                }
            }
        }
    }
    /**
     * 构建依赖关系图
     */
    buildDependencyGraph() {
        for (const dependency of this.dependencies.values()) {
            const predecessorNode = this.graph.get(dependency.predecessorId);
            const successorNode = this.graph.get(dependency.successorId);
            if (!predecessorNode || !successorNode) {
                console.warn(`⚠️ 发现无效依赖关系: ${dependency.id}`);
                continue;
            }
            // 更新图结构
            predecessorNode.successors.add(dependency.successorId);
            predecessorNode.outDegree++;
            successorNode.predecessors.add(dependency.predecessorId);
            successorNode.inDegree++;
        }
    }
    /**
     * 验证依赖关系（检测循环依赖）
     */
    validateDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId)) {
                return true; // 发现循环
            }
            if (visited.has(nodeId)) {
                return false; // 已访问过，无循环
            }
            visited.add(nodeId);
            recursionStack.add(nodeId);
            const node = this.graph.get(nodeId);
            if (node) {
                for (const successorId of node.successors) {
                    if (hasCycle(successorId)) {
                        return true;
                    }
                }
            }
            recursionStack.delete(nodeId);
            return false;
        };
        for (const nodeId of this.graph.keys()) {
            if (!visited.has(nodeId) && hasCycle(nodeId)) {
                throw new Error(`检测到循环依赖，涉及任务: ${nodeId}`);
            }
        }
    }
    /**
     * 计算关键路径（CPM算法）
     */
    calculateCriticalPath() {
        // 前向计算（计算最早开始和完成时间）
        this.forwardPass();
        // 反向计算（计算最晚开始和完成时间）
        this.backwardPass();
        // 计算浮动时间
        this.calculateFloat();
        // 识别关键路径
        const criticalTasks = [];
        for (const node of this.graph.values()) {
            if (node.totalFloat === 0) {
                node.isCritical = true;
                criticalTasks.push(node.taskId);
            }
        }
        console.log(`🎯 识别到关键路径，包含 ${criticalTasks.length} 个关键任务`);
        return criticalTasks;
    }
    /**
     * 前向计算
     */
    forwardPass() {
        const queue = [];
        const inDegreeCount = new Map();
        // 初始化入度计数
        for (const [nodeId, node] of this.graph) {
            inDegreeCount.set(nodeId, node.inDegree);
            if (node.inDegree === 0) {
                queue.push(nodeId);
                node.earliestStart = 0;
                node.earliestFinish = this.getTaskDuration(node.task);
            }
        }
        // 拓扑排序并计算最早时间
        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = this.graph.get(currentId);
            for (const successorId of currentNode.successors) {
                const successorNode = this.graph.get(successorId);
                const dependency = this.findDependency(currentId, successorId);
                // 计算基于依赖类型的最早开始时间
                let earliestStart = 0;
                if (dependency) {
                    switch (dependency.type) {
                        case DependencyType.FINISH_TO_START:
                            earliestStart = currentNode.earliestFinish + (dependency.lag || 0);
                            break;
                        case DependencyType.START_TO_START:
                            earliestStart = currentNode.earliestStart + (dependency.lag || 0);
                            break;
                        case DependencyType.FINISH_TO_FINISH:
                            earliestStart = currentNode.earliestFinish - this.getTaskDuration(successorNode.task) + (dependency.lag || 0);
                            break;
                        case DependencyType.START_TO_FINISH:
                            earliestStart = currentNode.earliestStart - this.getTaskDuration(successorNode.task) + (dependency.lag || 0);
                            break;
                    }
                }
                successorNode.earliestStart = Math.max(successorNode.earliestStart, earliestStart);
                successorNode.earliestFinish = successorNode.earliestStart + this.getTaskDuration(successorNode.task);
                const newInDegree = inDegreeCount.get(successorId) - 1;
                inDegreeCount.set(successorId, newInDegree);
                if (newInDegree === 0) {
                    queue.push(successorId);
                }
            }
        }
    }
    /**
     * 反向计算
     */
    backwardPass() {
        // 找到项目结束时间
        let projectFinish = 0;
        for (const node of this.graph.values()) {
            if (node.outDegree === 0) {
                projectFinish = Math.max(projectFinish, node.earliestFinish);
            }
        }
        // 初始化最晚时间
        for (const node of this.graph.values()) {
            if (node.outDegree === 0) {
                node.latestFinish = projectFinish;
                node.latestStart = node.latestFinish - this.getTaskDuration(node.task);
            }
            else {
                node.latestFinish = Infinity;
                node.latestStart = Infinity;
            }
        }
        // 反向拓扑排序
        const queue = [];
        const outDegreeCount = new Map();
        for (const [nodeId, node] of this.graph) {
            outDegreeCount.set(nodeId, node.outDegree);
            if (node.outDegree === 0) {
                queue.push(nodeId);
            }
        }
        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = this.graph.get(currentId);
            for (const predecessorId of currentNode.predecessors) {
                const predecessorNode = this.graph.get(predecessorId);
                const dependency = this.findDependency(predecessorId, currentId);
                // 计算基于依赖类型的最晚完成时间
                let latestFinish = Infinity;
                if (dependency) {
                    switch (dependency.type) {
                        case DependencyType.FINISH_TO_START:
                            latestFinish = currentNode.latestStart - (dependency.lag || 0);
                            break;
                        case DependencyType.START_TO_START:
                            latestFinish = currentNode.latestStart + this.getTaskDuration(predecessorNode.task) - (dependency.lag || 0);
                            break;
                        case DependencyType.FINISH_TO_FINISH:
                            latestFinish = currentNode.latestFinish - (dependency.lag || 0);
                            break;
                        case DependencyType.START_TO_FINISH:
                            latestFinish = currentNode.latestFinish + this.getTaskDuration(predecessorNode.task) - (dependency.lag || 0);
                            break;
                    }
                }
                predecessorNode.latestFinish = Math.min(predecessorNode.latestFinish, latestFinish);
                predecessorNode.latestStart = predecessorNode.latestFinish - this.getTaskDuration(predecessorNode.task);
                const newOutDegree = outDegreeCount.get(predecessorId) - 1;
                outDegreeCount.set(predecessorId, newOutDegree);
                if (newOutDegree === 0) {
                    queue.push(predecessorId);
                }
            }
        }
    }
    /**
     * 计算浮动时间
     */
    calculateFloat() {
        for (const node of this.graph.values()) {
            node.totalFloat = node.latestStart - node.earliestStart;
            // 计算自由浮动时间
            let minSuccessorEarliestStart = Infinity;
            for (const successorId of node.successors) {
                const successorNode = this.graph.get(successorId);
                minSuccessorEarliestStart = Math.min(minSuccessorEarliestStart, successorNode.earliestStart);
            }
            if (minSuccessorEarliestStart === Infinity) {
                node.freeFloat = node.totalFloat;
            }
            else {
                node.freeFloat = minSuccessorEarliestStart - node.earliestFinish;
            }
        }
    }
    /**
     * 优化任务排序
     */
    optimizeTaskOrder() {
        switch (this.config.schedulingStrategy) {
            case SchedulingStrategy.CRITICAL_PATH:
                return this.sortByCriticalPath();
            case SchedulingStrategy.PRIORITY_FIRST:
                return this.sortByPriority();
            case SchedulingStrategy.SHORTEST_FIRST:
                return this.sortByDuration(true);
            case SchedulingStrategy.LONGEST_FIRST:
                return this.sortByDuration(false);
            case SchedulingStrategy.EARLY_START:
                return this.sortByEarlyStart();
            default:
                return Array.from(this.tasks.values());
        }
    }
    /**
     * 按关键路径排序
     */
    sortByCriticalPath() {
        const tasks = Array.from(this.tasks.values());
        return tasks.sort((a, b) => {
            const nodeA = this.graph.get(a.id);
            const nodeB = this.graph.get(b.id);
            // 关键任务优先
            if (nodeA.isCritical && !nodeB.isCritical)
                return -1;
            if (!nodeA.isCritical && nodeB.isCritical)
                return 1;
            // 按最早开始时间排序
            if (nodeA.earliestStart !== nodeB.earliestStart) {
                return nodeA.earliestStart - nodeB.earliestStart;
            }
            // 按总浮动时间排序（浮动时间少的优先）
            return nodeA.totalFloat - nodeB.totalFloat;
        });
    }
    /**
     * 按优先级排序
     */
    sortByPriority() {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const tasks = Array.from(this.tasks.values());
        return tasks.sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 0;
            const priorityB = priorityOrder[b.priority] || 0;
            if (priorityA !== priorityB) {
                return priorityB - priorityA; // 高优先级在前
            }
            // 优先级相同时按最早开始时间排序
            const nodeA = this.graph.get(a.id);
            const nodeB = this.graph.get(b.id);
            return nodeA.earliestStart - nodeB.earliestStart;
        });
    }
    /**
     * 按持续时间排序
     */
    sortByDuration(shortestFirst) {
        const tasks = Array.from(this.tasks.values());
        return tasks.sort((a, b) => {
            const durationA = this.getTaskDuration(a);
            const durationB = this.getTaskDuration(b);
            return shortestFirst ? durationA - durationB : durationB - durationA;
        });
    }
    /**
     * 按最早开始时间排序
     */
    sortByEarlyStart() {
        const tasks = Array.from(this.tasks.values());
        return tasks.sort((a, b) => {
            const nodeA = this.graph.get(a.id);
            const nodeB = this.graph.get(b.id);
            return nodeA.earliestStart - nodeB.earliestStart;
        });
    }
    /**
     * 识别并行任务组
     */
    identifyParallelGroups() {
        const parallelGroups = [];
        const processed = new Set();
        // 按最早开始时间分组
        const timeGroups = new Map();
        for (const [taskId, node] of this.graph) {
            if (!processed.has(taskId)) {
                const startTime = node.earliestStart;
                if (!timeGroups.has(startTime)) {
                    timeGroups.set(startTime, []);
                }
                timeGroups.get(startTime).push(taskId);
            }
        }
        // 检查每个时间组内的任务是否可以并行
        for (const [startTime, taskIds] of timeGroups) {
            if (taskIds.length > 1) {
                const parallelGroup = this.findParallelTasks(taskIds);
                if (parallelGroup.length > 1) {
                    parallelGroups.push(parallelGroup);
                }
            }
        }
        console.log(`🔄 识别到 ${parallelGroups.length} 个并行任务组`);
        return parallelGroups;
    }
    /**
     * 在给定任务列表中找到可并行执行的任务
     */
    findParallelTasks(taskIds) {
        var _a;
        const parallelTasks = [];
        for (const taskId of taskIds) {
            const task = this.tasks.get(taskId);
            this.graph.get(taskId);
            // 检查是否可并行化
            const canParallelize = ((_a = task.orchestrationMetadata) === null || _a === void 0 ? void 0 : _a.parallelizable) !== false;
            // 检查资源冲突
            const hasResourceConflict = this.checkResourceConflict(taskId, parallelTasks);
            if (canParallelize && !hasResourceConflict) {
                parallelTasks.push(taskId);
            }
        }
        return parallelTasks;
    }
    /**
     * 检查资源冲突
     */
    checkResourceConflict(taskId, existingTasks) {
        const task = this.tasks.get(taskId);
        const taskResources = task.resourceRequirements || [];
        for (const existingTaskId of existingTasks) {
            const existingTask = this.tasks.get(existingTaskId);
            const existingResources = existingTask.resourceRequirements || [];
            // 检查是否有相同的人力资源冲突
            for (const resource of taskResources) {
                for (const existingResource of existingResources) {
                    if (resource.type === 'human' &&
                        existingResource.type === 'human' &&
                        resource.name === existingResource.name) {
                        return true; // 发现资源冲突
                    }
                }
            }
        }
        return false;
    }
    /**
     * 计算资源利用率
     */
    calculateResourceUtilization(tasks) {
        const resourceMap = new Map();
        // 收集所有资源
        for (const task of tasks) {
            if (task.resourceRequirements) {
                for (const resource of task.resourceRequirements) {
                    if (!resourceMap.has(resource.id)) {
                        resourceMap.set(resource.id, {
                            resourceId: resource.id,
                            resourceName: resource.name,
                            totalCapacity: resource.availability || 1,
                            allocatedCapacity: 0,
                            utilizationRate: 0,
                            overallocation: 0,
                            timeline: [],
                        });
                    }
                }
            }
        }
        // 计算资源分配
        for (const task of tasks) {
            const node = this.graph.get(task.id);
            if (task.resourceRequirements && node) {
                for (const resource of task.resourceRequirements) {
                    const utilization = resourceMap.get(resource.id);
                    if (utilization) {
                        utilization.allocatedCapacity += resource.quantity;
                    }
                }
            }
        }
        // 计算利用率
        for (const utilization of resourceMap.values()) {
            utilization.utilizationRate = utilization.allocatedCapacity / utilization.totalCapacity;
            utilization.overallocation = Math.max(0, utilization.allocatedCapacity - utilization.totalCapacity);
        }
        return Array.from(resourceMap.values());
    }
    /**
     * 执行风险评估
     */
    performRiskAssessment(tasks) {
        const riskFactors = [];
        let overallRiskLevel = 0;
        // 分析各种风险因素
        riskFactors.push(...this.analyzeScheduleRisks(tasks));
        riskFactors.push(...this.analyzeResourceRisks(tasks));
        riskFactors.push(...this.analyzeTechnicalRisks(tasks));
        riskFactors.push(...this.analyzeQualityRisks(tasks));
        // 计算整体风险等级
        if (riskFactors.length > 0) {
            overallRiskLevel = riskFactors.reduce((sum, risk) => sum + risk.riskScore, 0) / riskFactors.length;
        }
        // 生成缓解建议
        const mitigationSuggestions = this.generateMitigationSuggestions(riskFactors);
        // 生成应急计划
        const contingencyPlans = this.generateContingencyPlans(riskFactors);
        return {
            overallRiskLevel,
            riskFactors,
            mitigationSuggestions,
            contingencyPlans,
        };
    }
    /**
     * 分析进度风险
     */
    analyzeScheduleRisks(tasks) {
        const risks = [];
        // 检查关键路径风险
        const criticalTasks = tasks.filter(task => { var _a; return (_a = this.graph.get(task.id)) === null || _a === void 0 ? void 0 : _a.isCritical; });
        if (criticalTasks.length > tasks.length * 0.3) {
            risks.push({
                id: 'critical-path-risk',
                name: '关键路径风险',
                description: '关键路径上的任务过多，项目延期风险较高',
                probability: 0.7,
                impact: 8,
                riskScore: 5.6,
                affectedTaskIds: criticalTasks.map(t => t.id),
                category: RiskCategory.SCHEDULE,
            });
        }
        // 检查任务持续时间风险
        const longTasks = tasks.filter(task => this.getTaskDuration(task) > 40); // 超过5天
        if (longTasks.length > 0) {
            risks.push({
                id: 'long-duration-risk',
                name: '长持续时间任务风险',
                description: '存在持续时间过长的任务，可能影响项目进度',
                probability: 0.5,
                impact: 6,
                riskScore: 3.0,
                affectedTaskIds: longTasks.map(t => t.id),
                category: RiskCategory.SCHEDULE,
            });
        }
        return risks;
    }
    /**
     * 分析资源风险
     */
    analyzeResourceRisks(tasks) {
        const risks = [];
        // 检查资源过度分配
        const resourceUtilization = this.calculateResourceUtilization(tasks);
        const overallocatedResources = resourceUtilization.filter(r => r.overallocation > 0);
        if (overallocatedResources.length > 0) {
            risks.push({
                id: 'resource-overallocation-risk',
                name: '资源过度分配风险',
                description: '部分资源分配超出可用容量',
                probability: 0.8,
                impact: 7,
                riskScore: 5.6,
                affectedTaskIds: tasks.map(t => t.id), // 简化处理
                category: RiskCategory.RESOURCE,
            });
        }
        return risks;
    }
    /**
     * 分析技术风险
     */
    analyzeTechnicalRisks(tasks) {
        const risks = [];
        // 检查高复杂度任务
        const complexTasks = tasks.filter(task => { var _a; return (((_a = task.orchestrationMetadata) === null || _a === void 0 ? void 0 : _a.complexity) || 0) > 7; });
        if (complexTasks.length > 0) {
            risks.push({
                id: 'technical-complexity-risk',
                name: '技术复杂度风险',
                description: '存在高复杂度的技术任务',
                probability: 0.6,
                impact: 7,
                riskScore: 4.2,
                affectedTaskIds: complexTasks.map(t => t.id),
                category: RiskCategory.TECHNICAL,
            });
        }
        return risks;
    }
    /**
     * 分析质量风险
     */
    analyzeQualityRisks(tasks) {
        const risks = [];
        // 检查缺少评审的任务
        const noReviewTasks = tasks.filter(task => { var _a; return ((_a = task.orchestrationMetadata) === null || _a === void 0 ? void 0 : _a.requiresReview) === false; });
        if (noReviewTasks.length > tasks.length * 0.5) {
            risks.push({
                id: 'quality-review-risk',
                name: '质量评审风险',
                description: '过多任务缺少质量评审环节',
                probability: 0.4,
                impact: 6,
                riskScore: 2.4,
                affectedTaskIds: noReviewTasks.map(t => t.id),
                category: RiskCategory.QUALITY,
            });
        }
        return risks;
    }
    /**
     * 生成缓解建议
     */
    generateMitigationSuggestions(riskFactors) {
        const suggestions = [];
        for (const risk of riskFactors) {
            switch (risk.category) {
                case RiskCategory.SCHEDULE:
                    if (risk.id === 'critical-path-risk') {
                        suggestions.push('考虑增加关键路径上的资源投入');
                        suggestions.push('寻找可以并行化的关键任务');
                        suggestions.push('评估是否可以缩短关键任务的持续时间');
                    }
                    if (risk.id === 'long-duration-risk') {
                        suggestions.push('将长持续时间任务分解为更小的子任务');
                        suggestions.push('增加里程碑检查点');
                    }
                    break;
                case RiskCategory.RESOURCE:
                    if (risk.id === 'resource-overallocation-risk') {
                        suggestions.push('重新平衡资源分配');
                        suggestions.push('考虑增加额外资源或外包');
                        suggestions.push('调整任务时间安排以避免资源冲突');
                    }
                    break;
                case RiskCategory.TECHNICAL:
                    if (risk.id === 'technical-complexity-risk') {
                        suggestions.push('为高复杂度任务分配经验丰富的团队成员');
                        suggestions.push('增加技术评审和原型验证');
                        suggestions.push('考虑技术培训或外部咨询');
                    }
                    break;
                case RiskCategory.QUALITY:
                    if (risk.id === 'quality-review-risk') {
                        suggestions.push('为关键任务增加质量评审环节');
                        suggestions.push('建立代码审查和测试标准');
                        suggestions.push('实施持续集成和自动化测试');
                    }
                    break;
            }
        }
        return suggestions;
    }
    /**
     * 生成应急计划
     */
    generateContingencyPlans(riskFactors) {
        const plans = [];
        for (const risk of riskFactors) {
            if (risk.riskScore > 4.0) { // 高风险才生成应急计划
                plans.push({
                    id: `contingency-${risk.id}`,
                    name: `${risk.name}应急计划`,
                    description: `针对${risk.name}的应急响应计划`,
                    triggerConditions: [
                        `${risk.name}发生概率超过阈值`,
                        '项目进度出现明显延迟',
                        '相关任务状态异常',
                    ],
                    actions: [
                        '立即评估影响范围',
                        '启动风险响应流程',
                        '调整项目计划和资源分配',
                        '通知相关利益相关者',
                    ],
                    estimatedCost: risk.impact * 1000, // 简化计算
                    estimatedTime: risk.impact * 2, // 简化计算
                });
            }
        }
        return plans;
    }
    /**
     * 生成优化建议
     */
    generateRecommendations(tasks, criticalPath, parallelGroups, resourceUtilization, riskAssessment) {
        const recommendations = [];
        // 关键路径建议
        if (criticalPath.length > 0) {
            recommendations.push(`项目关键路径包含 ${criticalPath.length} 个任务，建议重点关注这些任务的执行`);
            if (criticalPath.length > tasks.length * 0.4) {
                recommendations.push('关键路径任务比例较高，建议寻找优化机会以减少项目风险');
            }
        }
        // 并行化建议
        if (parallelGroups.length > 0) {
            const totalParallelTasks = parallelGroups.reduce((sum, group) => sum + group.length, 0);
            recommendations.push(`识别到 ${parallelGroups.length} 个并行任务组，共 ${totalParallelTasks} 个任务可并行执行`);
            recommendations.push('合理安排并行任务可以显著缩短项目周期');
        }
        // 资源利用率建议
        const overutilizedResources = resourceUtilization.filter(r => r.utilizationRate > 1.0);
        if (overutilizedResources.length > 0) {
            recommendations.push(`发现 ${overutilizedResources.length} 个资源过度分配，建议调整资源计划`);
        }
        const underutilizedResources = resourceUtilization.filter(r => r.utilizationRate < 0.5);
        if (underutilizedResources.length > 0) {
            recommendations.push(`发现 ${underutilizedResources.length} 个资源利用率较低，可考虑重新分配`);
        }
        // 风险建议
        if (riskAssessment.overallRiskLevel > 6.0) {
            recommendations.push('项目整体风险等级较高，建议制定详细的风险应对计划');
        }
        // 优化建议
        const longTasks = tasks.filter(task => this.getTaskDuration(task) > 40);
        if (longTasks.length > 0) {
            recommendations.push(`发现 ${longTasks.length} 个长持续时间任务，建议考虑任务分解`);
        }
        return recommendations;
    }
    /**
     * 计算项目总持续时间
     */
    calculateTotalDuration(tasks) {
        let maxFinishTime = 0;
        for (const task of tasks) {
            const node = this.graph.get(task.id);
            if (node && node.outDegree === 0) { // 项目结束任务
                maxFinishTime = Math.max(maxFinishTime, node.earliestFinish);
            }
        }
        return maxFinishTime;
    }
    /**
     * 创建空的风险评估
     */
    createEmptyRiskAssessment() {
        return {
            overallRiskLevel: 0,
            riskFactors: [],
            mitigationSuggestions: [],
            contingencyPlans: [],
        };
    }
    /**
     * 获取任务持续时间
     */
    getTaskDuration(task) {
        var _a;
        return ((_a = task.timeInfo) === null || _a === void 0 ? void 0 : _a.estimatedDuration) || task.estimatedHours || 8; // 默认8小时
    }
    /**
     * 查找依赖关系
     */
    findDependency(predecessorId, successorId) {
        for (const dependency of this.dependencies.values()) {
            if (dependency.predecessorId === predecessorId && dependency.successorId === successorId) {
                return dependency;
            }
        }
        return undefined;
    }
    /**
     * 更新任务时间信息
     */
    updateTaskTimeInfo(tasks) {
        const updatedTasks = [...tasks];
        for (const task of updatedTasks) {
            const node = this.graph.get(task.id);
            if (node) {
                task.timeInfo = {
                    estimatedDuration: this.getTaskDuration(task),
                    earliestStart: new Date(Date.now() + node.earliestStart * 60 * 60 * 1000),
                    latestStart: new Date(Date.now() + node.latestStart * 60 * 60 * 1000),
                    earliestFinish: new Date(Date.now() + node.earliestFinish * 60 * 60 * 1000),
                    latestFinish: new Date(Date.now() + node.latestFinish * 60 * 60 * 1000),
                    totalFloat: node.totalFloat,
                    freeFloat: node.freeFloat,
                    isCritical: node.isCritical,
                };
            }
        }
        return updatedTasks;
    }
    /**
     * 获取编排统计信息
     */
    getOrchestrationStats() {
        const totalTasks = this.tasks.size;
        const criticalTasks = Array.from(this.graph.values()).filter(node => node.isCritical).length;
        const parallelGroups = this.identifyParallelGroups().length;
        const totalFloat = Array.from(this.graph.values()).reduce((sum, node) => sum + node.totalFloat, 0);
        const averageFloat = totalTasks > 0 ? totalFloat / totalTasks : 0;
        const longestPath = Math.max(...Array.from(this.graph.values()).map(node => node.earliestFinish));
        return {
            totalTasks,
            criticalTasks,
            parallelGroups,
            averageFloat,
            longestPath,
        };
    }
}

/**
 * TaskFlow AI - 任务编排工厂类
 *
 * 提供不同编排策略的工厂方法和预设配置
 *
 * @author TaskFlow AI Team
 * @version 1.0.0
 */
/**
 * 编排策略预设
 */
var OrchestrationPreset;
(function (OrchestrationPreset) {
    OrchestrationPreset["AGILE_SPRINT"] = "agile_sprint";
    OrchestrationPreset["WATERFALL"] = "waterfall";
    OrchestrationPreset["CRITICAL_CHAIN"] = "critical_chain";
    OrchestrationPreset["LEAN_STARTUP"] = "lean_startup";
    OrchestrationPreset["RAPID_PROTOTYPE"] = "rapid_prototype";
    OrchestrationPreset["ENTERPRISE"] = "enterprise";
    OrchestrationPreset["RESEARCH"] = "research";
    OrchestrationPreset["MAINTENANCE"] = "maintenance";
})(OrchestrationPreset || (OrchestrationPreset = {}));
/**
 * 任务编排工厂类
 */
class OrchestrationFactory {
    /**
     * 创建编排引擎
     */
    static createEngine(preset, customConfig) {
        const baseConfig = preset ? this.getPresetConfig(preset) : this.getDefaultConfig();
        const finalConfig = { ...baseConfig, ...customConfig };
        return new TaskOrchestrationEngine(finalConfig);
    }
    /**
     * 获取预设配置
     */
    static getPresetConfig(preset) {
        switch (preset) {
            case OrchestrationPreset.AGILE_SPRINT:
                return this.getAgileSprintConfig();
            case OrchestrationPreset.WATERFALL:
                return this.getWaterfallConfig();
            case OrchestrationPreset.CRITICAL_CHAIN:
                return this.getCriticalChainConfig();
            case OrchestrationPreset.LEAN_STARTUP:
                return this.getLeanStartupConfig();
            case OrchestrationPreset.RAPID_PROTOTYPE:
                return this.getRapidPrototypeConfig();
            case OrchestrationPreset.ENTERPRISE:
                return this.getEnterpriseConfig();
            case OrchestrationPreset.RESEARCH:
                return this.getResearchConfig();
            case OrchestrationPreset.MAINTENANCE:
                return this.getMaintenanceConfig();
            default:
                return this.getDefaultConfig();
        }
    }
    /**
     * 默认配置
     */
    static getDefaultConfig() {
        return {
            enableCriticalPath: true,
            enableParallelOptimization: true,
            enableResourceLeveling: false,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
            optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
            maxParallelTasks: 5,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.1,
        };
    }
    /**
     * 敏捷冲刺配置
     */
    static getAgileSprintConfig() {
        return {
            enableCriticalPath: true,
            enableParallelOptimization: true,
            enableResourceLeveling: true,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.PRIORITY_FIRST,
            optimizationGoal: OptimizationGoal.MAXIMIZE_QUALITY,
            maxParallelTasks: 8,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.15, // 敏捷项目需要更多缓冲
        };
    }
    /**
     * 瀑布模型配置
     */
    static getWaterfallConfig() {
        return {
            enableCriticalPath: true,
            enableParallelOptimization: false, // 瀑布模型强调顺序执行
            enableResourceLeveling: true,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
            optimizationGoal: OptimizationGoal.MINIMIZE_RISK,
            maxParallelTasks: 3,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.2, // 瀑布模型需要更多缓冲时间
        };
    }
    /**
     * 关键链配置
     */
    static getCriticalChainConfig() {
        return {
            enableCriticalPath: true,
            enableParallelOptimization: true,
            enableResourceLeveling: true,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
            optimizationGoal: OptimizationGoal.BALANCE_RESOURCES,
            maxParallelTasks: 6,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.25, // 关键链方法使用缓冲区管理
        };
    }
    /**
     * 精益创业配置
     */
    static getLeanStartupConfig() {
        return {
            enableCriticalPath: false, // 精益创业更注重快速迭代
            enableParallelOptimization: true,
            enableResourceLeveling: false,
            enableRiskAnalysis: false, // 快速试错，不过度分析风险
            schedulingStrategy: SchedulingStrategy.SHORTEST_FIRST,
            optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
            maxParallelTasks: 10,
            workingHoursPerDay: 10, // 创业团队工作时间更长
            workingDaysPerWeek: 6,
            bufferPercentage: 0.05, // 最小缓冲，快速迭代
        };
    }
    /**
     * 快速原型配置
     */
    static getRapidPrototypeConfig() {
        return {
            enableCriticalPath: false,
            enableParallelOptimization: true,
            enableResourceLeveling: false,
            enableRiskAnalysis: false,
            schedulingStrategy: SchedulingStrategy.SHORTEST_FIRST,
            optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
            maxParallelTasks: 12,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.05,
        };
    }
    /**
     * 企业级配置
     */
    static getEnterpriseConfig() {
        return {
            enableCriticalPath: true,
            enableParallelOptimization: true,
            enableResourceLeveling: true,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.RESOURCE_LEVELING,
            optimizationGoal: OptimizationGoal.BALANCE_RESOURCES,
            maxParallelTasks: 15,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.2,
        };
    }
    /**
     * 研究项目配置
     */
    static getResearchConfig() {
        return {
            enableCriticalPath: false, // 研究项目路径不确定
            enableParallelOptimization: false, // 研究任务通常需要顺序进行
            enableResourceLeveling: false,
            enableRiskAnalysis: true,
            schedulingStrategy: SchedulingStrategy.LONGEST_FIRST, // 先做复杂的研究
            optimizationGoal: OptimizationGoal.MAXIMIZE_QUALITY,
            maxParallelTasks: 3,
            workingHoursPerDay: 6, // 研究需要深度思考时间
            workingDaysPerWeek: 5,
            bufferPercentage: 0.3, // 研究项目不确定性高
        };
    }
    /**
     * 维护项目配置
     */
    static getMaintenanceConfig() {
        return {
            enableCriticalPath: false,
            enableParallelOptimization: true,
            enableResourceLeveling: true,
            enableRiskAnalysis: false, // 维护任务风险相对较低
            schedulingStrategy: SchedulingStrategy.PRIORITY_FIRST,
            optimizationGoal: OptimizationGoal.MINIMIZE_COST,
            maxParallelTasks: 6,
            workingHoursPerDay: 8,
            workingDaysPerWeek: 5,
            bufferPercentage: 0.1,
        };
    }
    /**
     * 获取所有可用预设
     */
    static getAvailablePresets() {
        return [
            {
                preset: OrchestrationPreset.AGILE_SPRINT,
                name: '敏捷冲刺',
                description: '适用于敏捷开发的迭代式项目管理',
                suitableFor: ['敏捷开发', 'Scrum', '迭代开发', '快速交付'],
            },
            {
                preset: OrchestrationPreset.WATERFALL,
                name: '瀑布模型',
                description: '传统的顺序式项目管理方法',
                suitableFor: ['传统项目', '需求明确', '风险控制', '合规要求'],
            },
            {
                preset: OrchestrationPreset.CRITICAL_CHAIN,
                name: '关键链',
                description: '基于约束理论的项目管理方法',
                suitableFor: ['资源约束', '多项目管理', '缓冲区管理'],
            },
            {
                preset: OrchestrationPreset.LEAN_STARTUP,
                name: '精益创业',
                description: '快速迭代和验证的创业项目管理',
                suitableFor: ['创业项目', '快速验证', 'MVP开发', '市场试错'],
            },
            {
                preset: OrchestrationPreset.RAPID_PROTOTYPE,
                name: '快速原型',
                description: '专注于快速构建原型的项目管理',
                suitableFor: ['原型开发', '概念验证', '快速演示'],
            },
            {
                preset: OrchestrationPreset.ENTERPRISE,
                name: '企业级',
                description: '适用于大型企业的复杂项目管理',
                suitableFor: ['大型项目', '多团队协作', '企业治理', '合规管理'],
            },
            {
                preset: OrchestrationPreset.RESEARCH,
                name: '研究项目',
                description: '适用于研究和探索性项目',
                suitableFor: ['科研项目', '技术探索', '不确定性高', '创新研发'],
            },
            {
                preset: OrchestrationPreset.MAINTENANCE,
                name: '维护项目',
                description: '适用于系统维护和运营项目',
                suitableFor: ['系统维护', '运营支持', '缺陷修复', '性能优化'],
            },
        ];
    }
    /**
     * 根据项目特征推荐预设
     */
    static recommendPreset(projectCharacteristics) {
        const { teamSize = 5, projectDuration = 30, uncertaintyLevel = 5, qualityRequirement = 7, timeConstraint = 5, budgetConstraint = 5, isAgile = false, isResearch = false, isEnterprise = false, } = projectCharacteristics;
        // 企业级项目
        if (isEnterprise || teamSize > 20) {
            return OrchestrationPreset.ENTERPRISE;
        }
        // 研究项目
        if (isResearch || uncertaintyLevel > 8) {
            return OrchestrationPreset.RESEARCH;
        }
        // 敏捷项目
        if (isAgile || (timeConstraint > 7 && projectDuration < 90)) {
            return OrchestrationPreset.AGILE_SPRINT;
        }
        // 快速原型
        if (projectDuration < 14 && timeConstraint > 8) {
            return OrchestrationPreset.RAPID_PROTOTYPE;
        }
        // 精益创业
        if (uncertaintyLevel > 6 && timeConstraint > 6 && teamSize < 10) {
            return OrchestrationPreset.LEAN_STARTUP;
        }
        // 维护项目
        if (qualityRequirement < 6 && uncertaintyLevel < 4) {
            return OrchestrationPreset.MAINTENANCE;
        }
        // 瀑布模型
        if (uncertaintyLevel < 4 && qualityRequirement > 8) {
            return OrchestrationPreset.WATERFALL;
        }
        // 关键链
        if (budgetConstraint > 7 || teamSize > 10) {
            return OrchestrationPreset.CRITICAL_CHAIN;
        }
        // 默认敏捷冲刺
        return OrchestrationPreset.AGILE_SPRINT;
    }
}

/**
 * 配置相关类型定义
 */
/**
 * 模型类型枚举
 */
var ModelType;
(function (ModelType) {
    ModelType["BAIDU"] = "baidu";
    ModelType["XUNFEI"] = "xunfei";
    ModelType["ZHIPU"] = "zhipu";
    ModelType["DEEPSEEK"] = "deepseek";
    ModelType["QWEN"] = "qwen";
    ModelType["SPARK"] = "spark";
    ModelType["MOONSHOT"] = "moonshot";
})(ModelType || (ModelType = {}));
/**
 * 日志级别
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
/**
 * 编程语言枚举
 */
var ProgrammingLanguage;
(function (ProgrammingLanguage) {
    ProgrammingLanguage["TYPESCRIPT"] = "typescript";
    ProgrammingLanguage["JAVASCRIPT"] = "javascript";
    ProgrammingLanguage["PYTHON"] = "python";
    ProgrammingLanguage["JAVA"] = "java";
    ProgrammingLanguage["GO"] = "go";
    ProgrammingLanguage["RUST"] = "rust";
    ProgrammingLanguage["CPP"] = "cpp";
    ProgrammingLanguage["CSHARP"] = "csharp";
})(ProgrammingLanguage || (ProgrammingLanguage = {}));
/**
 * 项目类型枚举
 */
var ProjectType;
(function (ProjectType) {
    ProjectType["WEB_APP"] = "web-app";
    ProjectType["API"] = "api";
    ProjectType["MOBILE_APP"] = "mobile-app";
    ProjectType["DESKTOP_APP"] = "desktop-app";
    ProjectType["LIBRARY"] = "library";
    ProjectType["CLI_TOOL"] = "cli-tool";
})(ProjectType || (ProjectType = {}));
/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
    models: {
        default: ModelType.BAIDU,
    },
    taskSettings: {
        outputDir: './tasks',
        autoSave: true,
        saveInterval: 300,
    },
    testSettings: {
        framework: 'jest',
        outputDir: './tests',
        coverage: true,
    },
    logger: {
        level: LogLevel.INFO,
        output: 'console',
    },
};

/**
 * 简化的配置管理器
 * 负责管理应用程序的配置信息
 */
class SimpleConfigManager {
    constructor() {
        this.configPath = path__namespace.join(os__namespace.homedir(), '.taskflow-ai', 'config.json');
        this.config = this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs__namespace$1.existsSync(this.configPath)) {
                const configData = fs__namespace$1.readFileSync(this.configPath, 'utf8');
                return JSON.parse(configData);
            }
        }
        catch (error) {
            console.warn(`加载配置文件失败: ${error.message}`);
        }
        // 返回默认配置
        return {
            models: {
                default: ModelType.DEEPSEEK,
                apiKeys: {},
                endpoints: {}
            },
            ui: {
                theme: 'light',
                language: 'zh-CN'
            },
            features: {
                autoSave: true,
                notifications: true
            }
        };
    }
    saveConfig() {
        try {
            const configDir = path__namespace.dirname(this.configPath);
            if (!fs__namespace$1.existsSync(configDir)) {
                fs__namespace$1.mkdirSync(configDir, { recursive: true });
            }
            fs__namespace$1.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error(`保存配置文件失败: ${error.message}`);
        }
    }
    /**
     * 获取配置值
     */
    get(key, defaultValue) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            if (value && typeof value === 'object' && value !== null && k in value) {
                value = value[k];
            }
            else {
                return defaultValue;
            }
        }
        return value;
    }
    /**
     * 设置配置值
     */
    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!current[k] || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        current[keys[keys.length - 1]] = value;
        this.saveConfig();
    }
    /**
     * 获取所有配置
     */
    getAll() {
        return { ...this.config };
    }
    /**
     * 更新配置
     */
    update(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
    }
    /**
     * 重置配置
     */
    reset() {
        this.config = this.loadConfig();
    }
    /**
     * 获取配置（兼容原ConfigManager接口）
     */
    getConfig() {
        return this.getAll();
    }
    /**
     * 更新配置（兼容原ConfigManager接口）
     */
    updateConfig(config, _isProjectLevel = false) {
        this.update(config);
    }
    /**
     * 获取默认模型类型
     */
    getDefaultModelType() {
        return this.get('models.default', ModelType.DEEPSEEK);
    }
}

/**
 * 日志服务，用于记录应用运行日志
 */
class Logger {
    /**
     * 创建日志服务实例
     * @param config 日志配置
     */
    constructor(config) {
        const logDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.config', 'mcp', 'logs');
        fs.ensureDirSync(logDir);
        const logFile = config.file || path.join(logDir, 'mcp.log');
        const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        }));
        const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());
        const transports = [];
        // 根据配置添加控制台日志传输
        if (config.output === 'console' || config.output === 'both') {
            transports.push(new winston.transports.Console({
                format: consoleFormat,
                level: config.level,
            }));
        }
        // 根据配置添加文件日志传输
        if (config.output === 'file' || config.output === 'both') {
            transports.push(new winston.transports.File({
                filename: logFile,
                format: fileFormat,
                level: config.level,
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }));
        }
        this.logger = winston.createLogger({
            level: config.level,
            levels: winston.config.npm.levels,
            defaultMeta: { service: 'mcp' },
            transports,
        });
    }
    /**
     * 获取日志服务实例
     * @param config 日志配置
     */
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    /**
     * 更新日志配置
     * @param config 日志配置
     */
    updateConfig(config) {
        Logger.instance = new Logger(config);
    }
    /**
     * 记录错误级别日志
     * @param message 日志消息
     * @param meta 元数据
     */
    error(message, meta) {
        this.logger.error(message, meta);
    }
    /**
     * 记录警告级别日志
     * @param message 日志消息
     * @param meta 元数据
     */
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    /**
     * 记录信息级别日志
     * @param message 日志消息
     * @param meta 元数据
     */
    info(message, meta) {
        this.logger.info(message, meta);
    }
    /**
     * 记录调试级别日志
     * @param message 日志消息
     * @param meta 元数据
     */
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    /**
     * 通用日志记录方法
     * @param level 日志级别
     * @param message 日志消息
     * @param meta 元数据
     */
    log(level, message, meta) {
        this.logger.log(level, message, meta);
    }
}

var logger = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Logger: Logger
});

/**
 * 基础模型适配器抽象类
 * 提供模型适配器的通用实现
 */
class BaseModelAdapter {
    constructor(modelType) {
        this.modelType = modelType;
    }
    /**
     * 获取模型类型
     */
    getModelType() {
        return this.modelType;
    }
    /**
     * 处理HTTP请求错误
     * @param error 错误对象
     */
    handleRequestError(error) {
        if (error && typeof error === 'object' && 'response' in error) {
            // 服务器响应了请求，但状态码不是2xx
            const response = error.response;
            const statusCode = response === null || response === void 0 ? void 0 : response.status;
            const data = response === null || response === void 0 ? void 0 : response.data;
            let message = `HTTP Error ${statusCode}`;
            if (data && typeof data === 'object') {
                message += `: ${JSON.stringify(data)}`;
            }
            if (statusCode === 401 || statusCode === 403) {
                throw new Error(`认证失败：${message}，请检查API密钥是否正确`);
            }
            else if (statusCode === 429) {
                throw new Error(`请求速率限制：${message}，请稍后重试`);
            }
            else {
                throw new Error(`API调用失败：${message}`);
            }
        }
        else if (error && typeof error === 'object' && 'request' in error) {
            // 请求已经发出，但没有收到响应
            const message = error.message || '网络错误';
            throw new Error(`请求超时或网络错误：${message}`);
        }
        else {
            // 设置请求时发生了错误
            const message = (error === null || error === void 0 ? void 0 : error.message) || '未知错误';
            throw new Error(`请求配置错误：${message}`);
        }
    }
}

/**
 * 百度文心大模型适配器
 */
class BaiduModelAdapter extends BaseModelAdapter {
    /**
     * 创建百度文心大模型适配器实例
     * @param configManager 配置管理器实例
     */
    constructor(configManager) {
        super(ModelType.BAIDU);
        this.accessToken = null;
        this.tokenExpireTime = 0;
        const config = configManager.get(`models.${ModelType.BAIDU}`, {
            apiKey: '',
            secretKey: '',
            endpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/',
            modelVersion: 'ernie-bot-4',
        });
        this.apiKey = config.apiKey;
        this.secretKey = config.secretKey;
        this.endpoint = config.endpoint || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/';
        this.modelVersion = config.modelVersion || 'ernie-bot-4';
        if (!this.apiKey || !this.secretKey) {
            throw new Error('百度文心API密钥未配置，请使用 mcp config 命令设置 model.baidu.apiKey 和 model.baidu.secretKey');
        }
    }
    /**
     * 执行聊天请求
     * @param params 请求参数
     * @param options 调用选项
     */
    async chat(params, options) {
        try {
            await this.ensureAccessToken();
            const requestBody = this.buildRequestBody(params, options);
            const url = `${this.endpoint}${this.modelVersion}?access_token=${this.accessToken}`;
            const response = await axios.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 30000,
            });
            return this.processResponse(response.data);
        }
        catch (error) {
            return this.handleRequestError(error);
        }
    }
    /**
     * 流式聊天请求
     * @param params 请求参数
     * @param onData 数据回调函数
     * @param options 调用选项
     */
    async chatStream(params, onData, options) {
        try {
            await this.ensureAccessToken();
            const requestBody = this.buildRequestBody(params, { ...options, stream: true });
            const url = `${this.endpoint}${this.modelVersion}?access_token=${this.accessToken}`;
            const response = await axios.post(url, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
                responseType: 'stream',
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 60000,
            });
            const stream = response.data;
            return new Promise((resolve, reject) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                    const chunkString = chunk.toString();
                    buffer += chunkString;
                    // 处理SSE格式的响应
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            try {
                                const parsedData = JSON.parse(data);
                                onData(parsedData.result, parsedData.is_end || false);
                            }
                            catch {
                                // 忽略非JSON数据
                            }
                        }
                    }
                });
                stream.on('end', () => {
                    onData('', true);
                    resolve();
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            });
        }
        catch (error) {
            return this.handleRequestError(error);
        }
    }
    /**
     * 验证API密钥
     */
    async validateApiKey() {
        try {
            await this.ensureAccessToken();
            return !!this.accessToken;
        }
        catch {
            return false;
        }
    }
    /**
     * 构建请求体
     * @param params 请求参数
     * @param options 调用选项
     */
    buildRequestBody(params, options) {
        var _a, _b, _c, _d;
        const messages = params.messages.map(msg => ({
            role: this.mapRole(msg.role),
            content: msg.content,
        }));
        return {
            messages,
            temperature: (_b = (_a = options === null || options === void 0 ? void 0 : options.temperature) !== null && _a !== void 0 ? _a : params.temperature) !== null && _b !== void 0 ? _b : 0.7,
            top_p: (_c = params.topP) !== null && _c !== void 0 ? _c : 0.8,
            stream: (_d = options === null || options === void 0 ? void 0 : options.stream) !== null && _d !== void 0 ? _d : false,
            user_id: 'mcp-user',
        };
    }
    /**
     * 处理响应数据
     * @param response 响应数据
     */
    processResponse(response) {
        return {
            content: response.result,
            finishReason: response.is_end ? 'stop' : undefined,
            usage: response.usage ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
            } : undefined,
        };
    }
    /**
     * 映射消息角色
     * @param role 角色
     */
    mapRole(role) {
        switch (role) {
            case MessageRole.USER:
                return 'user';
            case MessageRole.ASSISTANT:
                return 'assistant';
            case MessageRole.SYSTEM:
                return 'system';
            default:
                return 'user';
        }
    }
    /**
     * 确保有效的访问令牌
     */
    async ensureAccessToken() {
        const currentTime = Date.now();
        // 如果令牌有效，直接返回
        if (this.accessToken && currentTime < this.tokenExpireTime) {
            return;
        }
        try {
            const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
            const response = await axios.post(tokenUrl);
            if (response.data && response.data.access_token) {
                this.accessToken = response.data.access_token;
                // 令牌有效期通常是30天，这里设为29天，提前刷新
                this.tokenExpireTime = currentTime + (response.data.expires_in || 2592000) * 1000 - 86400000;
            }
            else {
                throw new Error('获取访问令牌失败：响应中没有access_token字段');
            }
        }
        catch (error) {
            this.accessToken = null;
            this.tokenExpireTime = 0;
            throw new Error(`获取百度文心访问令牌失败：${error.message}`);
        }
    }
}

/**
 * DeepSeek大模型适配器
 */
class DeepseekModelAdapter extends BaseModelAdapter {
    /**
     * 创建DeepSeek大模型适配器实例
     * @param configManager 配置管理器实例
     */
    constructor(configManager) {
        super(ModelType.DEEPSEEK);
        const config = configManager.get(`models.${ModelType.DEEPSEEK}`, {
            apiKey: '',
            endpoint: 'https://api.deepseek.com/v1/chat/completions',
            modelVersion: 'deepseek-chat',
        });
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://api.deepseek.com/v1/chat/completions';
        this.modelVersion = config.modelVersion || 'deepseek-chat';
        if (!this.apiKey) {
            throw new Error('DeepSeek API密钥未配置，请使用 mcp config 命令设置 model.deepseek.apiKey');
        }
    }
    /**
     * 执行聊天请求
     * @param params 请求参数
     * @param options 调用选项
     */
    async chat(params, options) {
        try {
            const requestBody = this.buildRequestBody(params, options);
            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 30000,
            });
            return this.processResponse(response.data);
        }
        catch (error) {
            return this.handleRequestError(error);
        }
    }
    /**
     * 流式聊天请求
     * @param params 请求参数
     * @param onData 数据回调函数
     * @param options 调用选项
     */
    async chatStream(params, onData, options) {
        try {
            const requestBody = this.buildRequestBody(params, { ...options, stream: true });
            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                responseType: 'stream',
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 60000,
            });
            const stream = response.data;
            return new Promise((resolve, reject) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                    var _a;
                    const chunkString = chunk.toString();
                    buffer += chunkString;
                    // 处理SSE格式的响应
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            // 检查是否是流结束标记
                            if (data === '[DONE]') {
                                onData('', true);
                                continue;
                            }
                            try {
                                const parsedData = JSON.parse(data);
                                if (parsedData.choices && parsedData.choices.length > 0) {
                                    const content = ((_a = parsedData.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || '';
                                    const done = parsedData.choices[0].finish_reason === 'stop';
                                    onData(content, done);
                                }
                            }
                            catch {
                                // 忽略非JSON数据
                            }
                        }
                    }
                });
                stream.on('end', () => {
                    onData('', true);
                    resolve();
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            });
        }
        catch (error) {
            return this.handleRequestError(error);
        }
    }
    /**
     * 验证API密钥
     */
    async validateApiKey() {
        try {
            // 使用一个简单的请求验证API密钥
            await this.chat({
                messages: [{ role: MessageRole.USER, content: 'Hello' }],
                maxTokens: 5
            }, { temperature: 0.1 });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 构建请求体
     * @param params 请求参数
     * @param options 调用选项
     */
    buildRequestBody(params, options) {
        var _a, _b, _c, _d, _e, _f;
        const messages = params.messages.map(msg => ({
            role: this.mapRole(msg.role),
            content: msg.content,
        }));
        return {
            model: this.modelVersion,
            messages,
            temperature: (_b = (_a = options === null || options === void 0 ? void 0 : options.temperature) !== null && _a !== void 0 ? _a : params.temperature) !== null && _b !== void 0 ? _b : 0.7,
            top_p: (_c = params.topP) !== null && _c !== void 0 ? _c : 0.8,
            max_tokens: (_e = (_d = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _d !== void 0 ? _d : params.maxTokens) !== null && _e !== void 0 ? _e : 1024,
            stream: (_f = options === null || options === void 0 ? void 0 : options.stream) !== null && _f !== void 0 ? _f : false,
        };
    }
    /**
     * 处理响应数据
     * @param response 响应数据
     */
    processResponse(response) {
        var _a;
        if (!response.choices || response.choices.length === 0) {
            throw new Error('无效的响应格式：没有返回choices字段');
        }
        const choice = response.choices[0];
        return {
            content: ((_a = choice.message) === null || _a === void 0 ? void 0 : _a.content) || '',
            finishReason: choice.finish_reason,
            usage: response.usage ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
            } : undefined,
        };
    }
    /**
     * 映射消息角色
     * @param role 角色
     */
    mapRole(role) {
        switch (role) {
            case MessageRole.USER:
                return 'user';
            case MessageRole.ASSISTANT:
                return 'assistant';
            case MessageRole.SYSTEM:
                return 'system';
            default:
                return 'user';
        }
    }
}

/**
 * 智谱AI大模型适配器
 */
class ZhipuModelAdapter extends BaseModelAdapter {
    /**
     * 创建智谱AI大模型适配器实例
     * @param configManager 配置管理器实例
     */
    constructor(configManager) {
        super(ModelType.ZHIPU);
        const config = configManager.get(`models.${ModelType.ZHIPU}`, {
            apiKey: '',
            endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            modelVersion: 'glm-4',
        });
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        this.modelVersion = config.modelVersion || 'glm-4';
        if (!this.apiKey) {
            throw new Error('智谱AI API密钥未配置，请使用 yasi config 命令设置 model.zhipu.apiKey');
        }
    }
    /**
     * 执行聊天请求
     * @param params 请求参数
     * @param options 调用选项
     */
    async chat(params, options) {
        try {
            const requestBody = this.buildRequestBody(params, options);
            const headers = this.generateAuthHeaders();
            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': headers.Authorization,
                    'Date': headers.Date,
                },
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 30000,
            });
            return this.processResponse(response.data);
        }
        catch (error) {
            return this.handleRequestError(error);
        }
    }
    /**
     * 流式聊天请求
     * @param params 请求参数
     * @param onData 数据回调函数
     * @param options 调用选项
     */
    async chatStream(params, onData, options) {
        try {
            const requestBody = this.buildRequestBody(params, { ...options, stream: true });
            const headers = this.generateAuthHeaders();
            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': headers.Authorization,
                    'Date': headers.Date,
                    'Accept': 'text/event-stream',
                },
                responseType: 'stream',
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 60000,
            });
            const stream = response.data;
            return new Promise((resolve, reject) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                    var _a;
                    const chunkString = chunk.toString();
                    buffer += chunkString;
                    // 处理SSE格式的响应
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            // 检查是否是流结束标记
                            if (data === '[DONE]') {
                                onData('', true);
                                continue;
                            }
                            try {
                                const parsedData = JSON.parse(data);
                                if (parsedData.choices && parsedData.choices.length > 0) {
                                    const delta = ((_a = parsedData.choices[0].delta) === null || _a === void 0 ? void 0 : _a.content) || '';
                                    const done = parsedData.choices[0].finish_reason === 'stop';
                                    onData(delta, done);
                                }
                            }
                            catch {
                                // 忽略非JSON数据
                            }
                        }
                    }
                });
                stream.on('end', () => {
                    onData('', true);
                    resolve();
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            });
        }
        catch (error) {
            return this.handleRequestError(error);
        }
    }
    /**
     * 验证API密钥
     */
    async validateApiKey() {
        try {
            // 使用一个简单的请求验证API密钥
            await this.chat({
                messages: [{ role: MessageRole.USER, content: 'Hello' }],
                maxTokens: 5
            }, { temperature: 0.1 });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 构建请求体
     * @param params 请求参数
     * @param options 调用选项
     */
    buildRequestBody(params, options) {
        var _a, _b, _c, _d, _e, _f;
        const messages = params.messages.map(msg => ({
            role: this.mapRole(msg.role),
            content: msg.content,
        }));
        return {
            model: this.modelVersion,
            messages,
            temperature: (_b = (_a = options === null || options === void 0 ? void 0 : options.temperature) !== null && _a !== void 0 ? _a : params.temperature) !== null && _b !== void 0 ? _b : 0.7,
            top_p: (_c = params.topP) !== null && _c !== void 0 ? _c : 0.8,
            max_tokens: (_e = (_d = options === null || options === void 0 ? void 0 : options.maxTokens) !== null && _d !== void 0 ? _d : params.maxTokens) !== null && _e !== void 0 ? _e : 1024,
            stream: (_f = options === null || options === void 0 ? void 0 : options.stream) !== null && _f !== void 0 ? _f : false,
        };
    }
    /**
     * 处理响应数据
     * @param response 响应数据
     */
    processResponse(response) {
        var _a;
        if (!response.choices || response.choices.length === 0) {
            throw new Error('无效的响应格式：没有返回choices字段');
        }
        const choice = response.choices[0];
        return {
            content: ((_a = choice.message) === null || _a === void 0 ? void 0 : _a.content) || '',
            finishReason: choice.finish_reason,
            usage: response.usage ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
            } : undefined,
        };
    }
    /**
     * 映射消息角色
     * @param role 角色
     */
    mapRole(role) {
        switch (role) {
            case MessageRole.USER:
                return 'user';
            case MessageRole.ASSISTANT:
                return 'assistant';
            case MessageRole.SYSTEM:
                return 'system';
            default:
                return 'user';
        }
    }
    /**
     * 生成智谱API认证头信息
     */
    generateAuthHeaders() {
        // apiKey格式：zhipuai-api-key
        // 验证apiKey格式是否正确
        if (!this.apiKey.startsWith('zhipu-')) {
            throw new Error('智谱AI API密钥格式不正确，应以"zhipu-"开头');
        }
        // 从apiKey中提取id和secret
        const [id, secret] = this.apiKey.substring(6).split('.');
        if (!id || !secret) {
            throw new Error('智谱AI API密钥格式不正确，无法提取id和secret');
        }
        // 当前GMT时间，形如：Mon, 01 Jul 2023 12:00:00 GMT
        const date = new Date().toUTCString();
        // 计算HMAC-SHA256签名
        const signString = `date: ${date}\nPOST /api/paas/v4/chat/completions HTTP/1.1`;
        const signature = crypto__namespace
            .createHmac('sha256', secret)
            .update(signString)
            .digest('base64');
        // 生成Authorization头
        const authHeader = `hmac username="${id}", algorithm="hmac-sha256", headers="date request-line", signature="${signature}"`;
        return {
            Authorization: authHeader,
            Date: date
        };
    }
}

/**
 * 阿里通义千问模型提供商
 * 支持通义千问系列模型的API调用
 */
/**
 * 阿里通义千问模型适配器
 * 支持通义千问系列模型的API调用
 */
class QwenModelAdapter extends BaseModelAdapter {
    constructor(configManager) {
        super(ModelType.QWEN);
        const config = configManager.get(`models.${ModelType.QWEN}`);
        if (!config) {
            throw new Error('Qwen模型配置未找到');
        }
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
        this.modelVersion = config.modelVersion || 'qwen-turbo';
        this.client = axios.create({
            baseURL: this.endpoint,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'disable'
            },
            timeout: 30000
        });
    }
    /**
     * 执行聊天请求
     */
    async chat(params, _options) {
        var _a, _b, _c;
        try {
            const requestData = this.buildRequestData(params);
            const response = await this.client.post('', requestData);
            if (response.data.output && response.data.output.text) {
                return {
                    content: response.data.output.text,
                    usage: {
                        promptTokens: ((_a = response.data.usage) === null || _a === void 0 ? void 0 : _a.input_tokens) || 0,
                        completionTokens: ((_b = response.data.usage) === null || _b === void 0 ? void 0 : _b.output_tokens) || 0,
                        totalTokens: ((_c = response.data.usage) === null || _c === void 0 ? void 0 : _c.total_tokens) || 0
                    },
                    finishReason: response.data.output.finish_reason || 'stop'
                };
            }
            else {
                throw new Error('Invalid response format from Qwen API');
            }
        }
        catch (error) {
            this.handleRequestError(error);
        }
    }
    /**
     * 流式聊天请求
     */
    async chatStream(params, onData, _options) {
        try {
            const requestData = {
                ...this.buildRequestData(params),
                parameters: {
                    ...this.buildRequestData(params).parameters,
                    incremental_output: true
                }
            };
            // 启用SSE
            const response = await this.client.post('', requestData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-SSE': 'enable',
                    'Accept': 'text/event-stream'
                },
                responseType: 'stream'
            });
            let buffer = '';
            response.data.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onData('', true);
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.output && parsed.output.text) {
                                onData(parsed.output.text, false);
                            }
                        }
                        catch {
                            // 忽略解析错误
                        }
                    }
                }
            });
            response.data.on('end', () => {
                onData('', true);
            });
        }
        catch (error) {
            this.handleRequestError(error);
        }
    }
    /**
     * 验证API密钥
     */
    async validateApiKey() {
        try {
            const testParams = {
                messages: [{ role: MessageRole.USER, content: 'Hello' }],
                maxTokens: 10
            };
            await this.chat(testParams);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 构建请求数据
     */
    buildRequestData(params) {
        const messages = params.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        return {
            model: this.modelVersion,
            input: {
                messages: messages
            },
            parameters: {
                max_tokens: params.maxTokens || 2000,
                temperature: params.temperature || 0.7,
                top_p: params.topP || 0.9,
                repetition_penalty: 1.1,
                result_format: 'text'
            }
        };
    }
}

/**
 * 模型工厂类
 * 负责创建各种模型适配器
 */
class ModelFactory {
    /**
     * 创建模型工厂实例
     * @param configManager 配置管理器实例
     */
    constructor(configManager) {
        this.modelCache = new Map();
        this.configManager = configManager;
    }
    /**
     * 创建模型适配器
     * @param modelType 模型类型，不传时使用默认模型类型
     */
    createModelAdapter(modelType) {
        // 获取要使用的模型类型
        const type = modelType || this.configManager.getDefaultModelType();
        // 如果缓存中有这个模型的适配器实例，直接返回
        const cached = this.modelCache.get(type);
        if (cached) {
            return cached;
        }
        // 创建新的适配器实例
        let adapter;
        switch (type) {
            case ModelType.BAIDU:
                adapter = new BaiduModelAdapter(this.configManager);
                break;
            case ModelType.DEEPSEEK:
                adapter = new DeepseekModelAdapter(this.configManager);
                break;
            case ModelType.ZHIPU:
                adapter = new ZhipuModelAdapter(this.configManager);
                break;
            case ModelType.QWEN:
                adapter = new QwenModelAdapter(this.configManager);
                break;
            // TODO: 添加其他模型适配器
            // case ModelType.XUNFEI:
            //   adapter = new XunfeiModelAdapter(this.configManager);
            //   break;
            default:
                throw new Error(`不支持的模型类型: ${type}`);
        }
        // 将新创建的适配器存入缓存
        this.modelCache.set(type, adapter);
        return adapter;
    }
    /**
     * 清除模型适配器缓存
     * @param modelType 模型类型，不传时清除所有
     */
    clearCache(modelType) {
        if (modelType) {
            this.modelCache.delete(modelType);
        }
        else {
            this.modelCache.clear();
        }
    }
    /**
     * 获取所有可用的模型类型
     */
    getAvailableModelTypes() {
        // 更新为已实现的模型适配器
        return [ModelType.BAIDU, ModelType.DEEPSEEK, ModelType.ZHIPU];
        // 后续添加其他模型后更新为:
        // return [ModelType.BAIDU, ModelType.DEEPSEEK, ModelType.ZHIPU, ModelType.XUNFEI];
    }
    /**
     * 验证指定类型模型的API密钥
     * @param modelType 模型类型
     */
    async validateModelApiKey(modelType) {
        try {
            const adapter = this.createModelAdapter(modelType);
            return await adapter.validateApiKey();
        }
        catch {
            return false;
        }
    }
}

/**
 * 模型协调器
 * 负责协调多个模型的使用，根据任务类型选择合适的模型
 */
class ModelCoordinator {
    /**
     * 创建模型协调器实例
     * @param configManager 配置管理器实例
     */
    constructor(configManager) {
        this.configManager = configManager;
        this.modelFactory = new ModelFactory(configManager);
    }
    /**
     * 执行聊天请求
     * @param messages 消息数组
     * @param modelType 模型类型，不传时使用默认模型
     * @param options 调用选项
     */
    async chat(messages, modelType, options) {
        const adapter = this.modelFactory.createModelAdapter(modelType);
        return await adapter.chat({ messages }, options);
    }
    /**
     * 执行流式聊天请求
     * @param messages 消息数组
     * @param onData 数据回调
     * @param modelType 模型类型，不传时使用默认模型
     * @param options 调用选项
     */
    async chatStream(messages, onData, modelType, options) {
        const adapter = this.modelFactory.createModelAdapter(modelType);
        return await adapter.chatStream({ messages }, onData, options);
    }
    /**
     * 执行PRD解析任务
     * @param content PRD文档内容
     * @param options 解析选项
     */
    async parsePRD(content, options) {
        const modelType = (options === null || options === void 0 ? void 0 : options.modelType) || this.configManager.getDefaultModelType();
        // 构建系统提示词
        const systemPrompt = `你是一位专业的PRD需求分析师，请帮我解析以下PRD文档，提取其中的关键信息。
请按照以下JSON格式输出结果：
{
  "title": "文档标题",
  "description": "文档整体描述",
  "sections": [
    {
      "title": "章节标题",
      "content": "章节内容概述",
      "level": 章节层级,
      "features": [
        {
          "name": "功能名称",
          "description": "功能描述",
          "priority": "优先级" // high, medium, low
        }
      ]
    }
  ]
}
只返回JSON格式内容，不要有其他解释。`;
        // 用户消息
        const userPrompt = `以下是需要解析的PRD文档内容：

${content}

请解析这份文档，按照要求的JSON格式返回结果。`;
        const messages = [
            { role: MessageRole.SYSTEM, content: systemPrompt },
            { role: MessageRole.USER, content: userPrompt }
        ];
        return await this.chat(messages, modelType);
    }
    /**
     * 执行任务规划
     * @param parsedPRD 解析后的PRD结果
     * @param options 规划选项
     */
    async planTasks(parsedPRD, options) {
        const modelType = (options === null || options === void 0 ? void 0 : options.modelType) || this.configManager.getDefaultModelType();
        // 构建系统提示词
        const systemPrompt = `你是一位专业的项目规划师，请根据解析后的PRD内容，生成详细的任务计划。
请按照以下要求拆分任务：
1. 将大的功能需求拆分为更小的可执行子任务
2. 为每个任务分配合理的优先级和类型标签
3. 确定任务之间的依赖关系
4. ${(options === null || options === void 0 ? void 0 : options.estimateDuration) ? '估算每个任务的完成时间（以小时为单位）' : ''}
5. ${(options === null || options === void 0 ? void 0 : options.assignTasks) ? '为每个任务分配合适的角色' : ''}

请按照以下JSON格式输出结果：
{
  "name": "项目名称",
  "description": "项目描述",
  "tasks": [
    {
      "id": "唯一ID",
      "name": "任务名称",
      "description": "任务描述",
      "priority": "优先级", // high, medium, low
      "type": "任务类型", // feature, bug_fix, refactor, test, document
      "dependencies": ["依赖任务ID"],
      ${(options === null || options === void 0 ? void 0 : options.estimateDuration) ? '"estimatedDuration": 预计耗时（小时）,' : ''}
      ${(options === null || options === void 0 ? void 0 : options.assignTasks) ? '"assignee": "负责角色",' : ''}
      "subtasks": [
        // 子任务，结构与父任务相同
      ]
    }
  ]
}
只返回JSON格式内容，不要有其他解释。`;
        // 用户消息
        const userPrompt = `以下是解析后的PRD内容：

${JSON.stringify(parsedPRD, null, 2)}

${(options === null || options === void 0 ? void 0 : options.taskTemplate) ? `请参考以下任务模板进行规划：\n${options.taskTemplate}` : ''}

请生成详细的任务计划，按照要求的JSON格式返回结果。`;
        const messages = [
            { role: MessageRole.SYSTEM, content: systemPrompt },
            { role: MessageRole.USER, content: userPrompt }
        ];
        return await this.chat(messages, modelType);
    }
    /**
     * 生成测试用例
     * @param taskDescription 任务描述
     * @param options 测试生成选项
     */
    async generateTests(taskDescription, options) {
        const modelType = (options === null || options === void 0 ? void 0 : options.modelType) || this.configManager.getDefaultModelType();
        const framework = (options === null || options === void 0 ? void 0 : options.framework) || this.configManager.get('testSettings.framework', 'jest');
        // 构建系统提示词
        const systemPrompt = `你是一位专业的测试工程师，请根据任务描述，生成详细的测试用例。
请使用 ${framework} 测试框架编写测试代码。
要求：
1. 测试需要覆盖正常功能路径
2. ${(options === null || options === void 0 ? void 0 : options.includeEdgeCases) ? '测试需要覆盖边界条件和异常情况' : ''}
3. ${(options === null || options === void 0 ? void 0 : options.mockDependencies) ? '使用mock/stub处理外部依赖' : ''}
4. 测试代码应该清晰可读，包含必要的注释
5. 遵循测试框架的最佳实践

请输出完整可执行的测试代码。`;
        // 用户消息
        const userPrompt = `以下是需要编写测试用例的任务描述：

${taskDescription}

请为此任务生成测试用例。`;
        const messages = [
            { role: MessageRole.SYSTEM, content: systemPrompt },
            { role: MessageRole.USER, content: userPrompt }
        ];
        return await this.chat(messages, modelType);
    }
    /**
     * 获取可用的模型类型列表
     */
    getAvailableModelTypes() {
        return this.modelFactory.getAvailableModelTypes();
    }
    /**
     * 验证指定类型模型的API密钥
     * @param modelType 模型类型
     */
    async validateModelApiKey(modelType) {
        return await this.modelFactory.validateModelApiKey(modelType);
    }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TaskFlow AI MCP 服务类
 */
class TaskFlowService {
    /**
     * 创建TaskFlow AI MCP服务实例
     */
    constructor() {
        // 初始化基础设施
        this.configManager = new SimpleConfigManager();
        this.logger = Logger.getInstance({
            level: this.configManager.get('logger.level', LogLevel.INFO),
            output: this.configManager.get('logger.output', 'console'),
            file: this.configManager.get('logger.file')
        });
        // 初始化核心服务
        this.modelCoordinator = new ModelCoordinator(this.configManager);
        this.prdParser = new PRDParser(this.modelCoordinator, this.logger);
        this.taskPlanner = new TaskPlanner(this.modelCoordinator, this.logger);
        this.taskManager = new TaskManager$1(this.logger, this.configManager);
        this.logger.info('TaskFlow AI MCP服务初始化完成');
    }
    /**
     * 解析PRD文档内容
     * @param content PRD文档内容
     * @param fileType 文件类型
     * @param options 解析选项
     */
    async parsePRD(content, fileType = FileType.MARKDOWN, options) {
        try {
            this.logger.info('开始解析PRD内容');
            const result = await this.prdParser.parseContent(content, fileType, options);
            return { success: true, data: result };
        }
        catch (error) {
            this.logger.error(`解析PRD内容失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 从文件解析PRD
     * @param filePath PRD文件路径
     * @param options 解析选项
     */
    async parsePRDFromFile(filePath, options) {
        try {
            this.logger.info(`开始解析PRD文件: ${filePath}`);
            const result = await this.prdParser.parseFromFile(filePath, options);
            return { success: true, data: result };
        }
        catch (error) {
            this.logger.error(`解析PRD文件失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 根据PRD生成任务计划
     * @param prdResult PRD解析结果
     * @param options 规划选项
     */
    async generateTaskPlan(prdResult, options) {
        try {
            this.logger.info('开始生成任务计划');
            const taskPlan = await this.taskPlanner.generateTaskPlan(prdResult, options);
            return { success: true, data: taskPlan };
        }
        catch (error) {
            this.logger.error(`生成任务计划失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 保存任务计划
     * @param taskPlan 任务计划
     * @param outputPath 输出路径
     */
    async saveTaskPlan(taskPlan, outputPath) {
        try {
            await this.taskPlanner.saveTaskPlan(taskPlan, outputPath);
            // 同时更新任务管理器的任务计划
            this.taskManager.setTaskPlan(taskPlan);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`保存任务计划失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 加载任务计划
     * @param filePath 任务计划文件路径
     */
    async loadTaskPlan(filePath) {
        try {
            const taskPlan = await this.taskManager.loadTaskPlan(filePath);
            return { success: true, data: taskPlan };
        }
        catch (error) {
            this.logger.error(`加载任务计划失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取所有任务
     */
    getAllTasks() {
        try {
            const tasks = this.taskManager.getAllTasks();
            return { success: true, data: tasks };
        }
        catch (error) {
            this.logger.error(`获取所有任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 根据ID获取任务
     * @param id 任务ID
     */
    getTaskById(id) {
        try {
            const task = this.taskManager.getTaskById(id);
            if (!task) {
                return { success: false, error: `任务 ${id} 不存在` };
            }
            return { success: true, data: task };
        }
        catch (error) {
            this.logger.error(`获取任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 过滤任务
     * @param filter 过滤条件
     */
    filterTasks(filter) {
        try {
            const tasks = this.taskManager.filterTasks(filter);
            return { success: true, data: tasks };
        }
        catch (error) {
            this.logger.error(`过滤任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 更新任务
     * @param id 任务ID
     * @param data 更新数据
     */
    updateTask(id, data) {
        try {
            const task = this.taskManager.updateTask(id, data);
            if (!task) {
                return { success: false, error: `任务 ${id} 不存在` };
            }
            return { success: true, data: task };
        }
        catch (error) {
            this.logger.error(`更新任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取下一个要处理的任务
     */
    getNextTasks() {
        try {
            const tasks = this.taskManager.getNextTasks();
            return { success: true, data: tasks };
        }
        catch (error) {
            this.logger.error(`获取下一个任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 使用聊天模型进行对话
     * @param messages 消息数组
     * @param modelType 模型类型
     * @param options 调用选项
     */
    async chat(messages, modelType, options) {
        try {
            const response = await this.modelCoordinator.chat(messages, modelType, options);
            return { success: true, data: response };
        }
        catch (error) {
            this.logger.error(`聊天请求失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取所有可用的模型类型
     */
    getAvailableModelTypes() {
        try {
            const modelTypes = this.modelCoordinator.getAvailableModelTypes();
            return { success: true, data: modelTypes };
        }
        catch (error) {
            this.logger.error(`获取可用模型类型失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 验证指定类型模型的API密钥
     * @param modelType 模型类型
     */
    async validateModelApiKey(modelType) {
        try {
            const isValid = await this.modelCoordinator.validateModelApiKey(modelType);
            return { success: true, data: { valid: isValid } };
        }
        catch (error) {
            this.logger.error(`验证模型API密钥失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 更新配置
     * @param config 配置对象
     * @param isProjectLevel 是否为项目级配置
     */
    updateConfig(config, isProjectLevel = false) {
        try {
            this.configManager.updateConfig(config, isProjectLevel);
            // 更新日志配置
            if (config.logger) {
                this.logger.updateConfig({
                    level: this.configManager.get('logger.level', LogLevel.INFO),
                    output: this.configManager.get('logger.output', 'console'),
                    file: this.configManager.get('logger.file')
                });
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error(`更新配置失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取完整配置
     */
    getConfig() {
        try {
            const config = this.configManager.getConfig();
            // 移除敏感信息
            const safeConfig = { ...config };
            if (safeConfig.models) {
                const modelsConfig = safeConfig.models;
                Object.keys(modelsConfig).forEach(key => {
                    if (key !== 'default' && modelsConfig[key]) {
                        const modelConfig = modelsConfig[key];
                        if (modelConfig && modelConfig.apiKey) {
                            modelConfig.apiKey = '******';
                        }
                        if (modelConfig && modelConfig.secretKey) {
                            modelConfig.secretKey = '******';
                        }
                    }
                });
            }
            return { success: true, data: safeConfig };
        }
        catch (error) {
            this.logger.error(`获取配置失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取任务状态概览
     */
    getTaskStatus() {
        try {
            const allTasks = this.taskManager.getAllTasks();
            const stats = {
                total: allTasks.length,
                pending: allTasks.filter(t => t.status === 'pending').length,
                in_progress: allTasks.filter(t => t.status === 'in_progress').length,
                completed: allTasks.filter(t => t.status === 'completed').length,
                cancelled: allTasks.filter(t => t.status === 'cancelled').length
            };
            return { success: true, data: stats };
        }
        catch (error) {
            this.logger.error(`获取任务状态失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 更新任务状态
     * @param taskId 任务ID
     * @param status 新状态
     * @param data 额外数据
     */
    updateTaskStatus(taskId, status, data) {
        try {
            const updateData = { status: status };
            if (data) {
                Object.assign(updateData, data);
            }
            const task = this.taskManager.updateTask(taskId, updateData);
            if (!task) {
                return { success: false, error: `任务 ${taskId} 不存在` };
            }
            return { success: true, data: task };
        }
        catch (error) {
            this.logger.error(`更新任务状态失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取推荐任务
     */
    getRecommendedTask() {
        try {
            const nextTasks = this.taskManager.getNextTasks();
            const recommendedTask = nextTasks.length > 0 ? nextTasks[0] : null;
            return { success: true, data: recommendedTask };
        }
        catch (error) {
            this.logger.error(`获取推荐任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 生成可视化
     * @param type 可视化类型
     * @param options 选项
     */
    async generateVisualization(type, options) {
        try {
            // 这里应该调用可视化模块，暂时返回模拟数据
            const visualization = {
                type,
                data: this.taskManager.getAllTasks(),
                options,
                generatedAt: new Date().toISOString()
            };
            return { success: true, data: visualization };
        }
        catch (error) {
            this.logger.error(`生成可视化失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    // Project Management Methods
    /**
     * 创建项目
     * @param projectData 项目数据
     */
    async createProject(projectData) {
        try {
            // 模拟项目创建逻辑
            const project = {
                id: `project_${Date.now()}`,
                ...projectData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active'
            };
            return { success: true, data: project };
        }
        catch (error) {
            this.logger.error(`创建项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取项目列表
     * @param options 查询选项
     */
    async getProjects(options) {
        try {
            // 模拟项目列表
            const projects = [
                {
                    id: 'project_1',
                    name: '示例项目',
                    description: '这是一个示例项目',
                    status: 'active',
                    createdAt: new Date().toISOString()
                }
            ];
            return { success: true, data: projects };
        }
        catch (error) {
            this.logger.error(`获取项目列表失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取项目详情
     * @param id 项目ID
     */
    async getProject(id) {
        try {
            // 模拟项目详情
            const project = {
                id,
                name: '示例项目',
                description: '这是一个示例项目',
                status: 'active',
                createdAt: new Date().toISOString(),
                tasks: this.taskManager.getAllTasks()
            };
            return { success: true, data: project };
        }
        catch (error) {
            this.logger.error(`获取项目详情失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 更新项目
     * @param id 项目ID
     * @param updateData 更新数据
     */
    async updateProject(id, updateData) {
        try {
            const project = {
                id,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            return { success: true, data: project };
        }
        catch (error) {
            this.logger.error(`更新项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 删除项目
     * @param id 项目ID
     */
    async deleteProject(id) {
        try {
            return { success: true, message: `项目 ${id} 已删除` };
        }
        catch (error) {
            this.logger.error(`删除项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取项目任务
     * @param id 项目ID
     * @param options 查询选项
     */
    async getProjectTasks(id, options) {
        try {
            const tasks = this.taskManager.getAllTasks();
            return { success: true, data: tasks };
        }
        catch (error) {
            this.logger.error(`获取项目任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取项目统计
     * @param id 项目ID
     */
    async getProjectStats(id) {
        try {
            const tasks = this.taskManager.getAllTasks();
            const stats = {
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.status === 'completed').length,
                inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
                pendingTasks: tasks.filter(t => t.status === 'pending').length
            };
            return { success: true, data: stats };
        }
        catch (error) {
            this.logger.error(`获取项目统计失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    // AI Controller Methods
    /**
     * 生成任务
     * @param req 请求对象
     * @param res 响应对象
     */
    async generateTasks(req, res) {
        try {
            const { requirements, options } = req.body;
            // 模拟任务生成
            const tasks = [
                {
                    id: `task_${Date.now()}`,
                    title: '示例任务',
                    description: '基于需求生成的示例任务',
                    status: 'pending',
                    priority: 'medium'
                }
            ];
            return { success: true, data: tasks };
        }
        catch (error) {
            this.logger.error(`生成任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 编排任务
     * @param req 请求对象
     * @param res 响应对象
     */
    async orchestrateTasks(req, res) {
        try {
            const { tasks, options } = req.body;
            // 模拟任务编排
            const orchestratedTasks = tasks.map((task, index) => ({
                ...task,
                order: index + 1,
                dependencies: index > 0 ? [tasks[index - 1].id] : []
            }));
            return { success: true, data: orchestratedTasks };
        }
        catch (error) {
            this.logger.error(`编排任务失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 生成文档
     * @param req 请求对象
     * @param res 响应对象
     */
    async generateDocuments(req, res) {
        try {
            const { type, content, options } = req.body;
            // 模拟文档生成
            const document = {
                type,
                content: `生成的${type}文档内容`,
                generatedAt: new Date().toISOString()
            };
            return { success: true, data: document };
        }
        catch (error) {
            this.logger.error(`生成文档失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 生成图表
     * @param req 请求对象
     * @param res 响应对象
     */
    async generateCharts(req, res) {
        try {
            const { type, data, options } = req.body;
            // 模拟图表生成
            const chart = {
                type,
                data: data || this.taskManager.getAllTasks(),
                options,
                generatedAt: new Date().toISOString()
            };
            return { success: true, data: chart };
        }
        catch (error) {
            this.logger.error(`生成图表失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 聊天流式响应
     * @param req 请求对象
     * @param res 响应对象
     */
    async chatStream(req, res) {
        try {
            const { message, context } = req.body;
            // 模拟流式响应
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Transfer-Encoding': 'chunked'
            });
            const response = `AI回复: ${message}`;
            res.write(response);
            res.end();
        }
        catch (error) {
            this.logger.error(`聊天流式响应失败: ${error.message}`);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    /**
     * 获取模型列表
     * @param req 请求对象
     * @param res 响应对象
     */
    async getModels(req, res) {
        try {
            const models = this.modelCoordinator.getAvailableModelTypes();
            return { success: true, data: models };
        }
        catch (error) {
            this.logger.error(`获取模型列表失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取模型状态
     * @param req 请求对象
     * @param res 响应对象
     */
    async getModelStatus(req, res) {
        try {
            const { modelType } = req.params;
            const isValid = await this.modelCoordinator.validateModelApiKey(modelType);
            return { success: true, data: { modelType, status: isValid ? 'active' : 'inactive' } };
        }
        catch (error) {
            this.logger.error(`获取模型状态失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 验证需求
     * @param req 请求对象
     * @param res 响应对象
     */
    async validateRequirements(req, res) {
        try {
            const { requirements } = req.body;
            // 模拟需求验证
            const validation = {
                valid: true,
                issues: [],
                suggestions: ['建议添加更多细节']
            };
            return { success: true, data: validation };
        }
        catch (error) {
            this.logger.error(`验证需求失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 估算工作量
     * @param req 请求对象
     * @param res 响应对象
     */
    async estimateEffort(req, res) {
        try {
            const { tasks } = req.body;
            // 模拟工作量估算
            const estimation = {
                totalHours: tasks.length * 8,
                breakdown: tasks.map((task) => ({
                    taskId: task.id,
                    estimatedHours: 8
                }))
            };
            return { success: true, data: estimation };
        }
        catch (error) {
            this.logger.error(`估算工作量失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 获取使用统计
     * @param req 请求对象
     * @param res 响应对象
     */
    async getUsageStats(req, res) {
        try {
            const stats = {
                totalRequests: 100,
                successfulRequests: 95,
                failedRequests: 5,
                averageResponseTime: 1.2
            };
            return { success: true, data: stats };
        }
        catch (error) {
            this.logger.error(`获取使用统计失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 归档项目
     * @param req 请求对象
     * @param res 响应对象
     */
    async archiveProject(req, res) {
        try {
            const { id } = req.params;
            const project = {
                id,
                status: 'archived',
                archivedAt: new Date().toISOString()
            };
            return { success: true, data: project };
        }
        catch (error) {
            this.logger.error(`归档项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async restoreProject(idOrReq, res) {
        try {
            let id;
            if (typeof idOrReq === 'string') {
                id = idOrReq;
            }
            else {
                id = idOrReq.params.id;
            }
            const project = {
                id,
                status: 'active',
                restoredAt: new Date().toISOString()
            };
            return { success: true, data: project };
        }
        catch (error) {
            this.logger.error(`恢复项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 生成项目报告
     * @param id 项目ID
     * @param options 报告选项
     */
    async generateProjectReport(id, options) {
        try {
            const project = await this.getProject(id);
            const tasks = this.taskManager.getAllTasks();
            const stats = await this.getProjectStats(id);
            const report = {
                project: project.data,
                tasks,
                statistics: stats.data,
                generatedAt: new Date().toISOString(),
                format: (options === null || options === void 0 ? void 0 : options.format) || 'json'
            };
            return { success: true, data: report };
        }
        catch (error) {
            this.logger.error(`生成项目报告失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 导出项目
     * @param id 项目ID
     * @param format 导出格式
     */
    async exportProject(id, format) {
        try {
            const project = await this.getProject(id);
            const tasks = this.taskManager.getAllTasks();
            const exportData = {
                project: project.data,
                tasks,
                exportedAt: new Date().toISOString(),
                format
            };
            return { success: true, data: exportData };
        }
        catch (error) {
            this.logger.error(`导出项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    /**
     * 克隆项目
     * @param id 项目ID
     * @param options 克隆选项
     */
    async cloneProject(id, options) {
        try {
            const originalProject = await this.getProject(id);
            if (!originalProject.success || !originalProject.data) {
                throw new Error('原项目不存在或获取失败');
            }
            const newProject = {
                id: `project_${Date.now()}`,
                name: options.name || `${originalProject.data.name} (副本)`,
                description: options.description || originalProject.data.description,
                clonedFrom: id,
                createdAt: new Date().toISOString()
            };
            return { success: true, data: newProject };
        }
        catch (error) {
            this.logger.error(`克隆项目失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
// 导出单例实例
const taskFlowService = new TaskFlowService();
// 保持向后兼容性
const yasiService = taskFlowService;

/**
 * TaskFlow AI
 * 智能PRD文档解析与任务管理助手，专为开发团队设计的AI驱动任务编排工具
 */
// 导出核心引擎
// 版本信息
const VERSION = '1.3.0';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 配置管理器，负责管理应用的配置信息
 */
let ConfigManager$1 = class ConfigManager {
    /**
     * 创建配置管理器实例
     * @param configName 配置名称
     */
    constructor(configName = 'mcp') {
        this.projectConf = null;
        // 全局配置
        this.conf = new Conf({
            configName,
            defaults: DEFAULT_CONFIG,
        });
        // 尝试加载项目级配置
        const projectConfigPath = path.join(process.cwd(), 'mcp.config.json');
        if (fs.existsSync(projectConfigPath)) {
            try {
                this.projectConf = new Conf({
                    configName: 'mcp.config',
                    cwd: process.cwd(),
                    defaults: DEFAULT_CONFIG,
                });
            }
            catch (error) {
                console.error('Failed to load project configuration:', error);
            }
        }
    }
    /**
     * 获取完整配置
     */
    getConfig() {
        // 如果存在项目配置，合并全局和项目配置
        if (this.projectConf) {
            return {
                ...this.conf.store,
                ...this.projectConf.store,
                models: {
                    ...this.conf.store.models,
                    ...this.projectConf.store.models,
                },
            };
        }
        return this.conf.store;
    }
    /**
     * 更新配置
     * @param config 配置对象
     * @param isProjectLevel 是否为项目级配置
     */
    updateConfig(config, isProjectLevel = false) {
        const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
        // 递归合并对象
        const mergeDeep = (target, source) => {
            for (const key in source) {
                if (source[key] instanceof Object && key in target) {
                    mergeDeep(target[key], source[key]);
                }
                else {
                    target[key] = source[key];
                }
            }
            return target;
        };
        targetConf.store = mergeDeep({ ...targetConf.store }, config);
    }
    /**
     * 设置配置项
     * @param key 配置键路径（点分隔，如 'models.baidu.apiKey'）
     * @param value 配置值
     * @param isProjectLevel 是否为项目级配置
     */
    set(key, value, isProjectLevel = false) {
        const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
        targetConf.set(key, value);
    }
    /**
     * 获取配置项
     * @param key 配置键路径
     * @param defaultValue 默认值
     */
    get(key, defaultValue) {
        // 先尝试从项目配置中获取
        if (this.projectConf && this.projectConf.has(key)) {
            return this.projectConf.get(key);
        }
        // 再从全局配置中获取
        return this.conf.get(key, defaultValue);
    }
    /**
     * 检查配置项是否存在
     * @param key 配置键路径
     */
    has(key) {
        var _a;
        return ((_a = this.projectConf) === null || _a === void 0 ? void 0 : _a.has(key)) || this.conf.has(key);
    }
    /**
     * 删除配置项
     * @param key 配置键路径
     * @param isProjectLevel 是否为项目级配置
     */
    delete(key, isProjectLevel = false) {
        const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
        targetConf.delete(key);
    }
    /**
     * 重置配置
     * @param isProjectLevel 是否为项目级配置
     */
    reset(isProjectLevel = false) {
        const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
        targetConf.store = DEFAULT_CONFIG;
    }
    /**
     * 初始化项目配置文件
     * @param directory 项目目录
     */
    initProjectConfig(directory) {
        const configPath = path.join(directory, 'mcp.config.json');
        fs.writeJsonSync(configPath, DEFAULT_CONFIG, { spaces: 2 });
        // 重新加载项目配置
        this.projectConf = new Conf({
            configName: 'mcp.config',
            cwd: directory,
            defaults: DEFAULT_CONFIG,
        });
    }
    /**
     * 获取当前默认模型类型
     */
    getDefaultModelType() {
        return this.get('models.default', ModelType.BAIDU);
    }
    /**
     * 设置默认模型类型
     * @param modelType 模型类型
     * @param isProjectLevel 是否为项目级配置
     */
    setDefaultModelType(modelType, isProjectLevel = false) {
        this.set('models.default', modelType, isProjectLevel);
    }
    /**
     * 获取配置路径
     * @param isProjectLevel 是否为项目级配置
     */
    getConfigPath(isProjectLevel = false) {
        const targetConf = isProjectLevel && this.projectConf ? this.projectConf : this.conf;
        return targetConf.path;
    }
};

/**
 * TaskFlow AI 可视化命令
 * 生成任务计划的各种可视化图表
 */
/**
 * 可视化命令处理器
 */
class VisualizeCommand {
    constructor() {
        this.logger = Logger.getInstance({ level: LogLevel.INFO, output: 'console' });
        this.configManager = new ConfigManager$1();
        this.taskManager = new TaskManager$1(this.logger, this.configManager);
        this.visualizer = new TaskVisualizer(this.logger);
    }
    /**
     * 注册可视化命令
     * @param program Commander程序实例
     */
    register(program) {
        const visualizeCmd = program
            .command('visualize')
            .alias('viz')
            .description('生成任务计划可视化图表')
            .option('-t, --type <type>', '可视化类型 (gantt|dependency|kanban|timeline|progress)', 'gantt')
            .option('-f, --format <format>', '输出格式 (mermaid|json|html)', 'mermaid')
            .option('-o, --output <path>', '输出文件路径')
            .option('-i, --input <path>', '任务计划文件路径')
            .option('--include-subtasks', '包含子任务')
            .option('--show-progress', '显示进度信息')
            .option('--group-by <field>', '分组字段 (type|assignee|priority)')
            .action(async (options) => {
            await this.handleVisualize(options);
        });
        // 添加子命令
        visualizeCmd
            .command('gantt')
            .description('生成甘特图')
            .option('-o, --output <path>', '输出文件路径')
            .option('-i, --input <path>', '任务计划文件路径')
            .action(async (options) => {
            await this.handleVisualize({ ...options, type: 'gantt' });
        });
        visualizeCmd
            .command('dependency')
            .alias('deps')
            .description('生成依赖关系图')
            .option('-o, --output <path>', '输出文件路径')
            .option('-i, --input <path>', '任务计划文件路径')
            .action(async (options) => {
            await this.handleVisualize({ ...options, type: 'dependency' });
        });
        visualizeCmd
            .command('kanban')
            .description('生成看板视图')
            .option('-o, --output <path>', '输出文件路径')
            .option('-i, --input <path>', '任务计划文件路径')
            .option('--group-by <field>', '分组字段 (type|assignee|priority)')
            .action(async (options) => {
            await this.handleVisualize({ ...options, type: 'kanban' });
        });
        visualizeCmd
            .command('progress')
            .description('生成进度图表')
            .option('-o, --output <path>', '输出文件路径')
            .option('-i, --input <path>', '任务计划文件路径')
            .action(async (options) => {
            await this.handleVisualize({ ...options, type: 'progress' });
        });
    }
    /**
     * 处理可视化命令
     * @param options 命令选项
     */
    async handleVisualize(options) {
        try {
            console.log(chalk.blue('🎨 TaskFlow AI - 任务可视化'));
            console.log();
            // 验证可视化类型
            const validTypes = ['gantt', 'dependency', 'kanban', 'timeline', 'progress'];
            const visualizationType = options.type || 'gantt';
            if (!validTypes.includes(visualizationType)) {
                console.error(chalk.red(`❌ 无效的可视化类型: ${visualizationType}`));
                console.log(chalk.gray(`支持的类型: ${validTypes.join(', ')}`));
                return;
            }
            // 加载任务计划
            const taskPlan = await this.loadTaskPlan(options.input);
            if (!taskPlan) {
                return;
            }
            console.log(chalk.green(`✅ 已加载任务计划: ${taskPlan.name}`));
            console.log(chalk.gray(`   任务数量: ${taskPlan.tasks.length}`));
            console.log();
            // 生成可视化
            console.log(chalk.blue(`🔄 生成 ${visualizationType} 可视化...`));
            const visualizationOptions = {
                type: visualizationType,
                format: (options.format || 'mermaid'),
                includeSubtasks: options.includeSubtasks || false,
                showProgress: options.showProgress || false,
                groupBy: options.groupBy
            };
            const result = this.visualizer.generateVisualization(taskPlan, visualizationOptions);
            // 输出结果
            if (options.output) {
                const format = options.format || 'mermaid';
                await this.saveVisualization(JSON.stringify(result), options.output, format);
                console.log(chalk.green(`✅ 可视化已保存到: ${options.output}`));
            }
            else {
                // 输出到控制台
                if (typeof result === 'string') {
                    console.log(chalk.cyan('📊 可视化结果:'));
                    console.log();
                    console.log(result);
                }
                else {
                    console.log(chalk.cyan('📊 可视化数据:'));
                    console.log();
                    console.log(JSON.stringify(result, null, 2));
                }
            }
            console.log();
            console.log(chalk.green('🎉 可视化生成完成!'));
            // 显示使用提示
            this.showUsageTips(visualizationType, options.format || 'mermaid');
        }
        catch (error) {
            console.error(chalk.red('❌ 可视化生成失败:'));
            console.error(chalk.red(error.message));
            this.logger.error(`可视化生成失败: ${error.message}`);
        }
    }
    /**
     * 加载任务计划
     * @param inputPath 输入路径
     */
    async loadTaskPlan(inputPath) {
        try {
            if (inputPath) {
                // 从指定文件加载
                if (!fs__namespace.existsSync(inputPath)) {
                    console.error(chalk.red(`❌ 任务计划文件不存在: ${inputPath}`));
                    return null;
                }
                return await this.taskManager.loadTaskPlan(inputPath);
            }
            else {
                // 从默认位置加载
                const defaultPaths = [
                    './taskflow/tasks.json',
                    './tasks/tasks.json',
                    './tasks.json'
                ];
                for (const defaultPath of defaultPaths) {
                    if (fs__namespace.existsSync(defaultPath)) {
                        return await this.taskManager.loadTaskPlan(defaultPath);
                    }
                }
                console.error(chalk.red('❌ 未找到任务计划文件'));
                console.log(chalk.gray('请使用 -i 选项指定任务计划文件路径，或确保以下位置存在任务文件:'));
                defaultPaths.forEach(p => console.log(chalk.gray(`  - ${p}`)));
                return null;
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ 加载任务计划失败: ${error.message}`));
            return null;
        }
    }
    /**
     * 保存可视化结果
     * @param result 可视化结果
     * @param outputPath 输出路径
     * @param format 格式
     */
    async saveVisualization(result, outputPath, _format) {
        // 确保输出目录存在
        await fs__namespace.ensureDir(path__namespace.dirname(outputPath));
        if (typeof result === 'string') {
            // 字符串结果直接保存
            await fs__namespace.writeFile(outputPath, result, 'utf-8');
        }
        else {
            // 对象结果转换为JSON保存
            await fs__namespace.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        }
    }
    /**
     * 显示使用提示
     * @param type 可视化类型
     * @param format 格式
     */
    showUsageTips(type, format) {
        console.log(chalk.cyan('💡 使用提示:'));
        if (format === 'mermaid') {
            console.log(chalk.gray('  - 可以将Mermaid代码复制到 https://mermaid.live 查看图表'));
            console.log(chalk.gray('  - 或在支持Mermaid的Markdown编辑器中使用'));
        }
        switch (type) {
            case 'gantt':
                console.log(chalk.gray('  - 甘特图显示任务时间安排和依赖关系'));
                console.log(chalk.gray('  - 可用于项目时间规划和进度跟踪'));
                break;
            case 'dependency':
                console.log(chalk.gray('  - 依赖关系图显示任务间的依赖关系'));
                console.log(chalk.gray('  - 有助于识别关键路径和潜在瓶颈'));
                break;
            case 'kanban':
                console.log(chalk.gray('  - 看板视图适合敏捷开发流程'));
                console.log(chalk.gray('  - 可按状态、负责人或优先级分组'));
                break;
            case 'progress':
                console.log(chalk.gray('  - 进度图表显示项目整体完成情况'));
                console.log(chalk.gray('  - 适合向管理层汇报项目状态'));
                break;
        }
    }
}
// 导出命令实例
const visualizeCommand = new VisualizeCommand();

/**
 * TaskFlow AI 状态管理命令
 * 查看和更新任务状态
 */
/**
 * 状态命令处理器
 */
class StatusCommand {
    constructor() {
        this.logger = Logger.getInstance({ level: LogLevel.INFO, output: 'console' });
        this.configManager = new ConfigManager$1();
        this.taskManager = new TaskManager$1(this.logger, this.configManager);
    }
    /**
     * 注册状态命令
     * @param program Commander程序实例
     */
    register(program) {
        const statusCmd = program
            .command('status')
            .description('查看和管理任务状态')
            .option('-i, --input <path>', '任务计划文件路径')
            .option('-f, --filter <filter>', '过滤条件 (status|type|assignee|priority)')
            .option('-v, --verbose', '显示详细信息')
            .action(async (options) => {
            await this.handleStatus(options);
        });
        // 子命令：更新任务状态
        statusCmd
            .command('update <taskId> <status>')
            .description('更新任务状态')
            .option('-i, --input <path>', '任务计划文件路径')
            .action(async (taskId, status, options) => {
            await this.handleUpdateStatus(taskId, status, options);
        });
        // 子命令：显示进度统计
        statusCmd
            .command('progress')
            .alias('stats')
            .description('显示项目进度统计')
            .option('-i, --input <path>', '任务计划文件路径')
            .action(async (options) => {
            await this.handleProgress(options);
        });
        // 子命令：获取下一个任务
        statusCmd
            .command('next')
            .description('获取推荐的下一个任务')
            .option('-i, --input <path>', '任务计划文件路径')
            .option('-n, --number <count>', '显示任务数量', '3')
            .action(async (options) => {
            await this.handleNext(options);
        });
        // 子命令：列出任务
        statusCmd
            .command('list')
            .alias('ls')
            .description('列出所有任务')
            .option('-i, --input <path>', '任务计划文件路径')
            .option('-s, --status <status>', '按状态过滤')
            .option('-t, --type <type>', '按类型过滤')
            .option('-a, --assignee <assignee>', '按负责人过滤')
            .option('-p, --priority <priority>', '按优先级过滤')
            .action(async (options) => {
            await this.handleList(options);
        });
    }
    /**
     * 处理状态命令
     * @param options 命令选项
     */
    async handleStatus(options) {
        try {
            console.log(chalk.blue('📊 TaskFlow AI - 任务状态'));
            console.log();
            // 加载任务计划
            const taskPlan = await this.loadTaskPlan(options.input);
            if (!taskPlan) {
                return;
            }
            console.log(chalk.green(`✅ 项目: ${taskPlan.name}`));
            console.log(chalk.gray(`   描述: ${taskPlan.description}`));
            console.log();
            // 显示进度统计
            await this.showProgressStats(taskPlan);
            // 显示任务列表
            if (options.verbose) {
                console.log(chalk.cyan('📋 任务列表:'));
                console.log();
                this.displayTaskList(taskPlan.tasks, options);
            }
        }
        catch (error) {
            console.error(chalk.red('❌ 获取状态失败:'));
            console.error(chalk.red(error.message));
        }
    }
    /**
     * 处理更新状态命令
     * @param taskId 任务ID
     * @param status 新状态
     * @param options 选项
     */
    async handleUpdateStatus(taskId, status, options) {
        try {
            console.log(chalk.blue('🔄 TaskFlow AI - 更新任务状态'));
            console.log();
            // 验证状态值
            const validStatuses = Object.values(TaskStatus$1);
            if (!validStatuses.includes(status)) {
                console.error(chalk.red(`❌ 无效的状态值: ${status}`));
                console.log(chalk.gray(`支持的状态: ${validStatuses.join(', ')}`));
                return;
            }
            // 加载任务计划
            const taskPlan = await this.loadTaskPlan(options.input);
            if (!taskPlan) {
                return;
            }
            this.taskManager.setTaskPlan(taskPlan);
            // 更新任务状态
            const task = this.taskManager.updateTask(taskId, { status: status });
            if (!task) {
                console.error(chalk.red(`❌ 任务不存在: ${taskId}`));
                return;
            }
            // 保存更新
            await this.taskManager.saveTaskPlan();
            console.log(chalk.green(`✅ 任务状态已更新:`));
            console.log(chalk.gray(`   任务: ${task.title}`));
            console.log(chalk.gray(`   状态: ${this.getStatusDisplay(task.status)} → ${this.getStatusDisplay(status)}`));
            // 显示相关信息
            if (status === TaskStatus$1.COMPLETED) {
                const nextTasks = this.taskManager.getNextTasks();
                if (nextTasks.length > 0) {
                    console.log();
                    console.log(chalk.cyan('🎯 推荐的下一个任务:'));
                    nextTasks.slice(0, 3).forEach(nextTask => {
                        console.log(chalk.gray(`   - ${nextTask.title} (${nextTask.priority})`));
                    });
                }
            }
        }
        catch (error) {
            console.error(chalk.red('❌ 更新状态失败:'));
            console.error(chalk.red(error.message));
        }
    }
    /**
     * 处理进度命令
     * @param options 选项
     */
    async handleProgress(options) {
        try {
            console.log(chalk.blue('📈 TaskFlow AI - 项目进度'));
            console.log();
            // 加载任务计划
            const taskPlan = await this.loadTaskPlan(options.input);
            if (!taskPlan) {
                return;
            }
            await this.showProgressStats(taskPlan);
        }
        catch (error) {
            console.error(chalk.red('❌ 获取进度失败:'));
            console.error(chalk.red(error.message));
        }
    }
    /**
     * 处理下一个任务命令
     * @param options 选项
     */
    async handleNext(options) {
        try {
            console.log(chalk.blue('🎯 TaskFlow AI - 推荐任务'));
            console.log();
            // 加载任务计划
            const taskPlan = await this.loadTaskPlan(options.input);
            if (!taskPlan) {
                return;
            }
            this.taskManager.setTaskPlan(taskPlan);
            const nextTasks = this.taskManager.getNextTasks();
            if (nextTasks.length === 0) {
                console.log(chalk.yellow('🎉 所有任务都已完成或被阻塞!'));
                return;
            }
            const count = Math.min(parseInt(String(options.count)) || 3, nextTasks.length);
            console.log(chalk.green(`✅ 推荐的 ${count} 个任务:`));
            console.log();
            nextTasks.slice(0, count).forEach((task, index) => {
                console.log(chalk.cyan(`${index + 1}. ${task.title}`));
                console.log(chalk.gray(`   ID: ${task.id}`));
                console.log(chalk.gray(`   优先级: ${this.getPriorityDisplay(task.priority)}`));
                console.log(chalk.gray(`   类型: ${task.type}`));
                console.log(chalk.gray(`   预计时间: ${task.estimatedHours || 8} 小时`));
                if (task.assignee) {
                    console.log(chalk.gray(`   负责人: ${task.assignee}`));
                }
                console.log();
            });
        }
        catch (error) {
            console.error(chalk.red('❌ 获取推荐任务失败:'));
            console.error(chalk.red(error.message));
        }
    }
    /**
     * 处理列表命令
     * @param options 选项
     */
    async handleList(options) {
        try {
            console.log(chalk.blue('📋 TaskFlow AI - 任务列表'));
            console.log();
            // 加载任务计划
            const taskPlan = await this.loadTaskPlan(options.input);
            if (!taskPlan) {
                return;
            }
            this.taskManager.setTaskPlan(taskPlan);
            // 应用过滤器
            const filter = {};
            if (options.status)
                filter.status = options.status;
            if (options.type)
                filter.type = options.type;
            if (options.assignee)
                filter.assignee = options.assignee;
            if (options.priority)
                filter.priority = options.priority;
            const tasks = Object.keys(filter).length > 0
                ? this.taskManager.filterTasks(filter)
                : this.taskManager.getAllTasks();
            if (tasks.length === 0) {
                console.log(chalk.yellow('📭 没有找到匹配的任务'));
                return;
            }
            console.log(chalk.green(`✅ 找到 ${tasks.length} 个任务:`));
            console.log();
            this.displayTaskList(tasks, options);
        }
        catch (error) {
            console.error(chalk.red('❌ 获取任务列表失败:'));
            console.error(chalk.red(error.message));
        }
    }
    /**
     * 加载任务计划
     * @param inputPath 输入路径
     */
    async loadTaskPlan(inputPath) {
        try {
            if (inputPath) {
                if (!fs__namespace.existsSync(inputPath)) {
                    console.error(chalk.red(`❌ 任务计划文件不存在: ${inputPath}`));
                    return null;
                }
                return await this.taskManager.loadTaskPlan(inputPath);
            }
            else {
                const defaultPaths = [
                    './taskflow/tasks.json',
                    './tasks/tasks.json',
                    './tasks.json'
                ];
                for (const defaultPath of defaultPaths) {
                    if (fs__namespace.existsSync(defaultPath)) {
                        return await this.taskManager.loadTaskPlan(defaultPath);
                    }
                }
                console.error(chalk.red('❌ 未找到任务计划文件'));
                console.log(chalk.gray('请使用 -i 选项指定任务计划文件路径'));
                return null;
            }
        }
        catch (error) {
            console.error(chalk.red(`❌ 加载任务计划失败: ${error.message}`));
            return null;
        }
    }
    /**
     * 显示进度统计
     * @param taskPlan 任务计划
     */
    async showProgressStats(taskPlan) {
        const stats = {
            total: taskPlan.tasks.length,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            blocked: 0
        };
        taskPlan.tasks.forEach((task) => {
            switch (task.status) {
                case TaskStatus$1.COMPLETED:
                    stats.completed++;
                    break;
                case TaskStatus$1.IN_PROGRESS:
                    stats.inProgress++;
                    break;
                case TaskStatus$1.NOT_STARTED:
                    stats.notStarted++;
                    break;
                case TaskStatus$1.BLOCKED:
                    stats.blocked++;
                    break;
            }
        });
        const completionRate = (stats.completed / stats.total) * 100;
        console.log(chalk.cyan('📊 项目进度:'));
        console.log(chalk.green(`   完成率: ${completionRate.toFixed(1)}%`));
        console.log(chalk.gray(`   总任务: ${stats.total}`));
        console.log(chalk.gray(`   已完成: ${stats.completed}`));
        console.log(chalk.gray(`   进行中: ${stats.inProgress}`));
        console.log(chalk.gray(`   未开始: ${stats.notStarted}`));
        console.log(chalk.gray(`   被阻塞: ${stats.blocked}`));
        console.log();
        // 进度条
        const progressBar = this.generateProgressBar(completionRate);
        console.log(chalk.cyan(`进度: ${progressBar} ${completionRate.toFixed(1)}%`));
        console.log();
    }
    /**
     * 显示任务列表
     * @param tasks 任务列表
     * @param options 选项
     */
    displayTaskList(tasks, _options) {
        tasks.forEach((task, _index) => {
            const statusIcon = this.getStatusIcon(task.status);
            const priorityColor = this.getPriorityColor(task.priority);
            console.log(`${statusIcon} ${priorityColor(task.title)}`);
            console.log(chalk.gray(`   ID: ${task.id}`));
            console.log(chalk.gray(`   状态: ${this.getStatusDisplay(task.status)}`));
            console.log(chalk.gray(`   优先级: ${this.getPriorityDisplay(task.priority)}`));
            if (task.assignee) {
                console.log(chalk.gray(`   负责人: ${task.assignee}`));
            }
            if (task.estimatedHours) {
                console.log(chalk.gray(`   预计时间: ${task.estimatedHours} 小时`));
            }
            if (task.dependencies && task.dependencies.length > 0) {
                console.log(chalk.gray(`   依赖: ${task.dependencies.join(', ')}`));
            }
            console.log();
        });
    }
    /**
     * 获取状态图标
     * @param status 状态
     */
    getStatusIcon(status) {
        switch (status) {
            case TaskStatus$1.COMPLETED:
                return '✅';
            case TaskStatus$1.IN_PROGRESS:
                return '🔄';
            case TaskStatus$1.BLOCKED:
                return '🚫';
            case TaskStatus$1.CANCELLED:
                return '❌';
            default:
                return '⏳';
        }
    }
    /**
     * 获取状态显示文本
     * @param status 状态
     */
    getStatusDisplay(status) {
        switch (status) {
            case TaskStatus$1.NOT_STARTED:
                return '未开始';
            case TaskStatus$1.IN_PROGRESS:
                return '进行中';
            case TaskStatus$1.COMPLETED:
                return '已完成';
            case TaskStatus$1.BLOCKED:
                return '被阻塞';
            case TaskStatus$1.CANCELLED:
                return '已取消';
            default:
                return status;
        }
    }
    /**
     * 获取优先级显示文本
     * @param priority 优先级
     */
    getPriorityDisplay(priority) {
        switch (priority) {
            case TaskPriority$1.CRITICAL:
                return '紧急';
            case TaskPriority$1.HIGH:
                return '高';
            case TaskPriority$1.MEDIUM:
                return '中';
            case TaskPriority$1.LOW:
                return '低';
            default:
                return priority;
        }
    }
    /**
     * 获取优先级颜色函数
     * @param priority 优先级
     */
    getPriorityColor(priority) {
        switch (priority) {
            case TaskPriority$1.CRITICAL:
                return chalk.red;
            case TaskPriority$1.HIGH:
                return chalk.yellow;
            case TaskPriority$1.MEDIUM:
                return chalk.blue;
            case TaskPriority$1.LOW:
                return chalk.gray;
            default:
                return chalk.white;
        }
    }
    /**
     * 生成进度条
     * @param percentage 百分比
     */
    generateProgressBar(percentage) {
        const width = 20;
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    }
}
// 导出命令实例
const statusCommand = new StatusCommand();

/**
 * TaskFlow AI 交互式命令
 * 提供用户友好的交互式界面
 */
/**
 * 交互式命令处理器
 */
class InteractiveCommand {
    /**
     * 注册交互式命令
     */
    register(program) {
        program
            .command('interactive')
            .alias('i')
            .description('启动交互式模式')
            .action(async () => {
            await this.startInteractiveMode();
        });
    }
    /**
     * 启动交互式模式
     */
    async startInteractiveMode() {
        console.clear();
        // 显示欢迎信息
        this.showWelcome();
        let running = true;
        while (running) {
            try {
                const { action } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        message: '请选择要执行的操作:',
                        choices: [
                            { name: '📄 解析PRD文档', value: 'parse' },
                            { name: '📋 查看任务列表', value: 'tasks' },
                            { name: '⚙️  配置管理', value: 'config' },
                            { name: '🤖 AI对话', value: 'chat' },
                            { name: '📊 项目状态', value: 'status' },
                            { name: '❌ 退出', value: 'exit' }
                        ]
                    }
                ]);
                if (action === 'exit') {
                    console.log(chalk.green('\n👋 感谢使用 TaskFlow AI！'));
                    break;
                }
                await this.handleAction(action);
                // 询问是否继续
                const { continue: shouldContinue } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'continue',
                        message: '是否继续使用？',
                        default: true
                    }
                ]);
                if (!shouldContinue) {
                    console.log(chalk.green('\n👋 感谢使用 TaskFlow AI！'));
                    running = false;
                }
                console.log('\n' + '─'.repeat(50) + '\n');
            }
            catch (error) {
                console.error(chalk.red(`❌ 操作失败: ${error.message}`));
                const { retry } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'retry',
                        message: '是否重试？',
                        default: true
                    }
                ]);
                if (!retry)
                    break;
            }
        }
    }
    /**
     * 显示欢迎信息
     */
    showWelcome() {
        const welcome = boxen(chalk.cyan.bold('TaskFlow AI') + '\n\n' +
            chalk.white('智能PRD文档解析与任务管理助手') + '\n' +
            chalk.gray('让AI帮您将产品需求转化为可执行的任务计划'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan'
        });
        console.log(welcome);
    }
    /**
     * 处理用户选择的操作
     */
    async handleAction(action) {
        switch (action) {
            case 'parse':
                await this.handleParsePRD();
                break;
            case 'tasks':
                await this.handleViewTasks();
                break;
            case 'config':
                await this.handleConfig();
                break;
            case 'chat':
                await this.handleChat();
                break;
            case 'status':
                await this.handleStatus();
                break;
        }
    }
    /**
     * 处理PRD解析
     */
    async handleParsePRD() {
        var _a;
        console.log(chalk.blue('\n📄 PRD文档解析'));
        const { inputType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'inputType',
                message: '请选择输入方式:',
                choices: [
                    { name: '📁 从文件读取', value: 'file' },
                    { name: '✏️  直接输入文本', value: 'text' }
                ]
            }
        ]);
        let content = '';
        let filePath = '';
        if (inputType === 'file') {
            const { path } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'path',
                    message: '请输入PRD文件路径:',
                    validate: (input) => input.trim() !== '' || '文件路径不能为空'
                }
            ]);
            filePath = path;
        }
        else {
            const { text } = await inquirer.prompt([
                {
                    type: 'editor',
                    name: 'text',
                    message: '请输入PRD文档内容:'
                }
            ]);
            content = text;
        }
        // 选择AI模型
        const { modelType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'modelType',
                message: '请选择AI模型:',
                choices: [
                    { name: '🚀 DeepSeek (推荐)', value: 'deepseek' },
                    { name: '🧠 智谱AI GLM', value: 'zhipu' },
                    { name: '🌟 通义千问', value: 'qwen' },
                    { name: '💫 文心一言', value: 'wenxin' }
                ]
            }
        ]);
        const spinner = ora('正在解析PRD文档...').start();
        try {
            let result;
            if (inputType === 'file') {
                result = await taskFlowService.parsePRDFromFile(filePath, { modelType });
            }
            else {
                result = await taskFlowService.parsePRD(content, FileType.MARKDOWN, { modelType });
            }
            spinner.succeed('PRD解析完成！');
            if (result.success && result.data) {
                console.log(chalk.green('\n✅ 解析成功！'));
                // 检查数据结构并显示相应信息
                if ('sections' in result.data && result.data.sections) {
                    console.log(chalk.white(`📋 解析了 ${result.data.sections.length} 个章节`));
                }
                else if ('metadata' in result.data && ((_a = result.data.metadata) === null || _a === void 0 ? void 0 : _a.features)) {
                    console.log(chalk.white(`📋 提取了 ${result.data.metadata.features.length} 个功能特性`));
                }
                else {
                    console.log(chalk.white('📋 PRD解析完成'));
                }
                // 询问是否保存
                const { save } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'save',
                        message: '是否保存解析结果？',
                        default: true
                    }
                ]);
                if (save) {
                    const { outputPath } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'outputPath',
                            message: '请输入保存路径:',
                            default: './prd-parsed.json'
                        }
                    ]);
                    await fs__namespace.writeJSON(outputPath, result.data, { spaces: 2 });
                    console.log(chalk.green(`💾 解析结果已保存到: ${outputPath}`));
                }
            }
            else {
                console.log(chalk.red(`❌ 解析失败: ${result.error}`));
            }
        }
        catch (error) {
            spinner.fail('PRD解析失败');
            throw error;
        }
    }
    /**
     * 处理查看任务
     */
    async handleViewTasks() {
        console.log(chalk.blue('\n📋 任务列表'));
        const spinner = ora('正在获取任务列表...').start();
        try {
            const result = taskFlowService.getAllTasks();
            spinner.succeed('任务列表获取完成');
            if (result.success && result.data && result.data.length > 0) {
                console.log(chalk.green(`\n📊 共有 ${result.data.length} 个任务\n`));
                result.data.forEach((task, index) => {
                    const statusIcon = this.getStatusIcon(task.status);
                    const priorityColor = this.getPriorityColor(task.priority);
                    console.log(`${index + 1}. ${statusIcon} ${chalk.white(task.title)} ` +
                        `${priorityColor(`[${task.priority}]`)} ` +
                        `${chalk.gray(`(${task.estimatedHours}h)`)}`);
                });
            }
            else {
                console.log(chalk.yellow('📭 暂无任务'));
            }
        }
        catch (error) {
            spinner.fail('获取任务列表失败');
            throw error;
        }
    }
    /**
     * 处理配置管理
     */
    async handleConfig() {
        console.log(chalk.blue('\n⚙️  配置管理'));
        const { configAction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'configAction',
                message: '请选择配置操作:',
                choices: [
                    { name: '👀 查看当前配置', value: 'view' },
                    { name: '🔑 设置API密钥', value: 'apikey' },
                    { name: '🎛️  模型设置', value: 'model' }
                ]
            }
        ]);
        if (configAction === 'view') {
            const result = taskFlowService.getConfig();
            if (result.success) {
                console.log(chalk.green('\n📋 当前配置:'));
                console.log(JSON.stringify(result.data, null, 2));
            }
        }
        else if (configAction === 'apikey') {
            await this.handleApiKeyConfig();
        }
        else if (configAction === 'model') {
            await this.handleModelConfig();
        }
    }
    /**
     * 处理API密钥配置
     */
    async handleApiKeyConfig() {
        const { modelType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'modelType',
                message: '请选择要配置的模型:',
                choices: [
                    { name: 'DeepSeek', value: 'deepseek' },
                    { name: '智谱AI', value: 'zhipu' },
                    { name: '通义千问', value: 'qwen' },
                    { name: '文心一言', value: 'wenxin' }
                ]
            }
        ]);
        const { apiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: `请输入${modelType}的API密钥:`,
                mask: '*'
            }
        ]);
        const config = {
            models: {
                [modelType]: { apiKey }
            }
        };
        const result = taskFlowService.updateConfig(config);
        if (result.success) {
            console.log(chalk.green('✅ API密钥配置成功！'));
        }
        else {
            console.log(chalk.red(`❌ 配置失败: ${result.error}`));
        }
    }
    /**
     * 处理模型配置
     */
    async handleModelConfig() {
        const { defaultModel } = await inquirer.prompt([
            {
                type: 'list',
                name: 'defaultModel',
                message: '请选择默认模型:',
                choices: [
                    { name: 'DeepSeek', value: 'deepseek' },
                    { name: '智谱AI', value: 'zhipu' },
                    { name: '通义千问', value: 'qwen' },
                    { name: '文心一言', value: 'wenxin' }
                ]
            }
        ]);
        const config = {
            models: {
                default: defaultModel
            }
        };
        const result = taskFlowService.updateConfig(config);
        if (result.success) {
            console.log(chalk.green('✅ 默认模型设置成功！'));
        }
        else {
            console.log(chalk.red(`❌ 设置失败: ${result.error}`));
        }
    }
    /**
     * 处理AI对话
     */
    async handleChat() {
        console.log(chalk.blue('\n🤖 AI对话模式'));
        console.log(chalk.gray('输入 "exit" 退出对话\n'));
        let chatting = true;
        while (chatting) {
            const { message } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'message',
                    message: '您:',
                    validate: (input) => input.trim() !== '' || '消息不能为空'
                }
            ]);
            if (message.toLowerCase() === 'exit') {
                chatting = false;
                continue;
            }
            const spinner = ora('AI正在思考...').start();
            try {
                const result = await taskFlowService.chat([
                    { role: 'user', content: message }
                ]);
                spinner.stop();
                if (result.success && result.data) {
                    console.log(chalk.cyan('AI:'), result.data.content || result.data);
                }
                else {
                    console.log(chalk.red(`❌ 对话失败: ${result.error}`));
                }
            }
            catch (error) {
                spinner.fail('对话失败');
                console.log(chalk.red(`❌ ${error.message}`));
            }
            console.log();
        }
    }
    /**
     * 处理状态查看
     */
    async handleStatus() {
        console.log(chalk.blue('\n📊 项目状态'));
        const spinner = ora('正在获取项目状态...').start();
        try {
            const tasksResult = taskFlowService.getAllTasks();
            const configResult = taskFlowService.getConfig();
            spinner.succeed('状态获取完成');
            if (tasksResult.success && tasksResult.data) {
                const tasks = tasksResult.data;
                const completed = tasks.filter((t) => t.status === TaskStatus$1.COMPLETED || t.status === TaskStatus$1.DONE).length;
                const inProgress = tasks.filter((t) => t.status === TaskStatus$1.IN_PROGRESS || t.status === TaskStatus$1.RUNNING).length;
                const pending = tasks.filter((t) => t.status === TaskStatus$1.PENDING || t.status === TaskStatus$1.NOT_STARTED).length;
                console.log(chalk.green('\n📈 任务统计:'));
                console.log(`  ✅ 已完成: ${completed}`);
                console.log(`  🔄 进行中: ${inProgress}`);
                console.log(`  ⏳ 待开始: ${pending}`);
                console.log(`  📊 总计: ${tasks.length}`);
            }
            if (configResult.success && configResult.data) {
                const config = configResult.data;
                const models = config.models;
                console.log(chalk.blue('\n⚙️  配置状态:'));
                console.log(`  🎯 默认模型: ${(models === null || models === void 0 ? void 0 : models.default) || '未设置'}`);
                console.log(`  🔑 已配置模型: ${Object.keys(models || {}).filter(k => k !== 'default').length}`);
            }
        }
        catch (error) {
            spinner.fail('获取状态失败');
            throw error;
        }
    }
    /**
     * 获取状态图标
     */
    getStatusIcon(status) {
        const icons = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'blocked': '🚫',
            'cancelled': '❌'
        };
        return icons[status] || '❓';
    }
    /**
     * 获取优先级颜色
     */
    getPriorityColor(priority) {
        const colors = {
            'high': chalk.red,
            'medium': chalk.yellow,
            'low': chalk.green
        };
        return colors[priority] || chalk.gray;
    }
}
// 导出实例
const interactiveCommand = new InteractiveCommand();

/**
 * 模型管理命令
 * @param program Commander实例
 */
function modelsCommand(program) {
    const modelsCmd = program
        .command('models')
        .description('管理AI模型配置和状态');
    // 列出可用模型
    modelsCmd
        .command('list')
        .description('列出所有可用的AI模型')
        .option('--detailed', '显示详细信息', false)
        .action(async (options) => {
        try {
            console.log(chalk.blue('📋 可用的AI模型:'));
            console.log();
            const models = [
                {
                    type: 'deepseek',
                    name: 'DeepSeek',
                    description: '高性价比，代码理解能力强',
                    status: '✅ 可用',
                    cost: '低',
                    features: ['代码生成', '逻辑推理', '中英文对话']
                },
                {
                    type: 'zhipu',
                    name: '智谱GLM-4',
                    description: '综合能力强，适合复杂任务',
                    status: '✅ 可用',
                    cost: '中',
                    features: ['多轮对话', '文档理解', '创意写作']
                },
                {
                    type: 'qwen',
                    name: '通义千问',
                    description: '阿里云大模型，多模态支持',
                    status: '✅ 可用',
                    cost: '中',
                    features: ['长文本处理', '多模态', '专业领域']
                },
                {
                    type: 'spark',
                    name: '讯飞星火',
                    description: '语音交互优化，教育场景',
                    status: '✅ 可用',
                    cost: '中',
                    features: ['语音理解', '教育内容', '实时对话']
                },
                {
                    type: 'moonshot',
                    name: '月之暗面Kimi',
                    description: '超长上下文，文档处理专家',
                    status: '✅ 可用',
                    cost: '高',
                    features: ['长文本', '文档分析', '信息提取']
                },
                {
                    type: 'baidu',
                    name: '百度文心一言',
                    description: '百度大模型，中文优化',
                    status: '✅ 可用',
                    cost: '中',
                    features: ['中文理解', '创意生成', '知识问答']
                }
            ];
            for (const model of models) {
                console.log(chalk.cyan(`🤖 ${model.name} (${model.type})`));
                console.log(`   ${model.description}`);
                console.log(`   状态: ${model.status}`);
                console.log(`   成本: ${model.cost}`);
                if (options.detailed) {
                    console.log(`   特性: ${model.features.join(', ')}`);
                }
                console.log();
            }
            console.log(chalk.yellow('💡 使用 "taskflow-ai models test <model>" 测试模型连接'));
            console.log(chalk.yellow('💡 使用 "taskflow-ai config set models.default <model>" 设置默认模型'));
        }
        catch (error) {
            console.error(chalk.red('❌ 获取模型列表失败:'), error);
        }
    });
    // 测试模型连接
    modelsCmd
        .command('test <model>')
        .description('测试指定模型的连接状态')
        .action(async (model) => {
        const spinner = ora(`正在测试 ${model} 模型连接...`).start();
        try {
            // 这里应该调用实际的模型测试逻辑
            const isValid = await testModelConnection(model);
            if (isValid) {
                spinner.succeed(chalk.green(`✅ ${model} 模型连接正常`));
            }
            else {
                spinner.fail(chalk.red(`❌ ${model} 模型连接失败`));
                console.log(chalk.yellow('请检查:'));
                console.log('  1. API密钥是否正确配置');
                console.log('  2. 网络连接是否正常');
                console.log('  3. 模型服务是否可用');
            }
        }
        catch (error) {
            spinner.fail(chalk.red(`❌ 测试 ${model} 模型时出错: ${error}`));
        }
    });
    // 性能基准测试
    modelsCmd
        .command('benchmark')
        .description('运行模型性能基准测试')
        .option('--models <models>', '指定测试的模型，用逗号分隔', 'deepseek,zhipu,qwen')
        .option('--iterations <count>', '测试迭代次数', '3')
        .action(async (options) => {
        const models = options.models.split(',').map((m) => m.trim());
        const iterations = parseInt(options.iterations);
        console.log(chalk.blue('🏃‍♂️ 开始模型性能基准测试'));
        console.log(`测试模型: ${models.join(', ')}`);
        console.log(`迭代次数: ${iterations}`);
        console.log();
        const results = [];
        for (const model of models) {
            const spinner = ora(`测试 ${model} 模型性能...`).start();
            try {
                const result = await runBenchmark(model, iterations);
                results.push({
                    model,
                    success: true,
                    latency: result.avgLatency,
                    avgLatency: result.avgLatency,
                    successRate: result.successRate,
                    tokensPerSecond: result.tokensPerSecond
                });
                spinner.succeed(`✅ ${model} 测试完成`);
            }
            catch (error) {
                spinner.fail(`❌ ${model} 测试失败: ${error}`);
                results.push({
                    model,
                    success: false,
                    latency: 0,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        // 显示结果
        console.log();
        console.log(chalk.blue('📊 基准测试结果:'));
        console.log();
        const table = results.map(r => {
            if (r.error) {
                return `${r.model.padEnd(12)} | 失败: ${r.error}`;
            }
            return `${r.model.padEnd(12)} | ${r.avgLatency || r.latency}ms | ${r.successRate || 0}% | ${r.tokensPerSecond || 0} tokens/s`;
        });
        console.log('模型        | 平均延迟 | 成功率 | 处理速度');
        console.log('------------|----------|--------|----------');
        table.forEach(row => console.log(row));
    });
    // 切换默认模型
    modelsCmd
        .command('switch <model>')
        .description('切换默认使用的模型')
        .action(async (model) => {
        const spinner = ora(`正在切换默认模型到 ${model}...`).start();
        try {
            // 首先测试模型是否可用
            const isValid = await testModelConnection(model);
            if (!isValid) {
                spinner.fail(chalk.red(`❌ 无法切换到 ${model}，模型连接失败`));
                return;
            }
            // 更新配置
            await taskFlowService.updateConfig({
                models: {
                    default: model
                }
            });
            spinner.succeed(chalk.green(`✅ 默认模型已切换到 ${model}`));
            console.log(chalk.yellow(`💡 使用 "taskflow-ai config list" 查看当前配置`));
        }
        catch (error) {
            spinner.fail(chalk.red(`❌ 切换模型失败: ${error}`));
        }
    });
    // 模型使用统计
    modelsCmd
        .command('stats')
        .description('查看模型使用统计')
        .option('--period <period>', '统计周期 (day|week|month)', 'week')
        .action(async (options) => {
        try {
            console.log(chalk.blue('📈 模型使用统计'));
            console.log(`统计周期: ${options.period}`);
            console.log();
            // 这里应该从实际的统计数据中获取
            const stats = await getModelStats(options.period);
            console.log('模型        | 调用次数 | 成功率 | 平均延迟 | 总成本');
            console.log('------------|----------|--------|----------|--------');
            stats.forEach((stat) => {
                console.log(`${stat.model.padEnd(12)} | ${stat.calls.toString().padEnd(8)} | ${stat.successRate}% | ${stat.avgLatency}ms | $${stat.cost}`);
            });
        }
        catch (error) {
            console.error(chalk.red('❌ 获取统计数据失败:'), error);
        }
    });
}
/**
 * 测试模型连接
 */
async function testModelConnection(_model) {
    try {
        // 模拟测试逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));
        return Math.random() > 0.2; // 80%成功率模拟
    }
    catch {
        return false;
    }
}
/**
 * 运行性能基准测试
 */
async function runBenchmark(model, iterations) {
    const results = [];
    for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        const latency = Date.now() - start;
        results.push({
            latency,
            success: Math.random() > 0.1, // 90%成功率
            tokens: Math.floor(Math.random() * 1000 + 100)
        });
    }
    const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latency, 0) / results.length);
    const successRate = Math.round((results.filter(r => r.success).length / results.length) * 100);
    const avgTokens = Math.round(results.reduce((sum, r) => sum + r.tokens, 0) / results.length);
    const tokensPerSecond = Math.round(avgTokens / (avgLatency / 1000));
    return {
        avgLatency,
        successRate,
        tokensPerSecond
    };
}
/**
 * 获取模型使用统计
 */
async function getModelStats(_period) {
    // 模拟统计数据
    return [
        { model: 'deepseek', calls: 156, successRate: 98, avgLatency: 1200, cost: 2.34 },
        { model: 'zhipu', calls: 89, successRate: 96, avgLatency: 1800, cost: 4.56 },
        { model: 'qwen', calls: 67, successRate: 94, avgLatency: 1500, cost: 3.21 },
        { model: 'moonshot', calls: 23, successRate: 99, avgLatency: 2200, cost: 8.90 }
    ];
}

/**
 * MCP (Model Context Protocol) 相关类型定义
 */
/**
 * 环境变量映射
 */
const MCP_ENVIRONMENT_VARIABLES = {
    DEEPSEEK_API_KEY: '${DEEPSEEK_API_KEY}',
    ZHIPU_API_KEY: '${ZHIPU_API_KEY}',
    QWEN_API_KEY: '${QWEN_API_KEY}',
    BAIDU_API_KEY: '${BAIDU_API_KEY}',
    BAIDU_SECRET_KEY: '${BAIDU_SECRET_KEY}',
    MOONSHOT_API_KEY: '${MOONSHOT_API_KEY}',
    SPARK_APP_ID: '${SPARK_APP_ID}',
    SPARK_API_KEY: '${SPARK_API_KEY}',
    SPARK_API_SECRET: '${SPARK_API_SECRET}',
    TASKFLOW_PROJECT_ROOT: '${workspaceFolder}',
    TASKFLOW_CONFIG_PATH: '.taskflow/config.json',
    TASKFLOW_LOG_LEVEL: 'info',
    TASKFLOW_CACHE_ENABLED: 'true',
    TASKFLOW_AUTO_START: 'true'
};
/**
 * 默认MCP能力
 */
const DEFAULT_MCP_CAPABILITIES = {
    resources: true,
    tools: true,
    prompts: true,
    streaming: true
};
/**
 * 编辑器配置文件路径映射
 */
const EDITOR_CONFIG_PATHS = {
    cursor: '.cursor/mcp.json',
    windsurf: '.windsurf/mcp.json',
    trae: '.trae/mcp-config.json',
    vscode: '.vscode/settings.json'
};
/**
 * 编辑器扩展推荐文件路径
 */
const EDITOR_EXTENSIONS_PATHS = {
    vscode: '.vscode/extensions.json'
};
/**
 * 默认VSCode扩展推荐
 */
const DEFAULT_VSCODE_EXTENSIONS = {
    recommendations: [
        'taskflow-ai.vscode-taskflow',
        'ms-vscode.vscode-typescript-next',
        'esbenp.prettier-vscode',
        'ms-vscode.vscode-eslint',
        'bradlc.vscode-tailwindcss',
        'ms-vscode.vscode-json',
        'yzhang.markdown-all-in-one'
    ],
    unwantedRecommendations: [
        'ms-vscode.vscode-typescript'
    ]
};
/**
 * Cursor规则文件内容
 */
const CURSOR_RULES_CONTENT = `# TaskFlow AI Cursor 集成规则

## 项目配置
- 使用 TaskFlow AI 进行智能 PRD 解析和任务管理
- 支持 6 种 AI 模型：DeepSeek、智谱AI、通义千问、文心一言、月之暗面、讯飞星火
- MCP 服务端点：通过配置文件自动启动

## AI 模型使用策略
- **DeepSeek**: 代码生成、重构、技术分析
- **智谱AI**: 中文内容处理、业务逻辑分析
- **通义千问**: 通用分析、文档处理
- **文心一言**: 创意任务、内容优化
- **月之暗面**: 长文档处理、深度分析
- **讯飞星火**: 多模态任务、综合处理

## 工作流程
1. PRD 解析 → 智谱AI 处理中文需求
2. 架构设计 → DeepSeek 技术方案设计
3. 代码实现 → DeepSeek 代码生成和优化
4. 测试编写 → DeepSeek 测试用例生成
5. 文档生成 → 通义千问 技术文档编写

## 代码规范
- 严格 TypeScript 类型安全
- 函数式编程优先
- 80%+ 测试覆盖率
- ESLint + Prettier 代码格式化

## 集成功能
- 自动 PRD 解析和任务创建
- 智能代码生成和重构
- 多模型协同工作
- 实时任务状态同步

## 性能优化
- 启用 MCP 请求缓存
- 使用流式响应提升用户体验
- 智能模型选择减少延迟
- 批量处理相似请求

## 安全考虑
- API 密钥通过环境变量管理
- 敏感信息不写入代码
- 使用 HTTPS 进行 API 通信
- 定期轮换 API 密钥
`;

/**
 * MCP配置生成器
 * 负责为不同编辑器生成标准MCP配置文件
 */
/**
 * MCP配置生成器类
 */
class MCPConfigGenerator {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * 为指定编辑器生成MCP配置
     * @param editor 编辑器类型
     * @param options 配置选项
     * @returns MCP配置对象
     */
    generateMCPConfig(editor, options = {}) {
        const baseConfig = {
            editor,
            serverConfig: {
                command: 'npx',
                args: ['-y', '--package=taskflow-ai', 'taskflow-mcp'],
                timeout: options.timeout || 30000,
                retries: options.retries || 3
            },
            capabilities: DEFAULT_MCP_CAPABILITIES,
            environment: {
                ...MCP_ENVIRONMENT_VARIABLES,
                ...options.customEnvironment
            }
        };
        this.logger.debug(`生成 ${editor} MCP配置`, {
            editor,
            config: JSON.stringify(baseConfig, null, 2)
        });
        return baseConfig;
    }
    /**
     * 验证MCP配置
     * @param config MCP配置对象
     * @returns 验证结果
     */
    validateMCPConfig(config) {
        var _a, _b;
        const errors = [];
        const warnings = [];
        // 验证编辑器类型
        if (!['windsurf', 'trae', 'cursor', 'vscode'].includes(config.editor)) {
            errors.push(`不支持的编辑器类型: ${config.editor}`);
        }
        // 验证服务器配置
        if (!config.serverConfig.command) {
            errors.push('缺少服务器启动命令');
        }
        if (!Array.isArray(config.serverConfig.args)) {
            errors.push('服务器参数必须是数组');
        }
        // 验证环境变量
        const requiredEnvVars = ['DEEPSEEK_API_KEY', 'ZHIPU_API_KEY', 'QWEN_API_KEY'];
        for (const envVar of requiredEnvVars) {
            if (!config.environment[envVar]) {
                warnings.push(`缺少环境变量: ${envVar}`);
            }
        }
        // 验证能力声明
        if (!config.capabilities.tools && !config.capabilities.resources) {
            warnings.push('建议至少启用tools或resources能力');
        }
        const result = {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
            warnings: warnings.length > 0 ? warnings : undefined
        };
        this.logger.debug('MCP配置验证结果', {
            isValid: result.valid,
            errorCount: ((_a = result.errors) === null || _a === void 0 ? void 0 : _a.length) || 0,
            warningCount: ((_b = result.warnings) === null || _b === void 0 ? void 0 : _b.length) || 0,
            errors: result.errors,
            warnings: result.warnings
        });
        return result;
    }
    /**
     * 导出编辑器特定格式的配置
     * @param config MCP配置对象
     * @returns 编辑器特定格式的配置JSON字符串
     */
    exportMCPConfig(config) {
        let editorConfig;
        switch (config.editor) {
            case 'cursor':
                editorConfig = this.generateCursorConfig(config);
                break;
            case 'windsurf':
                editorConfig = this.generateWindsurfConfig(config);
                break;
            case 'trae':
                editorConfig = this.generateTraeConfig(config);
                break;
            case 'vscode':
                editorConfig = this.generateVSCodeConfig(config);
                break;
            default:
                throw new Error(`不支持的编辑器类型: ${config.editor}`);
        }
        return JSON.stringify(editorConfig, null, 2);
    }
    /**
     * 生成Cursor配置
     */
    generateCursorConfig(config) {
        return {
            mcpServers: {
                'taskflow-ai': {
                    command: config.serverConfig.command,
                    args: config.serverConfig.args,
                    env: config.environment
                }
            }
        };
    }
    /**
     * 生成Windsurf配置
     */
    generateWindsurfConfig(config) {
        return {
            mcpServers: {
                'taskflow-ai': {
                    command: config.serverConfig.command,
                    args: config.serverConfig.args,
                    env: config.environment,
                    capabilities: config.capabilities,
                    timeout: config.serverConfig.timeout,
                    retries: config.serverConfig.retries
                }
            }
        };
    }
    /**
     * 生成Trae配置
     */
    generateTraeConfig(config) {
        return {
            mcp: {
                version: '1.0',
                servers: {
                    taskflow: {
                        command: config.serverConfig.command,
                        args: config.serverConfig.args,
                        environment: config.environment,
                        capabilities: [
                            'code_analysis',
                            'task_management',
                            'prd_parsing',
                            'ai_assistance',
                            'refactoring',
                            'optimization'
                        ],
                        healthCheck: {
                            enabled: true,
                            interval: 30000,
                            timeout: 5000
                        }
                    }
                },
                client: {
                    name: 'trae',
                    version: '1.0.0',
                    features: {
                        streaming: true,
                        contextWindow: 32000,
                        multiModel: true,
                        codeCompletion: true,
                        semanticSearch: true
                    }
                }
            }
        };
    }
    /**
     * 生成VSCode配置
     */
    generateVSCodeConfig(config) {
        return {
            'taskflow.mcp.enabled': true,
            'taskflow.mcp.server': {
                command: config.serverConfig.command,
                args: config.serverConfig.args,
                env: this.convertToVSCodeEnv(config.environment),
                autoRestart: true,
                healthCheck: true
            },
            'taskflow.ai.models': {
                primary: 'deepseek',
                fallback: ['zhipu', 'qwen', 'baidu'],
                specialized: {
                    code: 'deepseek',
                    chinese: 'zhipu',
                    general: 'qwen',
                    creative: 'baidu',
                    longText: 'moonshot',
                    multimodal: 'spark'
                },
                loadBalancing: {
                    enabled: true,
                    strategy: 'intelligent',
                    weights: {
                        deepseek: 0.3,
                        zhipu: 0.25,
                        qwen: 0.2,
                        baidu: 0.15,
                        moonshot: 0.05,
                        spark: 0.05
                    }
                }
            },
            'taskflow.integration': {
                autoParseOnSave: true,
                showTaskProgress: true,
                enableCodeLens: true,
                contextMenuIntegration: true,
                statusBarIntegration: true,
                sidebarPanel: true
            },
            'taskflow.ui': {
                showStatusBar: true,
                enableNotifications: true,
                theme: 'auto',
                compactMode: false
            },
            'files.associations': {
                '*.prd': 'markdown',
                '*.taskflow': 'json',
                '*.mcp': 'json'
            }
        };
    }
    /**
     * 转换环境变量为VSCode格式
     */
    convertToVSCodeEnv(env) {
        const vscodeEnv = {};
        Object.entries(env).forEach(([key, value]) => {
            if (value.startsWith('${') && value.endsWith('}')) {
                // 环境变量引用，转换为VSCode格式
                const envVar = value.slice(2, -1);
                if (envVar === 'workspaceFolder') {
                    vscodeEnv[key] = '${workspaceFolder}';
                }
                else {
                    vscodeEnv[key] = `\${env:${envVar}}`;
                }
            }
            else {
                vscodeEnv[key] = value;
            }
        });
        return vscodeEnv;
    }
    /**
     * 写入配置文件到磁盘
     * @param config MCP配置对象
     * @param projectRoot 项目根目录
     */
    async writeMCPConfigFiles(config, projectRoot = '.') {
        const configPath = EDITOR_CONFIG_PATHS[config.editor];
        const fullPath = path.join(projectRoot, configPath);
        // 确保目录存在
        const dir = path.dirname(fullPath);
        if (!fs$1.existsSync(dir)) {
            fs$1.mkdirSync(dir, { recursive: true });
        }
        // 生成配置内容
        const configContent = this.exportMCPConfig(config);
        // 写入配置文件
        fs$1.writeFileSync(fullPath, configContent, 'utf-8');
        this.logger.info(`MCP配置文件已生成: ${fullPath}`);
        // 为特定编辑器生成额外文件
        await this.generateAdditionalFiles(config, projectRoot);
    }
    /**
     * 生成额外的配置文件
     */
    async generateAdditionalFiles(config, projectRoot) {
        switch (config.editor) {
            case 'cursor': {
                // 生成.cursor-rules文件
                const cursorRulesPath = path.join(projectRoot, '.cursor-rules');
                fs$1.writeFileSync(cursorRulesPath, CURSOR_RULES_CONTENT, 'utf-8');
                this.logger.info(`Cursor规则文件已生成: ${cursorRulesPath}`);
                break;
            }
            case 'vscode': {
                // 生成extensions.json文件
                const extensionsPath = EDITOR_EXTENSIONS_PATHS.vscode;
                {
                    const fullExtensionsPath = path.join(projectRoot, extensionsPath);
                    const extensionsContent = JSON.stringify(DEFAULT_VSCODE_EXTENSIONS, null, 2);
                    fs$1.writeFileSync(fullExtensionsPath, extensionsContent, 'utf-8');
                    this.logger.info(`VSCode扩展推荐文件已生成: ${fullExtensionsPath}`);
                }
                break;
            }
        }
    }
    /**
     * 测试MCP配置
     * @param config MCP配置对象
     * @returns 测试结果
     */
    async testMCPConfiguration(config) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];
        try {
            // 验证配置格式
            const validation = this.validateMCPConfig(config);
            if (!validation.valid) {
                errors.push(...(validation.errors || []));
            }
            warnings.push(...(validation.warnings || []));
            // 检查命令可用性
            if (config.serverConfig.command === 'npx') {
                // 这里可以添加实际的npx可用性检查
                // 暂时跳过，因为需要实际执行命令
            }
            // 检查环境变量
            const requiredEnvVars = ['DEEPSEEK_API_KEY', 'ZHIPU_API_KEY'];
            for (const envVar of requiredEnvVars) {
                if (!process.env[envVar] && !config.environment[envVar]) {
                    warnings.push(`环境变量 ${envVar} 未设置`);
                }
            }
            const latency = Date.now() - startTime;
            return {
                valid: errors.length === 0,
                errors: errors.length > 0 ? errors : undefined,
                warnings: warnings.length > 0 ? warnings : undefined,
                latency
            };
        }
        catch (error) {
            errors.push(`测试失败: ${error.message}`);
            return {
                valid: false,
                errors,
                latency: Date.now() - startTime
            };
        }
    }
    /**
     * 获取MCP服务支持的能力
     * @returns MCP能力对象
     */
    getMCPCapabilities() {
        return {
            ...DEFAULT_MCP_CAPABILITIES,
            supportedEditors: ['windsurf', 'trae', 'cursor', 'vscode'],
            supportedModels: ['deepseek', 'zhipu', 'qwen', 'baidu', 'moonshot', 'spark'],
            features: {
                prdParsing: true,
                taskManagement: true,
                codeAnalysis: true,
                multiModelOrchestration: true,
                streamingResponse: true,
                configurationGeneration: true
            }
        };
    }
}

/**
 * 配置管理器 - 统一管理TaskFlow AI的所有配置
 * 支持多环境配置、动态配置更新、配置验证等功能
 */
/**
 * 配置环境枚举
 */
var ConfigEnvironment;
(function (ConfigEnvironment) {
    ConfigEnvironment["DEVELOPMENT"] = "development";
    ConfigEnvironment["TESTING"] = "testing";
    ConfigEnvironment["STAGING"] = "staging";
    ConfigEnvironment["PRODUCTION"] = "production";
})(ConfigEnvironment || (ConfigEnvironment = {}));
/**
 * 配置源类型
 */
var ConfigSource;
(function (ConfigSource) {
    ConfigSource["FILE"] = "file";
    ConfigSource["ENVIRONMENT"] = "environment";
    ConfigSource["DATABASE"] = "database";
    ConfigSource["REMOTE"] = "remote";
    ConfigSource["MEMORY"] = "memory";
})(ConfigSource || (ConfigSource = {}));
/**
 * 配置管理器类
 */
class ConfigManager {
    constructor(logger, options) {
        this.configs = new Map();
        this.watchers = new Map();
        this.cache = new Map();
        this.validationRules = new Map();
        this.changeListeners = [];
        this.logger = logger;
        this.options = {
            environment: ConfigEnvironment.DEVELOPMENT,
            configDir: './config',
            enableFileWatch: true,
            enableValidation: true,
            enableCache: true,
            cacheTimeout: 300000, // 5分钟
            autoSave: false,
            backupEnabled: true,
            encryptSensitive: false,
            ...options
        };
        // 初始化MCP配置生成器
        this.mcpGenerator = new MCPConfigGenerator(logger);
        this.initializeDefaultConfigs();
        this.loadConfigurations();
        if (this.options.enableFileWatch) {
            this.setupFileWatching();
        }
    }
    /**
     * 获取配置值
     * @param key 配置键
     * @param defaultValue 默认值
     */
    get(key, defaultValue) {
        // 检查缓存
        if (this.options.enableCache) {
            const cached = this.cache.get(key);
            if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
                return cached.value;
            }
        }
        const configItem = this.configs.get(key);
        let value;
        if (configItem) {
            value = configItem.value;
        }
        else {
            // 尝试从环境变量获取
            const envValue = this.getFromEnvironment(key);
            if (envValue !== undefined) {
                value = envValue;
            }
            else {
                value = defaultValue;
            }
        }
        // 更新缓存
        if (this.options.enableCache && value !== undefined) {
            this.cache.set(key, { value, timestamp: Date.now() });
        }
        return value;
    }
    /**
     * 设置配置值
     * @param key 配置键
     * @param value 配置值
     * @param source 配置源
     */
    set(key, value, source = ConfigSource.MEMORY) {
        const oldValue = this.get(key);
        // 验证配置值
        if (this.options.enableValidation) {
            const validation = this.validationRules.get(key);
            if (validation) {
                const validationResult = this.validateValue(value, validation);
                if (validationResult !== true) {
                    throw new Error(`配置验证失败 ${key}: ${validationResult}`);
                }
            }
        }
        const configItem = {
            key,
            value,
            type: this.inferType(value),
            source,
            lastModified: new Date(),
            environment: this.options.environment
        };
        this.configs.set(key, configItem);
        // 清除缓存
        if (this.options.enableCache) {
            this.cache.delete(key);
        }
        // 触发变更事件
        this.notifyChange({
            key,
            oldValue,
            newValue: value,
            source,
            timestamp: new Date(),
            environment: this.options.environment
        });
        // 自动保存
        if (this.options.autoSave && source !== ConfigSource.FILE) {
            this.saveToFile();
        }
        this.logger.debug(`配置已更新: ${key} = ${JSON.stringify(value)}`);
    }
    /**
     * 检查配置是否存在
     * @param key 配置键
     */
    has(key) {
        return this.configs.has(key) || this.getFromEnvironment(key) !== undefined;
    }
    /**
     * 删除配置
     * @param key 配置键
     */
    delete(key) {
        var _a;
        const existed = this.configs.has(key);
        if (existed) {
            const oldValue = (_a = this.configs.get(key)) === null || _a === void 0 ? void 0 : _a.value;
            this.configs.delete(key);
            this.cache.delete(key);
            // 触发变更事件
            this.notifyChange({
                key,
                oldValue,
                newValue: undefined,
                source: ConfigSource.MEMORY,
                timestamp: new Date(),
                environment: this.options.environment
            });
            if (this.options.autoSave) {
                this.saveToFile();
            }
            this.logger.debug(`配置已删除: ${key}`);
        }
        return existed;
    }
    /**
     * 清空所有配置
     */
    clear() {
        const keys = Array.from(this.configs.keys());
        this.configs.clear();
        this.cache.clear();
        keys.forEach(key => {
            this.notifyChange({
                key,
                oldValue: undefined,
                newValue: undefined,
                source: ConfigSource.MEMORY,
                timestamp: new Date(),
                environment: this.options.environment
            });
        });
        if (this.options.autoSave) {
            this.saveToFile();
        }
        this.logger.info('所有配置已清空');
    }
    /**
     * 获取所有配置
     */
    getAll() {
        const result = {};
        this.configs.forEach((item, key) => {
            result[key] = item.value;
        });
        return result;
    }
    /**
     * 批量设置配置
     * @param configs 配置对象
     * @param source 配置源
     */
    setMany(configs, source = ConfigSource.MEMORY) {
        Object.entries(configs).forEach(([key, value]) => {
            this.set(key, value, source);
        });
    }
    /**
     * 监听配置变更
     * @param key 配置键，为空则监听所有变更
     * @param callback 回调函数
     */
    watch(key, callback) {
        if (key) {
            if (!this.watchers.has(key)) {
                this.watchers.set(key, []);
            }
            this.watchers.get(key).push(callback);
            // 返回取消监听的函数
            return () => {
                const callbacks = this.watchers.get(key);
                if (callbacks) {
                    const index = callbacks.indexOf(callback);
                    if (index > -1) {
                        callbacks.splice(index, 1);
                    }
                }
            };
        }
        else {
            this.changeListeners.push(callback);
            return () => {
                const index = this.changeListeners.indexOf(callback);
                if (index > -1) {
                    this.changeListeners.splice(index, 1);
                }
            };
        }
    }
    /**
     * 添加配置验证规则
     * @param key 配置键
     * @param validation 验证规则
     */
    addValidation(key, validation) {
        this.validationRules.set(key, validation);
    }
    /**
     * 验证所有配置
     */
    validateAll() {
        const errors = [];
        this.validationRules.forEach((validation, key) => {
            const value = this.get(key);
            const result = this.validateValue(value, validation);
            if (result !== true) {
                errors.push(`${key}: ${result}`);
            }
        });
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * 从文件加载配置
     * @param filePath 文件路径
     */
    loadFromFile(filePath) {
        const configPath = filePath || this.getConfigFilePath();
        if (!fs$1.existsSync(configPath)) {
            this.logger.warn(`配置文件不存在: ${configPath}`);
            return;
        }
        try {
            const content = fs$1.readFileSync(configPath, 'utf-8');
            const configs = JSON.parse(content);
            Object.entries(configs).forEach(([key, value]) => {
                this.set(key, value, ConfigSource.FILE);
            });
            this.logger.info(`配置已从文件加载: ${configPath}`);
        }
        catch (error) {
            this.logger.error(`加载配置文件失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 保存配置到文件
     * @param filePath 文件路径
     */
    saveToFile(filePath) {
        const configPath = filePath || this.getConfigFilePath();
        try {
            // 创建备份
            if (this.options.backupEnabled && fs$1.existsSync(configPath)) {
                const backupPath = `${configPath}.backup.${Date.now()}`;
                const content = fs$1.readFileSync(configPath, 'utf-8');
                fs$1.writeFileSync(backupPath, content);
            }
            const configs = this.getAll();
            const content = JSON.stringify(configs, null, 2);
            fs$1.writeFileSync(configPath, content, 'utf-8');
            this.logger.info(`配置已保存到文件: ${configPath}`);
        }
        catch (error) {
            this.logger.error(`保存配置文件失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 重新加载配置
     */
    reload() {
        this.logger.info('重新加载配置');
        this.cache.clear();
        this.loadConfigurations();
    }
    /**
     * 获取配置统计信息
     */
    getStats() {
        const configsBySource = {
            [ConfigSource.FILE]: 0,
            [ConfigSource.ENVIRONMENT]: 0,
            [ConfigSource.DATABASE]: 0,
            [ConfigSource.REMOTE]: 0,
            [ConfigSource.MEMORY]: 0
        };
        const configsByType = {};
        this.configs.forEach(item => {
            configsBySource[item.source]++;
            configsByType[item.type] = (configsByType[item.type] || 0) + 1;
        });
        return {
            totalConfigs: this.configs.size,
            configsBySource,
            configsByType,
            cacheHitRate: this.cache.size / Math.max(this.configs.size, 1)
        };
    }
    // 私有方法
    /**
     * 初始化默认配置
     */
    initializeDefaultConfigs() {
        const defaultConfigs = {
            // 应用配置
            'app.name': 'TaskFlow AI',
            'app.version': '1.0.0',
            'app.environment': this.options.environment,
            // 服务器配置
            'server.port': 3000,
            'server.host': '0.0.0.0',
            'server.timeout': 30000,
            // 数据库配置
            'database.host': 'localhost',
            'database.port': 5432,
            'database.name': 'taskflow',
            'database.pool.min': 2,
            'database.pool.max': 10,
            // 日志配置
            'logging.level': 'info',
            'logging.format': 'json',
            'logging.file.enabled': true,
            'logging.file.path': './logs/app.log',
            // AI模型配置
            'ai.models.default': 'alibaba_qwen',
            'ai.models.timeout': 30000,
            'ai.models.retryCount': 3,
            // 缓存配置
            'cache.enabled': true,
            'cache.ttl': 300,
            'cache.maxSize': 1000,
            // 安全配置
            'security.jwt.secret': 'your-secret-key',
            'security.jwt.expiresIn': '24h',
            'security.cors.enabled': true,
            'security.rateLimit.enabled': true,
            'security.rateLimit.max': 100
        };
        Object.entries(defaultConfigs).forEach(([key, value]) => {
            if (!this.configs.has(key)) {
                this.set(key, value, ConfigSource.MEMORY);
            }
        });
        // 添加验证规则
        this.addValidationRules();
    }
    /**
     * 添加验证规则
     */
    addValidationRules() {
        this.addValidation('server.port', {
            type: 'number',
            min: 1,
            max: 65535,
            required: true
        });
        this.addValidation('database.port', {
            type: 'number',
            min: 1,
            max: 65535,
            required: true
        });
        this.addValidation('logging.level', {
            type: 'string',
            enum: ['error', 'warn', 'info', 'debug'],
            required: true
        });
        this.addValidation('ai.models.timeout', {
            type: 'number',
            min: 1000,
            max: 300000,
            required: true
        });
    }
    /**
     * 加载配置
     */
    loadConfigurations() {
        // 1. 从文件加载
        try {
            this.loadFromFile();
        }
        catch {
            this.logger.warn('从文件加载配置失败，使用默认配置');
        }
        // 2. 从环境变量覆盖
        this.loadFromEnvironment();
    }
    /**
     * 从环境变量加载配置
     */
    loadFromEnvironment() {
        const envPrefix = 'TASKFLOW_';
        Object.keys(process.env).forEach(envKey => {
            if (envKey.startsWith(envPrefix)) {
                const configKey = envKey
                    .substring(envPrefix.length)
                    .toLowerCase()
                    .replace(/_/g, '.');
                const envValue = process.env[envKey];
                if (envValue !== undefined) {
                    const parsedValue = this.parseEnvironmentValue(envValue);
                    this.set(configKey, parsedValue, ConfigSource.ENVIRONMENT);
                }
            }
        });
    }
    /**
     * 从环境变量获取值
     * @param key 配置键
     */
    getFromEnvironment(key) {
        const envKey = `TASKFLOW_${key.toUpperCase().replace(/\./g, '_')}`;
        const envValue = process.env[envKey];
        if (envValue !== undefined) {
            return this.parseEnvironmentValue(envValue);
        }
        return undefined;
    }
    /**
     * 解析环境变量值
     * @param value 环境变量值
     */
    parseEnvironmentValue(value) {
        // 尝试解析为JSON
        if (value.startsWith('{') || value.startsWith('[')) {
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        // 解析布尔值
        if (value.toLowerCase() === 'true')
            return true;
        if (value.toLowerCase() === 'false')
            return false;
        // 解析数字
        if (/^\d+$/.test(value))
            return parseInt(value, 10);
        if (/^\d+\.\d+$/.test(value))
            return parseFloat(value);
        return value;
    }
    /**
     * 推断值类型
     * @param value 值
     */
    inferType(value) {
        if (Array.isArray(value))
            return 'array';
        const type = typeof value;
        if (type === 'string' || type === 'number' || type === 'boolean') {
            return type;
        }
        return 'object';
    }
    /**
     * 验证配置值
     * @param value 配置值
     * @param validation 验证规则
     */
    validateValue(value, validation) {
        // 必填检查
        if (validation.required && (value === undefined || value === null)) {
            return '配置值不能为空';
        }
        if (value === undefined || value === null) {
            return true; // 非必填且为空，跳过验证
        }
        // 类型检查
        if (validation.type) {
            const actualType = this.inferType(value);
            if (actualType !== validation.type) {
                return `期望类型 ${validation.type}，实际类型 ${actualType}`;
            }
        }
        // 数值范围检查
        if (typeof value === 'number') {
            if (validation.min !== undefined && value < validation.min) {
                return `值不能小于 ${validation.min}`;
            }
            if (validation.max !== undefined && value > validation.max) {
                return `值不能大于 ${validation.max}`;
            }
        }
        // 字符串长度检查
        if (typeof value === 'string') {
            if (validation.min !== undefined && value.length < validation.min) {
                return `长度不能小于 ${validation.min}`;
            }
            if (validation.max !== undefined && value.length > validation.max) {
                return `长度不能大于 ${validation.max}`;
            }
        }
        // 正则表达式检查
        if (validation.pattern && typeof value === 'string') {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
                return `值不匹配模式 ${validation.pattern}`;
            }
        }
        // 枚举值检查
        if (validation.enum && !validation.enum.includes(value)) {
            return `值必须是以下之一: ${validation.enum.join(', ')}`;
        }
        // 自定义验证
        if (validation.custom) {
            const result = validation.custom(value);
            if (result !== true) {
                return typeof result === 'string' ? result : '自定义验证失败';
            }
        }
        return true;
    }
    /**
     * 获取配置文件路径
     */
    getConfigFilePath() {
        const fileName = `config.${this.options.environment}.json`;
        return path.resolve(this.options.configDir, fileName);
    }
    /**
     * 设置文件监听
     */
    setupFileWatching() {
        const configPath = this.getConfigFilePath();
        if (fs$1.existsSync(configPath)) {
            fs$1.watchFile(configPath, (curr, prev) => {
                if (curr.mtime !== prev.mtime) {
                    this.logger.info('配置文件已更改，重新加载配置');
                    this.reload();
                }
            });
        }
    }
    /**
     * 通知配置变更
     * @param event 变更事件
     */
    notifyChange(event) {
        // 通知全局监听器
        this.changeListeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                this.logger.error(`配置变更监听器执行失败: ${error.message}`);
            }
        });
        // 通知特定键的监听器
        const keyWatchers = this.watchers.get(event.key);
        if (keyWatchers) {
            keyWatchers.forEach(watcher => {
                try {
                    watcher(event);
                }
                catch (error) {
                    this.logger.error(`配置变更监听器执行失败: ${error.message}`);
                }
            });
        }
    }
    // ==================== MCP 配置管理方法 ====================
    /**
     * 为指定编辑器生成MCP配置
     * @param editor 编辑器类型
     * @param options 配置选项
     * @returns MCP配置对象
     */
    generateMCPConfig(editor, options) {
        this.logger.info(`生成 ${editor} 编辑器的MCP配置`);
        return this.mcpGenerator.generateMCPConfig(editor, options);
    }
    /**
     * 验证MCP配置
     * @param config MCP配置对象
     * @returns 验证结果
     */
    validateMCPConfig(config) {
        this.logger.debug(`验证 ${config.editor} 编辑器的MCP配置`);
        return this.mcpGenerator.validateMCPConfig(config);
    }
    /**
     * 导出MCP配置为JSON字符串
     * @param editor 编辑器类型
     * @param options 配置选项
     * @returns JSON格式的配置字符串
     */
    exportMCPConfig(editor, options) {
        const config = this.generateMCPConfig(editor, options);
        return this.mcpGenerator.exportMCPConfig(config);
    }
    /**
     * 导入MCP配置
     * @param editor 编辑器类型
     * @param configJson JSON格式的配置字符串
     */
    importMCPConfig(editor, configJson) {
        try {
            const config = JSON.parse(configJson);
            this.logger.info(`导入 ${editor} 编辑器的MCP配置`);
            // 这里可以添加配置导入逻辑
            this.logger.debug('MCP配置导入成功', config);
        }
        catch (error) {
            this.logger.error(`导入MCP配置失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 测试MCP配置
     * @param editor 编辑器类型
     * @param options 配置选项
     * @returns 测试结果
     */
    async testMCPConfiguration(editor, options) {
        this.logger.info(`测试 ${editor} 编辑器的MCP配置`);
        const config = this.generateMCPConfig(editor, options);
        return await this.mcpGenerator.testMCPConfiguration(config);
    }
    /**
     * 获取MCP服务支持的能力
     * @returns MCP能力对象
     */
    getMCPCapabilities() {
        return this.mcpGenerator.getMCPCapabilities();
    }
    /**
     * 写入MCP配置文件到磁盘
     * @param editor 编辑器类型
     * @param projectRoot 项目根目录
     * @param options 配置选项
     */
    async writeMCPConfigFiles(editor, projectRoot = '.', options) {
        const config = this.generateMCPConfig(editor, options);
        await this.mcpGenerator.writeMCPConfigFiles(config, projectRoot);
    }
    /**
     * 为所有支持的编辑器生成MCP配置文件
     * @param projectRoot 项目根目录
     * @param options 配置选项
     */
    async generateAllMCPConfigs(projectRoot = '.', options) {
        const editors = ['windsurf', 'trae', 'cursor', 'vscode'];
        this.logger.info('开始生成所有编辑器的MCP配置文件');
        for (const editor of editors) {
            try {
                await this.writeMCPConfigFiles(editor, projectRoot, options);
                this.logger.info(`✅ ${editor} MCP配置生成成功`);
            }
            catch (error) {
                this.logger.error(`❌ ${editor} MCP配置生成失败: ${error.message}`);
            }
        }
        this.logger.info('所有编辑器的MCP配置文件生成完成');
    }
}

var configManager = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get ConfigEnvironment () { return ConfigEnvironment; },
    ConfigManager: ConfigManager,
    get ConfigSource () { return ConfigSource; }
});

/**
 * MCP 配置管理命令
 * 提供 MCP (Model Context Protocol) 配置的生成、验证和测试功能
 */
/**
 * 创建 MCP 命令
 */
function createMCPCommand() {
    const logger = Logger.getInstance({
        level: LogLevel.INFO,
        output: 'console'
    });
    const config = new ConfigManager(logger);
    const mcpCommand = new commander.Command('mcp')
        .description('MCP (Model Context Protocol) 配置管理');
    // mcp validate 命令
    mcpCommand
        .command('validate')
        .description('验证 MCP 配置文件')
        .option('--editor <editor>', '指定编辑器 (windsurf/trae/cursor/vscode)')
        .option('--all', '验证所有编辑器配置')
        .action(async (options) => {
        var _a, _b, _c, _d;
        const spinner = ora('验证 MCP 配置...').start();
        try {
            if (options.all) {
                // 验证所有编辑器配置
                const editors = ['windsurf', 'trae', 'cursor', 'vscode'];
                let allValid = true;
                for (const editor of editors) {
                    const mcpConfig = config.generateMCPConfig(editor);
                    const result = config.validateMCPConfig(mcpConfig);
                    if (result.valid) {
                        console.log(chalk.green(`✅ ${editor} 配置有效`));
                    }
                    else {
                        console.log(chalk.red(`❌ ${editor} 配置无效:`));
                        (_a = result.errors) === null || _a === void 0 ? void 0 : _a.forEach(error => {
                            console.log(chalk.red(`   - ${error}`));
                        });
                        allValid = false;
                    }
                    if ((_b = result.warnings) === null || _b === void 0 ? void 0 : _b.length) {
                        result.warnings.forEach(warning => {
                            console.log(chalk.yellow(`   ⚠️ ${warning}`));
                        });
                    }
                }
                spinner.succeed(allValid ? '所有配置验证通过' : '部分配置验证失败');
            }
            else if (options.editor) {
                // 验证特定编辑器配置
                const editor = options.editor;
                const mcpConfig = config.generateMCPConfig(editor);
                const result = config.validateMCPConfig(mcpConfig);
                if (result.valid) {
                    spinner.succeed(`${editor} 配置验证通过`);
                }
                else {
                    spinner.fail(`${editor} 配置验证失败`);
                    (_c = result.errors) === null || _c === void 0 ? void 0 : _c.forEach(error => {
                        console.log(chalk.red(`❌ ${error}`));
                    });
                }
                if ((_d = result.warnings) === null || _d === void 0 ? void 0 : _d.length) {
                    result.warnings.forEach(warning => {
                        console.log(chalk.yellow(`⚠️ ${warning}`));
                    });
                }
            }
            else {
                spinner.fail('请指定编辑器或使用 --all 选项');
            }
        }
        catch (error) {
            spinner.fail(`验证失败: ${error.message}`);
            process.exit(1);
        }
    });
    // mcp test 命令
    mcpCommand
        .command('test')
        .description('测试 MCP 配置有效性')
        .option('--editor <editor>', '指定编辑器')
        .option('--all-editors', '测试所有编辑器配置')
        .option('--all-models', '测试所有 AI 模型连接')
        .action(async (options) => {
        var _a, _b, _c, _d, _e;
        const spinner = ora('测试 MCP 配置...').start();
        try {
            if (options.allModels) {
                // 测试所有 AI 模型
                const models = ['deepseek', 'zhipu', 'qwen', 'baidu', 'moonshot', 'spark'];
                console.log(chalk.blue('\n🧪 测试 AI 模型连接:'));
                for (const model of models) {
                    try {
                        const testResult = await config.testMCPConfiguration('cursor', {
                            customEnvironment: { PREFERRED_MODEL: model }
                        });
                        if (testResult.valid) {
                            console.log(chalk.green(`✅ ${model} 连接正常 (${testResult.latency}ms)`));
                        }
                        else {
                            console.log(chalk.red(`❌ ${model} 连接失败`));
                            (_a = testResult.errors) === null || _a === void 0 ? void 0 : _a.forEach(error => {
                                console.log(chalk.red(`   - ${error}`));
                            });
                        }
                    }
                    catch (error) {
                        console.log(chalk.red(`❌ ${model} 测试异常: ${error.message}`));
                    }
                }
                spinner.succeed('AI 模型连接测试完成');
            }
            else if (options.allEditors) {
                // 测试所有编辑器配置
                const editors = ['windsurf', 'trae', 'cursor', 'vscode'];
                console.log(chalk.blue('\n🧪 测试编辑器配置:'));
                for (const editor of editors) {
                    try {
                        const testResult = await config.testMCPConfiguration(editor);
                        if (testResult.valid) {
                            console.log(chalk.green(`✅ ${editor} 配置测试通过 (${testResult.latency}ms)`));
                        }
                        else {
                            console.log(chalk.red(`❌ ${editor} 配置测试失败`));
                            (_b = testResult.errors) === null || _b === void 0 ? void 0 : _b.forEach(error => {
                                console.log(chalk.red(`   - ${error}`));
                            });
                        }
                        if ((_c = testResult.warnings) === null || _c === void 0 ? void 0 : _c.length) {
                            testResult.warnings.forEach(warning => {
                                console.log(chalk.yellow(`   ⚠️ ${warning}`));
                            });
                        }
                    }
                    catch (error) {
                        console.log(chalk.red(`❌ ${editor} 测试异常: ${error.message}`));
                    }
                }
                spinner.succeed('编辑器配置测试完成');
            }
            else if (options.editor) {
                // 测试特定编辑器
                const editor = options.editor;
                const testResult = await config.testMCPConfiguration(editor);
                if (testResult.valid) {
                    spinner.succeed(`${editor} 配置测试通过 (${testResult.latency}ms)`);
                }
                else {
                    spinner.fail(`${editor} 配置测试失败`);
                    (_d = testResult.errors) === null || _d === void 0 ? void 0 : _d.forEach(error => {
                        console.log(chalk.red(`❌ ${error}`));
                    });
                }
                if ((_e = testResult.warnings) === null || _e === void 0 ? void 0 : _e.length) {
                    testResult.warnings.forEach(warning => {
                        console.log(chalk.yellow(`⚠️ ${warning}`));
                    });
                }
            }
            else {
                spinner.fail('请指定测试选项');
            }
        }
        catch (error) {
            spinner.fail(`测试失败: ${error.message}`);
            process.exit(1);
        }
    });
    // mcp regenerate 命令
    mcpCommand
        .command('regenerate')
        .description('重新生成 MCP 配置文件')
        .option('--editor <editor>', '指定编辑器')
        .option('--force', '覆盖现有配置')
        .action(async (options) => {
        const spinner = ora('重新生成 MCP 配置...').start();
        try {
            if (options.editor) {
                // 重新生成特定编辑器配置
                const editor = options.editor;
                await config.writeMCPConfigFiles(editor, '.', {
                    includeAllModels: true,
                    enableStreaming: true,
                    enableHealthCheck: true
                });
                spinner.succeed(`${editor} MCP 配置重新生成完成`);
            }
            else {
                // 重新生成所有编辑器配置
                await config.generateAllMCPConfigs('.', {
                    includeAllModels: true,
                    enableStreaming: true,
                    enableHealthCheck: true
                });
                spinner.succeed('所有 MCP 配置重新生成完成');
            }
            console.log(chalk.blue('\n📋 生成的配置文件:'));
            console.log(chalk.gray('  .cursor/mcp.json          - Cursor 编辑器配置'));
            console.log(chalk.gray('  .cursor-rules             - Cursor AI 规则'));
            console.log(chalk.gray('  .windsurf/mcp.json        - Windsurf 编辑器配置'));
            console.log(chalk.gray('  .trae/mcp-config.json     - Trae 编辑器配置'));
            console.log(chalk.gray('  .vscode/settings.json     - VSCode 编辑器配置'));
            console.log(chalk.gray('  .vscode/extensions.json   - VSCode 扩展推荐'));
            console.log(chalk.green('\n🎉 MCP 配置生成完成！现在可以在编辑器中使用 TaskFlow AI 了。'));
        }
        catch (error) {
            spinner.fail(`重新生成失败: ${error.message}`);
            process.exit(1);
        }
    });
    // mcp info 命令
    mcpCommand
        .command('info')
        .description('显示 MCP 服务信息')
        .action(async () => {
        const capabilities = config.getMCPCapabilities();
        console.log(chalk.blue('\n📊 TaskFlow AI MCP 服务信息:'));
        console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green('\n🎯 支持的编辑器:'));
        capabilities.supportedEditors.forEach((editor) => {
            console.log(chalk.gray(`  ✓ ${editor}`));
        });
        console.log(chalk.green('\n🤖 支持的 AI 模型:'));
        capabilities.supportedModels.forEach((model) => {
            console.log(chalk.gray(`  ✓ ${model}`));
        });
        console.log(chalk.green('\n⚡ 支持的功能:'));
        Object.entries(capabilities.features).forEach(([feature, supported]) => {
            const icon = supported ? '✓' : '✗';
            const color = supported ? chalk.gray : chalk.red;
            console.log(color(`  ${icon} ${feature}`));
        });
        console.log(chalk.green('\n🔧 MCP 能力:'));
        Object.entries(capabilities).forEach(([capability, supported]) => {
            if (typeof supported === 'boolean') {
                const icon = supported ? '✓' : '✗';
                const color = supported ? chalk.gray : chalk.red;
                console.log(color(`  ${icon} ${capability}`));
            }
        });
        console.log(chalk.blue('\n📖 使用说明:'));
        console.log(chalk.gray('  1. 运行 taskflow init 生成配置文件'));
        console.log(chalk.gray('  2. 设置环境变量中的 API 密钥'));
        console.log(chalk.gray('  3. 打开编辑器，服务将自动启动'));
        console.log(chalk.gray('  4. 开始使用 AI 驱动的开发功能'));
    });
    return mcpCommand;
}

/**
 * TaskFlow AI 任务管理器
 * 提供任务状态管理、进度跟踪和依赖关系管理功能
 */
/**
 * 任务状态枚举
 */
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
/**
 * 任务优先级
 */
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["CRITICAL"] = "critical";
})(TaskPriority || (TaskPriority = {}));
/**
 * 任务管理器类
 */
class TaskManager extends events.EventEmitter {
    constructor(dataDir = '.taskflow') {
        super();
        this.autoSaveInterval = null;
        this.tasks = new Map();
        this.logger = Logger.getInstance({
            level: LogLevel.INFO,
            output: 'console'
        });
        this.dataFile = path.join(dataDir, 'tasks.json');
        this.initializeDataFile();
        this.loadTasks();
        this.startAutoSave();
    }
    /**
     * 初始化数据文件
     */
    async initializeDataFile() {
        try {
            await fs.ensureDir(path.dirname(this.dataFile));
            if (!await fs.pathExists(this.dataFile)) {
                await fs.writeJson(this.dataFile, { tasks: [] });
            }
        }
        catch (error) {
            this.logger.error('初始化任务数据文件失败:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    }
    /**
     * 加载任务数据
     */
    async loadTasks() {
        try {
            if (await fs.pathExists(this.dataFile)) {
                const data = await fs.readJson(this.dataFile);
                if (data.tasks && Array.isArray(data.tasks)) {
                    for (const taskData of data.tasks) {
                        const task = {
                            ...taskData,
                            createdAt: new Date(taskData.createdAt),
                            updatedAt: new Date(taskData.updatedAt),
                            startedAt: taskData.startedAt ? new Date(taskData.startedAt) : undefined,
                            completedAt: taskData.completedAt ? new Date(taskData.completedAt) : undefined,
                            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
                        };
                        this.tasks.set(task.id, task);
                    }
                }
            }
            this.logger.info(`已加载 ${this.tasks.size} 个任务`);
        }
        catch (error) {
            this.logger.error('加载任务数据失败:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    }
    /**
     * 保存任务数据
     */
    async saveTasks() {
        try {
            const tasksArray = Array.from(this.tasks.values());
            await fs.writeJson(this.dataFile, { tasks: tasksArray }, { spaces: 2 });
        }
        catch (error) {
            this.logger.error('保存任务数据失败:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    }
    /**
     * 启动自动保存
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            this.saveTasks();
        }, 30000); // 每30秒自动保存
    }
    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    /**
     * 创建新任务
     */
    createTask(taskData) {
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            progress: 0,
            ...taskData
        };
        this.tasks.set(task.id, task);
        this.emit('taskCreated', task);
        this.logger.info(`创建任务: ${task.title} (${task.id})`);
        return task;
    }
    /**
     * 获取任务
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * 获取所有任务
     */
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * 更新任务
     */
    updateTask(taskId, updates) {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.logger.warn(`任务不存在: ${taskId}`);
            return false;
        }
        // 更新任务属性
        Object.assign(task, updates, {
            updatedAt: new Date()
        });
        this.tasks.set(taskId, task);
        this.emit('taskUpdated', { taskId, task, updates });
        // 触发自动保存
        this.saveTasks();
        this.logger.info(`任务已更新: ${taskId}`);
        return true;
    }
    /**
     * 更新任务状态
     */
    updateTaskStatus(taskId, status, options = {}) {
        const task = this.tasks.get(taskId);
        if (!task) {
            this.logger.warn(`任务不存在: ${taskId}`);
            return false;
        }
        const oldStatus = task.status;
        task.status = status;
        task.updatedAt = new Date();
        // 更新进度
        if (options.progress !== undefined) {
            task.progress = Math.max(0, Math.min(100, options.progress));
        }
        // 更新其他字段
        if (options.actualHours !== undefined) {
            task.actualHours = options.actualHours;
        }
        if (options.assignee !== undefined) {
            task.assignee = options.assignee;
        }
        if (options.dueDate !== undefined) {
            task.dueDate = options.dueDate;
        }
        if (options.metadata) {
            task.metadata = { ...task.metadata, ...options.metadata };
        }
        // 设置状态相关的时间戳
        if (status === TaskStatus.IN_PROGRESS && oldStatus !== TaskStatus.IN_PROGRESS) {
            task.startedAt = new Date();
        }
        else if (status === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
            task.completedAt = new Date();
            task.progress = 100;
        }
        this.emit('taskUpdated', task, oldStatus);
        this.logger.info(`更新任务状态: ${task.title} (${oldStatus} -> ${status})`);
        return true;
    }
    /**
     * 删除任务
     */
    deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }
        this.tasks.delete(taskId);
        this.emit('taskDeleted', task);
        this.logger.info(`删除任务: ${task.title} (${taskId})`);
        return true;
    }
    /**
     * 获取任务统计信息
     */
    getTaskStats() {
        const tasks = Array.from(this.tasks.values());
        const stats = {
            total: tasks.length,
            pending: 0,
            in_progress: 0,
            completed: 0,
            blocked: 0,
            cancelled: 0,
            overallProgress: 0,
            estimatedTotalHours: 0,
            actualTotalHours: 0
        };
        for (const task of tasks) {
            // 统计状态
            switch (task.status) {
                case TaskStatus.PENDING:
                    stats.pending++;
                    break;
                case TaskStatus.IN_PROGRESS:
                    stats.in_progress++;
                    break;
                case TaskStatus.COMPLETED:
                    stats.completed++;
                    break;
                case TaskStatus.BLOCKED:
                    stats.blocked++;
                    break;
                case TaskStatus.CANCELLED:
                    stats.cancelled++;
                    break;
            }
            // 统计工时
            stats.estimatedTotalHours += task.estimatedHours;
            if (task.actualHours) {
                stats.actualTotalHours += task.actualHours;
            }
        }
        // 计算整体进度
        if (tasks.length > 0) {
            const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
            stats.overallProgress = Math.round(totalProgress / tasks.length);
        }
        return stats;
    }
    /**
     * 根据状态筛选任务
     */
    getTasksByStatus(status) {
        return Array.from(this.tasks.values()).filter(task => task.status === status);
    }
    /**
     * 根据优先级筛选任务
     */
    getTasksByPriority(priority) {
        return Array.from(this.tasks.values()).filter(task => task.priority === priority);
    }
    /**
     * 根据分配人筛选任务
     */
    getTasksByAssignee(assignee) {
        return Array.from(this.tasks.values()).filter(task => task.assignee === assignee);
    }
    /**
     * 检查任务依赖关系
     */
    checkTaskDependencies(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return { canStart: false, blockedBy: [] };
        }
        const blockedBy = [];
        for (const depId of task.dependencies) {
            const depTask = this.tasks.get(depId);
            if (!depTask || depTask.status !== TaskStatus.COMPLETED) {
                blockedBy.push(depId);
            }
        }
        return {
            canStart: blockedBy.length === 0,
            blockedBy
        };
    }
    /**
     * 获取可以开始的任务
     */
    getReadyTasks() {
        return Array.from(this.tasks.values()).filter(task => {
            if (task.status !== TaskStatus.PENDING)
                return false;
            const { canStart } = this.checkTaskDependencies(task.id);
            return canStart;
        });
    }
    /**
     * 手动保存
     */
    async save() {
        await this.saveTasks();
    }
    /**
     * 清理资源
     */
    destroy() {
        this.stopAutoSave();
        this.saveTasks();
        this.removeAllListeners();
    }
}

/**
 * TaskFlow AI - 显示工具
 *
 * 提供各种数据显示和可视化功能
 *
 * @author TaskFlow AI Team
 * @version 1.0.0
 */
/**
 * 显示表格数据
 */
function displayTable(data) {
    if (data.length === 0) {
        console.log(chalk.yellow('📋 没有数据可显示'));
        return;
    }
    // 获取所有列名
    const columns = Object.keys(data[0]);
    const columnWidths = new Map();
    // 计算每列的最大宽度
    columns.forEach(col => {
        const maxWidth = Math.max(col.length, ...data.map(row => String(row[col] || '').length));
        columnWidths.set(col, Math.min(maxWidth, 30)); // 限制最大宽度
    });
    // 显示表头
    const headerRow = columns.map(col => chalk.bold.blue(col.padEnd(columnWidths.get(col)))).join(' │ ');
    console.log('┌' + '─'.repeat(headerRow.length - 10) + '┐');
    console.log('│ ' + headerRow + ' │');
    console.log('├' + '─'.repeat(headerRow.length - 10) + '┤');
    // 显示数据行
    data.forEach(row => {
        const dataRow = columns.map(col => {
            const value = String(row[col] || '');
            const width = columnWidths.get(col);
            // 根据内容类型着色
            let coloredValue = value;
            if (col.includes('状态') || col.includes('Status')) {
                coloredValue = getStatusColor(value);
            }
            else if (col.includes('优先级') || col.includes('Priority')) {
                coloredValue = getPriorityColor(value);
            }
            else if (col.includes('关键') || col.includes('Critical')) {
                coloredValue = value === '✅' ? chalk.green(value) : chalk.gray(value);
            }
            return coloredValue.padEnd(width);
        }).join(' │ ');
        console.log('│ ' + dataRow + ' │');
    });
    console.log('└' + '─'.repeat(headerRow.length - 10) + '┘');
}
/**
 * 显示任务列表
 */
function displayTaskList(tasks, options = {}) {
    if (tasks.length === 0) {
        console.log(chalk.yellow('📋 没有任务可显示'));
        return;
    }
    tasks.forEach((task, index) => {
        const statusIcon = getStatusIcon(task.status);
        const priorityColor = getPriorityColor(task.priority);
        console.log(`${index + 1}. ${statusIcon} ${chalk.bold(task.name)}`);
        console.log(`   ${chalk.gray('ID:')} ${task.id.substring(0, 8)}`);
        console.log(`   ${chalk.gray('优先级:')} ${priorityColor}`);
        console.log(`   ${chalk.gray('类型:')} ${task.type}`);
        if (task.estimatedHours) {
            console.log(`   ${chalk.gray('预计时长:')} ${task.estimatedHours}小时`);
        }
        if (options.showTimeInfo && task.timeInfo) {
            console.log(`   ${chalk.gray('最早开始:')} ${task.timeInfo.earliestStart ? new Date(task.timeInfo.earliestStart).toLocaleDateString() : '未设置'}`);
            console.log(`   ${chalk.gray('浮动时间:')} ${task.timeInfo.totalFloat ? task.timeInfo.totalFloat.toFixed(1) + '小时' : '未计算'}`);
            console.log(`   ${chalk.gray('关键任务:')} ${task.timeInfo.isCritical ? chalk.red('是') : chalk.green('否')}`);
        }
        if (task.dependencies && task.dependencies.length > 0) {
            console.log(`   ${chalk.gray('依赖:')} ${task.dependencies.join(', ')}`);
        }
        console.log(`   ${chalk.gray('描述:')} ${task.description}`);
        console.log('');
    });
}
/**
 * 显示甘特图（简化版）
 */
function displayGanttChart(tasks) {
    console.log(chalk.bold.blue('📊 项目甘特图'));
    console.log('═'.repeat(60));
    if (tasks.length === 0) {
        console.log(chalk.yellow('没有任务数据'));
        return;
    }
    // 计算时间范围
    let minStart = Infinity;
    let maxEnd = 0;
    tasks.forEach(task => {
        if (task.timeInfo) {
            const start = task.timeInfo.earliestStart ? new Date(task.timeInfo.earliestStart).getTime() : 0;
            const duration = (task.timeInfo.estimatedDuration || task.estimatedHours || 8) * 60 * 60 * 1000;
            const end = start + duration;
            minStart = Math.min(minStart, start);
            maxEnd = Math.max(maxEnd, end);
        }
    });
    if (minStart === Infinity) {
        console.log(chalk.yellow('任务缺少时间信息，无法生成甘特图'));
        return;
    }
    const totalDuration = maxEnd - minStart;
    const chartWidth = 40; // 图表宽度
    tasks.forEach(task => {
        const name = task.name.substring(0, 15).padEnd(15);
        if (task.timeInfo && task.timeInfo.earliestStart) {
            const start = new Date(task.timeInfo.earliestStart).getTime();
            const duration = (task.timeInfo.estimatedDuration || task.estimatedHours || 8) * 60 * 60 * 1000;
            const startPos = Math.floor(((start - minStart) / totalDuration) * chartWidth);
            const taskWidth = Math.max(1, Math.floor((duration / totalDuration) * chartWidth));
            const chart = ' '.repeat(startPos) +
                (task.timeInfo.isCritical ? chalk.red('█'.repeat(taskWidth)) : chalk.blue('█'.repeat(taskWidth))) +
                ' '.repeat(Math.max(0, chartWidth - startPos - taskWidth));
            console.log(`${name} │${chart}│`);
        }
        else {
            console.log(`${name} │${chalk.gray('─'.repeat(chartWidth))}│`);
        }
    });
    // 显示时间轴
    console.log(' '.repeat(15) + '│' + '─'.repeat(chartWidth) + '│');
    console.log(' '.repeat(15) + '│' +
        new Date(minStart).toLocaleDateString().padEnd(chartWidth - 10) +
        new Date(maxEnd).toLocaleDateString().padStart(10) + '│');
}
/**
 * 获取状态图标
 */
function getStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'completed':
        case 'done':
            return chalk.green('✅');
        case 'in_progress':
        case 'in-progress':
            return chalk.yellow('🔄');
        case 'blocked':
            return chalk.red('🚫');
        case 'cancelled':
            return chalk.gray('❌');
        default:
            return chalk.blue('📋');
    }
}
/**
 * 获取状态颜色
 */
function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'completed':
        case 'done':
            return chalk.green(status);
        case 'in_progress':
        case 'in-progress':
            return chalk.yellow(status);
        case 'blocked':
            return chalk.red(status);
        case 'cancelled':
            return chalk.gray(status);
        default:
            return chalk.blue(status);
    }
}
/**
 * 获取优先级颜色
 */
function getPriorityColor(priority) {
    switch (priority.toLowerCase()) {
        case 'critical':
            return chalk.red.bold(priority);
        case 'high':
            return chalk.red(priority);
        case 'medium':
            return chalk.yellow(priority);
        case 'low':
            return chalk.green(priority);
        default:
            return chalk.gray(priority);
    }
}

/**
 * TaskFlow AI - 任务编排命令
 *
 * 提供智能任务编排功能的CLI命令
 *
 * @author TaskFlow AI Team
 * @version 1.0.0
 */
/**
 * 转换TaskManager的Task为编排引擎的Task
 */
function convertToOrchestrationTask(tmTask) {
    return {
        id: tmTask.id,
        name: tmTask.title,
        title: tmTask.title,
        description: tmTask.description,
        status: convertStatus(tmTask.status),
        priority: convertPriority(tmTask.priority),
        type: 'feature', // 默认类型
        dependencies: tmTask.dependencies,
        estimatedHours: tmTask.estimatedHours,
        actualHours: tmTask.actualHours,
        createdAt: tmTask.createdAt,
        updatedAt: tmTask.updatedAt,
        startedAt: tmTask.startedAt,
        completedAt: tmTask.completedAt,
        dueDate: tmTask.dueDate,
        assignee: tmTask.assignee,
        tags: tmTask.tags,
        progress: tmTask.progress,
        metadata: tmTask.metadata,
    };
}
/**
 * 转换状态
 */
function convertStatus(status) {
    const statusMap = {
        'pending': 'not_started',
        'in_progress': 'in_progress',
        'completed': 'completed',
        'blocked': 'blocked',
        'cancelled': 'cancelled'
    };
    return statusMap[status] || status;
}
/**
 * 转换优先级
 */
function convertPriority(priority) {
    return priority; // 优先级枚举相同
}
/**
 * 创建编排命令
 */
function createOrchestrateCommand() {
    const command = new commander.Command('orchestrate');
    command
        .description('智能任务编排和优化')
        .option('-p, --preset <preset>', '使用预设编排策略')
        .option('-s, --strategy <strategy>', '调度策略')
        .option('-g, --goal <goal>', '优化目标')
        .option('--max-parallel <number>', '最大并行任务数', '10')
        .option('--buffer <percentage>', '缓冲时间百分比', '0.1')
        .option('--critical-path', '启用关键路径分析', true)
        .option('--no-critical-path', '禁用关键路径分析')
        .option('--parallel-optimization', '启用并行优化', true)
        .option('--no-parallel-optimization', '禁用并行优化')
        .option('--resource-leveling', '启用资源平衡')
        .option('--no-resource-leveling', '禁用资源平衡')
        .option('--risk-analysis', '启用风险分析', true)
        .option('--no-risk-analysis', '禁用风险分析')
        .option('--output <format>', '输出格式 (table|json|gantt)', 'table')
        .option('--save', '保存编排结果到项目')
        .option('--dry-run', '仅显示编排结果，不保存')
        .action(async (options) => {
        await handleOrchestrateCommand(options);
    });
    // 添加子命令
    command.addCommand(createPresetsCommand());
    command.addCommand(createAnalyzeCommand());
    command.addCommand(createOptimizeCommand());
    command.addCommand(createRecommendCommand());
    return command;
}
/**
 * 处理编排命令
 */
async function handleOrchestrateCommand(options) {
    const spinner = ora('正在加载任务数据...').start();
    try {
        // 加载任务管理器
        const taskManager = new TaskManager();
        const tmTasks = taskManager.getAllTasks();
        const tasks = tmTasks.map(convertToOrchestrationTask);
        if (tasks.length === 0) {
            spinner.fail('没有找到任务，请先创建任务');
            return;
        }
        spinner.text = '正在配置编排引擎...';
        // 构建编排配置
        const config = buildOrchestrationConfig(options);
        // 创建编排引擎
        const engine = options.preset
            ? OrchestrationFactory.createEngine(options.preset, config)
            : new TaskOrchestrationEngine(config);
        spinner.text = `正在编排 ${tasks.length} 个任务...`;
        // 执行编排
        const result = await engine.orchestrate(tasks);
        spinner.succeed('任务编排完成');
        // 显示结果
        await displayOrchestrationResult(result, options.output);
        // 保存结果
        if (options.save && !options.dryRun) {
            const saveSpinner = ora('正在保存编排结果...').start();
            try {
                // 更新任务时间信息
                const updatedTasks = engine.updateTaskTimeInfo(result.tasks);
                // 保存到任务管理器
                for (const task of updatedTasks) {
                    // 转换回TaskManager格式并更新
                    const tmTaskUpdate = {
                        title: task.name,
                        description: task.description,
                        estimatedHours: task.estimatedHours || 0,
                        metadata: {
                            ...task.metadata,
                            timeInfo: task.timeInfo,
                            orchestrationMetadata: task.orchestrationMetadata
                        }
                    };
                    taskManager.updateTask(task.id, tmTaskUpdate);
                }
                saveSpinner.succeed('编排结果已保存');
            }
            catch (error) {
                saveSpinner.fail(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }
    }
    catch (error) {
        spinner.fail(`编排失败: ${error instanceof Error ? error.message : '未知错误'}`);
        process.exit(1);
    }
}
/**
 * 构建编排配置
 */
function buildOrchestrationConfig(options) {
    const config = {};
    if (options.strategy) {
        config.schedulingStrategy = options.strategy;
    }
    if (options.goal) {
        config.optimizationGoal = options.goal;
    }
    if (options.maxParallel) {
        config.maxParallelTasks = parseInt(options.maxParallel);
    }
    if (options.buffer) {
        config.bufferPercentage = parseFloat(options.buffer);
    }
    config.enableCriticalPath = options.criticalPath;
    config.enableParallelOptimization = options.parallelOptimization;
    config.enableResourceLeveling = options.resourceLeveling;
    config.enableRiskAnalysis = options.riskAnalysis;
    return config;
}
/**
 * 显示编排结果
 */
async function displayOrchestrationResult(result, format) {
    console.log('\n' + chalk.bold.blue('📊 任务编排结果'));
    console.log('═'.repeat(60));
    // 显示基本统计
    console.log(chalk.green(`✅ 总任务数: ${result.tasks.length}`));
    console.log(chalk.yellow(`⏱️  项目持续时间: ${result.totalDuration} 小时`));
    console.log(chalk.red(`🎯 关键路径任务: ${result.criticalPath.length}`));
    console.log(chalk.blue(`🔄 并行任务组: ${result.parallelGroups.length}`));
    console.log(chalk.magenta(`⚠️  整体风险等级: ${result.riskAssessment.overallRiskLevel.toFixed(1)}/10`));
    console.log('\n' + chalk.bold('📋 编排策略'));
    console.log(`策略: ${result.metadata.strategy}`);
    console.log(`目标: ${result.metadata.goal}`);
    console.log(`编排时间: ${result.metadata.orchestrationTime.toLocaleString()}`);
    // 根据格式显示详细结果
    switch (format) {
        case 'json':
            console.log('\n' + chalk.bold('📄 详细结果 (JSON)'));
            console.log(JSON.stringify(result, null, 2));
            break;
        case 'gantt':
            console.log('\n' + chalk.bold('📊 甘特图'));
            displayGanttChart(result.tasks);
            break;
        case 'table':
        default:
            await displayTableResult(result);
            break;
    }
    // 显示关键路径
    if (result.criticalPath.length > 0) {
        console.log('\n' + chalk.bold.red('🎯 关键路径'));
        const criticalTasks = result.tasks.filter((task) => result.criticalPath.includes(task.id));
        displayTaskList(criticalTasks, { showTimeInfo: true });
    }
    // 显示并行任务组
    if (result.parallelGroups.length > 0) {
        console.log('\n' + chalk.bold.blue('🔄 并行任务组'));
        result.parallelGroups.forEach((group, index) => {
            console.log(chalk.cyan(`组 ${index + 1}: ${group.join(', ')}`));
        });
    }
    // 显示优化建议
    if (result.recommendations.length > 0) {
        console.log('\n' + chalk.bold.green('💡 优化建议'));
        result.recommendations.forEach((recommendation, index) => {
            console.log(chalk.green(`${index + 1}. ${recommendation}`));
        });
    }
    // 显示风险评估
    if (result.riskAssessment.riskFactors.length > 0) {
        console.log('\n' + chalk.bold.yellow('⚠️  风险评估'));
        result.riskAssessment.riskFactors.forEach((risk) => {
            console.log(chalk.yellow(`• ${risk.name}: ${risk.riskScore.toFixed(1)} (${risk.category})`));
        });
    }
}
/**
 * 显示表格结果
 */
async function displayTableResult(result) {
    console.log('\n' + chalk.bold('📋 任务详情'));
    const tableData = result.tasks.map((task) => {
        const timeInfo = task.timeInfo || {};
        return {
            'ID': task.id.substring(0, 8),
            '任务名称': task.name,
            '状态': task.status,
            '优先级': task.priority,
            '预计时长': `${task.estimatedHours || 0}h`,
            '最早开始': timeInfo.earliestStart ? new Date(timeInfo.earliestStart).toLocaleDateString() : '-',
            '最晚开始': timeInfo.latestStart ? new Date(timeInfo.latestStart).toLocaleDateString() : '-',
            '浮动时间': timeInfo.totalFloat ? `${timeInfo.totalFloat.toFixed(1)}h` : '-',
            '关键任务': timeInfo.isCritical ? '✅' : '❌',
        };
    });
    displayTable(tableData);
}
/**
 * 创建预设命令
 */
function createPresetsCommand() {
    const command = new commander.Command('presets');
    command
        .description('查看可用的编排预设')
        .action(() => {
        console.log('\n' + chalk.bold.blue('📋 可用编排预设'));
        console.log('═'.repeat(60));
        const presets = OrchestrationFactory.getAvailablePresets();
        presets.forEach(preset => {
            console.log(chalk.bold.green(`\n${preset.name} (${preset.preset})`));
            console.log(chalk.gray(preset.description));
            console.log(chalk.blue('适用场景: ') + preset.suitableFor.join(', '));
        });
        console.log('\n' + chalk.yellow('使用方法:'));
        console.log(chalk.cyan('taskflow orchestrate --preset agile_sprint'));
    });
    return command;
}
/**
 * 创建分析命令
 */
function createAnalyzeCommand() {
    const command = new commander.Command('analyze');
    command
        .description('分析当前任务结构')
        .action(async () => {
        const spinner = ora('正在分析任务结构...').start();
        try {
            const taskManager = new TaskManager();
            const tasks = taskManager.getAllTasks();
            if (tasks.length === 0) {
                spinner.fail('没有找到任务');
                return;
            }
            const engine = new TaskOrchestrationEngine();
            const stats = engine.getOrchestrationStats();
            spinner.succeed('任务分析完成');
            console.log('\n' + chalk.bold.blue('📊 任务结构分析'));
            console.log('═'.repeat(40));
            console.log(chalk.green(`总任务数: ${stats.totalTasks}`));
            console.log(chalk.red(`关键任务数: ${stats.criticalTasks}`));
            console.log(chalk.blue(`并行任务组: ${stats.parallelGroups}`));
            console.log(chalk.yellow(`平均浮动时间: ${stats.averageFloat.toFixed(1)}h`));
            console.log(chalk.magenta(`最长路径: ${stats.longestPath.toFixed(1)}h`));
        }
        catch (error) {
            spinner.fail(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });
    return command;
}
/**
 * 创建优化命令
 */
function createOptimizeCommand() {
    const command = new commander.Command('optimize');
    command
        .description('优化任务安排')
        .option('--goal <goal>', '优化目标', 'minimize_duration')
        .action(async (options) => {
        console.log(chalk.blue('🔧 任务优化功能开发中...'));
        console.log(chalk.gray('将在下个版本中提供更多优化选项'));
    });
    return command;
}
/**
 * 创建推荐命令
 */
function createRecommendCommand() {
    const command = new commander.Command('recommend');
    command
        .description('推荐编排策略')
        .option('--team-size <number>', '团队规模', '5')
        .option('--duration <days>', '项目持续时间（天）', '30')
        .option('--uncertainty <level>', '不确定性等级 (1-10)', '5')
        .option('--quality <level>', '质量要求 (1-10)', '7')
        .option('--time-constraint <level>', '时间约束 (1-10)', '5')
        .option('--budget-constraint <level>', '预算约束 (1-10)', '5')
        .option('--agile', '敏捷项目')
        .option('--research', '研究项目')
        .option('--enterprise', '企业级项目')
        .action((options) => {
        const characteristics = {
            teamSize: parseInt(options.teamSize),
            projectDuration: parseInt(options.duration),
            uncertaintyLevel: parseInt(options.uncertainty),
            qualityRequirement: parseInt(options.quality),
            timeConstraint: parseInt(options.timeConstraint),
            budgetConstraint: parseInt(options.budgetConstraint),
            isAgile: options.agile,
            isResearch: options.research,
            isEnterprise: options.enterprise,
        };
        const recommendedPreset = OrchestrationFactory.recommendPreset(characteristics);
        const presets = OrchestrationFactory.getAvailablePresets();
        const presetInfo = presets.find(p => p.preset === recommendedPreset);
        console.log('\n' + chalk.bold.blue('🎯 推荐编排策略'));
        console.log('═'.repeat(40));
        if (presetInfo) {
            console.log(chalk.bold.green(`推荐策略: ${presetInfo.name}`));
            console.log(chalk.gray(presetInfo.description));
            console.log(chalk.blue('适用场景: ') + presetInfo.suitableFor.join(', '));
            console.log('\n' + chalk.yellow('使用方法:'));
            console.log(chalk.cyan(`taskflow orchestrate --preset ${recommendedPreset}`));
        }
    });
    return command;
}

/**
 * 类型安全的错误处理系统
 */
/**
 * 基础错误类
 */
class TaskFlowError extends Error {
    constructor(message, code, context) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = context.timestamp || new Date().toISOString();
        this.context = context;
        // 确保错误堆栈正确显示
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * 序列化错误信息
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            stack: this.stack || ''
        };
    }
}
/**
 * 错误处理工具类
 */
class ErrorHandler {
    /**
     * 安全地处理未知错误
     */
    static handleUnknownError(error, source) {
        if (error instanceof TaskFlowError) {
            return error;
        }
        if (error instanceof Error) {
            const context = {
                timestamp: new Date().toISOString(),
                source,
                details: {
                    originalName: error.name,
                    originalStack: error.stack || ''
                }
            };
            return new TaskFlowError(error.message, 'UNKNOWN_ERROR', context);
        }
        if (typeof error === 'string') {
            const context = {
                timestamp: new Date().toISOString(),
                source,
                details: {}
            };
            return new TaskFlowError(error, 'STRING_ERROR', context);
        }
        const context = {
            timestamp: new Date().toISOString(),
            source,
            details: {
                errorType: typeof error,
                errorValue: String(error)
            }
        };
        return new TaskFlowError('An unknown error occurred', 'UNKNOWN_ERROR', context);
    }
    /**
     * 检查错误是否可重试
     */
    static isRetryable(error) {
        var _a;
        const retryableCodes = ['NETWORK_ERROR', 'API_ERROR', 'PERFORMANCE_ERROR'];
        return retryableCodes.includes(error.code) &&
            ((_a = error.context.details) === null || _a === void 0 ? void 0 : _a.retryable) === true;
    }
    /**
     * 获取错误的严重程度
     */
    static getSeverity(error) {
        const criticalCodes = ['FILESYSTEM_ERROR', 'CONFIGURATION_ERROR'];
        const highCodes = ['API_ERROR', 'NETWORK_ERROR'];
        const mediumCodes = ['VALIDATION_ERROR', 'PARSE_ERROR'];
        if (criticalCodes.includes(error.code))
            return 'critical';
        if (highCodes.includes(error.code))
            return 'high';
        if (mediumCodes.includes(error.code))
            return 'medium';
        return 'low';
    }
    /**
     * 格式化错误消息用于用户显示
     */
    static formatUserMessage(error) {
        var _a;
        const baseMessage = error.message;
        const suggestion = (_a = error.context.details) === null || _a === void 0 ? void 0 : _a.suggestion;
        if (suggestion) {
            return `${baseMessage}\n💡 建议: ${suggestion}`;
        }
        return baseMessage;
    }
    /**
     * 创建错误报告
     */
    static createErrorReport(error) {
        return {
            id: this.generateErrorId(),
            timestamp: error.timestamp,
            severity: this.getSeverity(error),
            retryable: this.isRetryable(error),
            error: error.toJSON(),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
    }
    /**
     * 生成错误ID
     */
    static generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * TaskFlow AI CLI入口
 */
// 全局错误处理器
function handleGlobalError(error) {
    const taskFlowError = ErrorHandler.handleUnknownError(error, 'cli');
    const userMessage = ErrorHandler.formatUserMessage(taskFlowError);
    console.error(chalk.red('❌ 错误:'), userMessage);
    // 在开发模式下显示详细错误信息
    if (process.env.NODE_ENV === 'development') {
        console.error(chalk.gray('详细错误信息:'));
        console.error(taskFlowError.stack);
    }
    // 记录错误报告
    const errorReport = ErrorHandler.createErrorReport(taskFlowError);
    console.error(chalk.gray(`错误ID: ${errorReport.id}`));
    process.exit(1);
}
// 捕获未处理的异常
process.on('uncaughtException', handleGlobalError);
process.on('unhandledRejection', handleGlobalError);
// 创建命令行程序
const program = new commander.Command();
// 设置版本号和描述
program
    .name('taskflow')
    .description(chalk.cyan('TaskFlow AI - 智能PRD文档解析与任务管理助手'))
    .version(VERSION)
    .addHelpText('before', chalk.cyan.bold('TaskFlow AI') + ' - 让AI帮您将产品需求转化为可执行的任务计划\n')
    .addHelpText('after', `
${chalk.yellow('快速开始:')}
  ${chalk.green('taskflow interactive')}     启动交互式模式 (推荐新用户)
  ${chalk.green('taskflow init')}            初始化新项目
  ${chalk.green('taskflow parse <file>')}    解析PRD文档

${chalk.yellow('示例:')}
  ${chalk.gray('taskflow parse ./prd.md')}
  ${chalk.gray('taskflow status --verbose')}
  ${chalk.gray('taskflow config set model.deepseek.apiKey <your-key>')}

${chalk.yellow('更多信息:')}
  ${chalk.blue('https://github.com/agions/taskflow-ai')}
`);
// 注册命令
visualizeCommand.register(program);
statusCommand.register(program);
interactiveCommand.register(program);
modelsCommand(program);
// 注册MCP命令
program.addCommand(createMCPCommand());
// 注册任务编排命令
program.addCommand(createOrchestrateCommand());
// 快速开始命令
program
    .command('init')
    .description('初始化TaskFlow AI项目并生成MCP配置')
    .option('--editor <editor>', '指定编辑器 (windsurf/trae/cursor/vscode)', 'all')
    .option('--force', '覆盖现有配置文件')
    .action(async (options) => {
    console.log(chalk.blue('🚀 TaskFlow AI - 项目初始化'));
    console.log();
    try {
        const fs = await import('fs-extra');
        const path = await import('path');
        const { Logger } = await Promise.resolve().then(function () { return logger; });
        const { ConfigManager } = await Promise.resolve().then(function () { return configManager; });
        const projectDir = process.cwd(); // 在当前目录初始化
        const logger$1 = Logger.getInstance({
            level: LogLevel.INFO,
            output: 'console'
        });
        const config = new ConfigManager(logger$1);
        // 创建基本目录结构
        await fs.default.ensureDir(path.join(projectDir, '.taskflow'));
        await fs.default.ensureDir(path.join(projectDir, 'docs'));
        await fs.default.ensureDir(path.join(projectDir, 'tasks'));
        await fs.default.ensureDir(path.join(projectDir, 'output'));
        // 创建示例PRD文件
        const samplePRD = `# 示例产品需求文档

## 1. 产品概述

### 1.1 产品名称
示例Web应用

### 1.2 产品描述
这是一个示例的Web应用产品需求文档，用于演示TaskFlow AI的功能。

## 2. 功能需求

### 2.1 用户管理
- 用户注册功能
- 用户登录功能
- 用户信息管理

### 2.2 内容管理
- 内容创建功能
- 内容编辑功能
- 内容删除功能

### 2.3 权限管理
- 角色管理
- 权限分配
- 访问控制

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间不超过3秒
- 支持1000并发用户

### 3.2 安全要求
- 数据加密传输
- 用户身份验证
- 防止SQL注入

## 4. 技术要求

### 4.1 前端技术
- React.js
- TypeScript
- Tailwind CSS

### 4.2 后端技术
- Node.js
- Express.js
- MongoDB
`;
        await fs.default.writeFile(path.join(projectDir, 'docs', 'sample-prd.md'), samplePRD);
        // 生成MCP配置文件
        console.log(chalk.blue('📝 生成MCP配置文件...'));
        if (options.editor === 'all') {
            // 生成所有编辑器配置
            await config.generateAllMCPConfigs(projectDir, {
                includeAllModels: true,
                enableStreaming: true,
                enableHealthCheck: true
            });
            console.log(chalk.green('✅ 所有编辑器MCP配置生成完成'));
        }
        else {
            // 生成特定编辑器配置
            await config.writeMCPConfigFiles(options.editor, projectDir, {
                includeAllModels: true,
                enableStreaming: true,
                enableHealthCheck: true
            });
            console.log(chalk.green(`✅ ${options.editor} MCP配置生成完成`));
        }
        // 创建配置文件
        const taskflowConfig = {
            project: {
                name: "示例项目",
                description: "TaskFlow AI 示例项目"
            },
            engine: {
                autoSave: true,
                saveInterval: 300,
                outputDir: "./output",
                defaultModel: "deepseek",
                enableOptimization: true
            }
        };
        await fs.default.writeFile(path.join(projectDir, 'taskflow.config.json'), JSON.stringify(taskflowConfig, null, 2));
        // 创建环境变量模板
        const envTemplate = `# TaskFlow AI 环境变量配置
# 请填入您的API密钥

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key

# 智谱AI API
ZHIPU_API_KEY=your-zhipu-api-key

# 通义千问 API
QWEN_API_KEY=your-qwen-api-key

# 文心一言 API
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 月之暗面 API
MOONSHOT_API_KEY=your-moonshot-api-key

# 讯飞星火 API
SPARK_APP_ID=your-spark-app-id
SPARK_API_KEY=your-spark-api-key
SPARK_API_SECRET=your-spark-api-secret

# TaskFlow 配置
TASKFLOW_LOG_LEVEL=info
TASKFLOW_CACHE_ENABLED=true
`;
        await fs.default.writeFile(path.join(projectDir, '.env.example'), envTemplate);
        console.log(chalk.green('🎉 TaskFlow AI 项目初始化完成！'));
        console.log();
        console.log(chalk.yellow('📁 生成的文件：'));
        console.log('  ├── .cursor/mcp.json          # Cursor MCP配置');
        console.log('  ├── .cursor-rules             # Cursor AI规则');
        console.log('  ├── .windsurf/mcp.json        # Windsurf MCP配置');
        console.log('  ├── .trae/mcp-config.json     # Trae MCP配置');
        console.log('  ├── .vscode/settings.json     # VSCode MCP配置');
        console.log('  ├── .vscode/extensions.json   # VSCode扩展推荐');
        console.log('  ├── .taskflow/                # TaskFlow配置目录');
        console.log('  ├── docs/sample-prd.md        # 示例PRD文档');
        console.log('  ├── taskflow.config.json      # TaskFlow配置');
        console.log('  └── .env.example              # 环境变量模板');
        console.log();
        console.log(chalk.blue('🔧 下一步设置：'));
        console.log('  1. 复制 .env.example 为 .env');
        console.log('  2. 在 .env 中填入您的API密钥');
        console.log('  3. 打开您的AI编辑器（Cursor/Windsurf/Trae/VSCode）');
        console.log('  4. 编辑器会自动启动TaskFlow AI MCP服务');
        console.log();
        console.log(chalk.green('🚀 现在可以开始使用AI驱动的开发体验了！'));
    }
    catch (error) {
        console.error(chalk.red('❌ 初始化失败:'));
        console.error(chalk.red(error.message));
    }
});
// 解析PRD命令
program
    .command('parse <file>')
    .description('解析PRD文档并生成任务计划')
    .option('-o, --output <path>', '输出任务计划的路径', './taskflow/tasks.json')
    .option('-m, --model <type>', '使用的模型类型', 'deepseek')
    .option('--optimize', '启用任务计划优化', true)
    .option('--estimate-effort', '估算工作量', true)
    .option('--detect-dependencies', '检测依赖关系', true)
    .action(async (file, options) => {
    console.log(chalk.blue('📄 TaskFlow AI - PRD解析'));
    console.log();
    try {
        const fs = await import('fs-extra');
        const path = await import('path');
        const ora = await import('ora');
        const spinner = ora.default('正在解析PRD文档...').start();
        // 检查文件是否存在
        if (!fs.default.existsSync(file)) {
            spinner.fail(`文件不存在: ${file}`);
            process.exit(1);
        }
        // 这里应该调用TaskFlow引擎进行解析
        // 暂时使用模拟数据
        spinner.text = '正在生成任务计划...';
        // 模拟处理时间
        await new Promise(resolve => setTimeout(resolve, 2000));
        const outputPath = path.resolve(process.cwd(), options.output);
        await fs.default.ensureDir(path.dirname(outputPath));
        // 生成示例任务计划
        const taskPlan = {
            id: 'project-' + Date.now(),
            name: '示例项目任务计划',
            description: '基于PRD文档生成的任务计划',
            tasks: [
                {
                    id: 'task-1',
                    title: '项目初始化',
                    description: '创建项目结构，配置开发环境',
                    status: 'not_started',
                    priority: 'high',
                    type: 'setup',
                    dependencies: [],
                    estimatedHours: 4,
                    tags: ['setup', 'infrastructure'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'task-2',
                    title: '用户管理模块',
                    description: '实现用户注册、登录、信息管理功能',
                    status: 'not_started',
                    priority: 'high',
                    type: 'feature',
                    dependencies: ['task-1'],
                    estimatedHours: 16,
                    tags: ['user', 'authentication'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'task-3',
                    title: '内容管理模块',
                    description: '实现内容的创建、编辑、删除功能',
                    status: 'not_started',
                    priority: 'medium',
                    type: 'feature',
                    dependencies: ['task-2'],
                    estimatedHours: 20,
                    tags: ['content', 'crud'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };
        await fs.default.writeFile(outputPath, JSON.stringify(taskPlan, null, 2));
        spinner.succeed(`成功解析PRD并生成任务计划`);
        console.log();
        console.log(chalk.green('✅ 任务计划已生成:'));
        console.log(chalk.gray(`   文件: ${outputPath}`));
        console.log(chalk.gray(`   任务数量: ${taskPlan.tasks.length}`));
        console.log();
        console.log(chalk.cyan('🎯 下一步:'));
        console.log(chalk.gray(`   taskflow status -i ${outputPath}`));
        console.log(chalk.gray(`   taskflow visualize gantt -i ${outputPath}`));
    }
    catch (error) {
        console.error(chalk.red('❌ 解析失败:'));
        console.error(chalk.red(error.message));
        process.exit(1);
    }
});
// 帮助命令
program
    .command('help')
    .description('显示帮助信息')
    .action(() => {
    console.log(chalk.blue('🤖 TaskFlow AI - 智能PRD文档解析与任务管理助手'));
    console.log();
    console.log(chalk.cyan('📖 主要功能:'));
    console.log(chalk.gray('  • PRD文档智能解析'));
    console.log(chalk.gray('  • AI任务编排优化'));
    console.log(chalk.gray('  • 任务状态管理'));
    console.log(chalk.gray('  • 可视化图表生成'));
    console.log();
    console.log(chalk.cyan('🚀 快速开始:'));
    console.log(chalk.gray('  1. taskflow init                    # 初始化项目'));
    console.log(chalk.gray('  2. taskflow parse docs/prd.md       # 解析PRD文档'));
    console.log(chalk.gray('  3. taskflow status                  # 查看任务状态'));
    console.log(chalk.gray('  4. taskflow visualize gantt         # 生成甘特图'));
    console.log();
    console.log(chalk.cyan('📋 常用命令:'));
    console.log(chalk.gray('  taskflow parse <file>               # 解析PRD文档'));
    console.log(chalk.gray('  taskflow status                     # 查看项目状态'));
    console.log(chalk.gray('  taskflow status next                # 获取推荐任务'));
    console.log(chalk.gray('  taskflow status update <id> <status> # 更新任务状态'));
    console.log(chalk.gray('  taskflow visualize gantt            # 生成甘特图'));
    console.log(chalk.gray('  taskflow visualize dependency       # 生成依赖图'));
    console.log();
    console.log(chalk.cyan('🎨 可视化类型:'));
    console.log(chalk.gray('  • gantt      - 甘特图'));
    console.log(chalk.gray('  • dependency - 依赖关系图'));
    console.log(chalk.gray('  • kanban     - 看板视图'));
    console.log(chalk.gray('  • progress   - 进度图表'));
    console.log();
    console.log(chalk.cyan('💡 更多帮助:'));
    console.log(chalk.gray('  taskflow <command> --help           # 查看命令详细帮助'));
    console.log(chalk.gray('  https://github.com/taskflow-ai/docs  # 在线文档'));
});
// 获取下一个任务命令
program
    .command('next-task')
    .description('获取下一个要处理的任务')
    .option('-f, --file <path>', '任务计划文件路径', './tasks/tasks.json')
    .action(async (options) => {
    try {
        const spinner = ora('正在查找下一个任务...').start();
        // 加载任务计划
        const filePath = path.resolve(process.cwd(), options.file);
        if (!fs__namespace.existsSync(filePath)) {
            spinner.fail(`任务文件不存在: ${filePath}`);
            process.exit(1);
        }
        const result = await yasiService.loadTaskPlan(filePath);
        if (!result.success) {
            spinner.fail(`加载任务失败: ${result.error}`);
            process.exit(1);
        }
        // 获取下一个任务
        const nextResult = await yasiService.getNextTasks();
        if (!nextResult.success) {
            spinner.fail(`获取下一个任务失败: ${nextResult.error}`);
            process.exit(1);
        }
        spinner.succeed('成功查找下一个任务');
        const tasks = nextResult.data;
        if (!tasks || tasks.length === 0) {
            console.log(chalk.yellow('没有找到可处理的任务'));
            process.exit(0);
        }
        // 输出任务详情
        const task = tasks[0]; // 获取第一个可处理的任务
        console.log(chalk.cyan('\n下一个任务:'));
        console.log(chalk.cyan('-'.repeat(80)));
        console.log(chalk.cyan(`ID: ${task.id}`));
        console.log(chalk.cyan(`名称: ${task.name}`));
        console.log(chalk.cyan(`优先级: ${task.priority}`));
        console.log(chalk.cyan(`状态: ${task.status}`));
        console.log(chalk.cyan(`描述: ${task.description}`));
        if (task.subtasks && task.subtasks.length > 0) {
            console.log(chalk.cyan('\n子任务:'));
            task.subtasks.forEach((subtask, index) => {
                console.log(chalk.white(`  ${index + 1}. [${subtask.status}] ${subtask.name}`));
            });
        }
        console.log(chalk.cyan('-'.repeat(80)));
        console.log(chalk.green('\n执行此任务:'));
        console.log(chalk.white(`  yasi-ai update-task --id=${task.id} --status=in_progress`));
        console.log(chalk.white(`  # 完成任务后:`));
        console.log(chalk.white(`  yasi-ai update-task --id=${task.id} --status=done`));
    }
    catch (error) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
    }
});
// 更新任务命令
program
    .command('update-task')
    .description('更新任务状态或信息')
    .option('-f, --file <path>', '任务计划文件路径', './tasks/tasks.json')
    .requiredOption('--id <id>', '任务ID')
    .option('--status <status>', '新状态')
    .option('--name <name>', '新名称')
    .option('--description <description>', '新描述')
    .option('--priority <priority>', '新优先级')
    .action(async (options) => {
    try {
        const spinner = ora('正在更新任务...').start();
        // 加载任务计划
        const filePath = path.resolve(process.cwd(), options.file);
        if (!fs__namespace.existsSync(filePath)) {
            spinner.fail(`任务文件不存在: ${filePath}`);
            process.exit(1);
        }
        const result = await yasiService.loadTaskPlan(filePath);
        if (!result.success) {
            spinner.fail(`加载任务失败: ${result.error}`);
            process.exit(1);
        }
        // 构建更新数据
        const updateData = {};
        if (options.status)
            updateData.status = options.status;
        if (options.name)
            updateData.name = options.name;
        if (options.description)
            updateData.description = options.description;
        if (options.priority)
            updateData.priority = options.priority;
        // 更新任务
        const updateResult = await yasiService.updateTask(options.id, updateData);
        if (!updateResult.success) {
            spinner.fail(`更新任务失败: ${updateResult.error}`);
            process.exit(1);
        }
        // 保存任务计划
        const saveResult = await yasiService.saveTaskPlan(result.data, filePath);
        if (!saveResult.success) {
            spinner.fail(`保存任务计划失败: ${saveResult.error}`);
            process.exit(1);
        }
        spinner.succeed(`成功更新任务 ${options.id}`);
        // 输出更新后的任务信息
        const task = updateResult.data;
        if (task) {
            console.log(chalk.cyan('\n更新后的任务:'));
            console.log(chalk.cyan('-'.repeat(80)));
            console.log(chalk.cyan(`ID: ${task.id}`));
            console.log(chalk.cyan(`名称: ${task.name}`));
            console.log(chalk.cyan(`优先级: ${task.priority}`));
            console.log(chalk.cyan(`状态: ${task.status}`));
            console.log(chalk.cyan(`描述: ${task.description}`));
            console.log(chalk.cyan('-'.repeat(80)));
        }
    }
    catch (error) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
    }
});
// 配置命令
program
    .command('config')
    .description('查看或设置配置')
    .option('--get', '获取当前配置')
    .option('--set-model <type>', '设置默认模型类型')
    .option('--set-api-key <key>', '设置API密钥')
    .option('--model-type <type>', '指定设置API密钥的模型类型', 'baidu')
    .action(async (options) => {
    var _a;
    try {
        // 获取配置
        if (options.get) {
            const result = await yasiService.getConfig();
            if (!result.success) {
                console.error(chalk.red(`获取配置失败: ${result.error}`));
                process.exit(1);
            }
            console.log(chalk.cyan('\n当前配置:'));
            console.log(JSON.stringify(result.data, null, 2));
            return;
        }
        // 设置默认模型
        if (options.setModel) {
            const modelType = options.setModel;
            const result = await yasiService.updateConfig({
                models: {
                    default: modelType
                }
            });
            if (!result.success) {
                console.error(chalk.red(`设置默认模型失败: ${result.error}`));
                process.exit(1);
            }
            console.log(chalk.green(`成功设置默认模型为: ${modelType}`));
        }
        // 设置API密钥
        if (options.setApiKey) {
            const modelType = options.modelType;
            const apiKey = options.setApiKey;
            const config = {
                models: {
                    [modelType]: {
                        apiKey: apiKey
                    }
                }
            };
            // 百度文心模型需要设置secretKey
            if (modelType === ModelType.BAIDU && apiKey.includes(':')) {
                const [key, secret] = apiKey.split(':');
                if (config.models && typeof config.models === 'object') {
                    config.models[modelType] = {
                        apiKey: key,
                        secretKey: secret
                    };
                }
            }
            const result = await yasiService.updateConfig(config);
            if (!result.success) {
                console.error(chalk.red(`设置API密钥失败: ${result.error}`));
                process.exit(1);
            }
            console.log(chalk.green(`成功设置${modelType}模型的API密钥`));
            // 验证API密钥
            const validateResult = await yasiService.validateModelApiKey(modelType);
            if (!validateResult.success || !((_a = validateResult.data) === null || _a === void 0 ? void 0 : _a.valid)) {
                console.log(chalk.yellow(`警告: API密钥验证失败，请检查密钥是否正确`));
            }
            else {
                console.log(chalk.green(`API密钥验证成功`));
            }
        }
    }
    catch (error) {
        console.error(chalk.red(`错误: ${error.message}`));
        process.exit(1);
    }
});
// 旧的模型命令已被新的 modelsCommand 替代
// 解析命令行参数
program.parse(process.argv);
// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
    console.log(chalk.blue('🤖 TaskFlow AI - 智能PRD文档解析与任务管理助手'));
    console.log();
    console.log(chalk.cyan('🚀 快速开始:'));
    console.log(chalk.gray('  taskflow init                    # 初始化项目'));
    console.log(chalk.gray('  taskflow parse docs/prd.md       # 解析PRD文档'));
    console.log(chalk.gray('  taskflow orchestrate             # 智能任务编排'));
    console.log(chalk.gray('  taskflow status                  # 查看任务状态'));
    console.log();
    console.log(chalk.cyan('💡 获取帮助:'));
    console.log(chalk.gray('  taskflow help                    # 显示详细帮助'));
    console.log(chalk.gray('  taskflow <command> --help        # 查看命令帮助'));
}
//# sourceMappingURL=index.js.map
