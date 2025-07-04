/**
 * PRDParser 单元测试
 * 测试PRD文档解析器的核心功能
 */

import { PRDParser } from '../../../src/core/parser/prd-parser';
import { MockLogger, createMockResponse, createMockError } from '../../setup';
import { FileType } from '../../../src/types/model';
import axios from 'axios';

// 模拟axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe.skip('PRDParser', () => {
  let prdParser: PRDParser;
  let mockLogger: MockLogger;
  let mockModelCoordinator: any;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockModelCoordinator = {
      parseDocument: jest.fn(),
      extractRequirements: jest.fn(),
      analyzeComplexity: jest.fn()
    };
    
    prdParser = new PRDParser(mockModelCoordinator, mockLogger as any);
  });

  describe('Markdown文档解析', () => {
    const sampleMarkdown = `
# 用户管理系统

## 项目概述
这是一个用户管理系统，用于管理用户信息和权限。

## 功能需求

### 用户注册
- 用户可以通过邮箱注册账号
- 需要验证邮箱有效性
- 密码需要符合安全要求

### 用户登录
- 支持邮箱和用户名登录
- 支持记住登录状态
- 登录失败次数限制

## 技术需求
- 使用React前端框架
- 使用Node.js后端
- 使用MySQL数据库

## 验收标准
- 注册成功率 > 95%
- 登录响应时间 < 2秒
- 系统可用性 > 99.9%
`;

    it('应该能够解析Markdown格式的PRD', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [
          { title: '项目概述', content: '这是一个用户管理系统' },
          { title: '功能需求', content: '用户注册、用户登录' }
        ],
        requirements: [
          { title: '用户注册', type: 'functional' },
          { title: '用户登录', type: 'functional' }
        ]
      });

      const result = await prdParser.parseContent(sampleMarkdown, FileType.MARKDOWN);

      expect(result).toBeDefined();
      expect(result.sections).toHaveLength(2);
      expect(result.requirements).toHaveLength(2);
      expect(mockModelCoordinator.parseDocument).toHaveBeenCalledWith(
        sampleMarkdown,
        FileType.MARKDOWN,
        expect.any(Object)
      );
    });

    it('应该能够提取功能需求', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: [
          {
            title: '用户注册',
            description: '用户可以通过邮箱注册账号',
            type: 'functional',
            priority: 'high',
            acceptance: ['邮箱验证', '密码安全']
          }
        ]
      });

      const result = await prdParser.parseContent(sampleMarkdown, FileType.MARKDOWN);

      expect(result.requirements[0]).toMatchObject({
        title: '用户注册',
        type: 'functional',
        priority: 'high'
      });
    });

    it('应该能够提取技术需求', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: [
          {
            title: '技术栈',
            type: 'technical',
            technologies: ['React', 'Node.js', 'MySQL']
          }
        ]
      });

      const result = await prdParser.parseContent(sampleMarkdown, FileType.MARKDOWN);

      expect(result.requirements[0]).toMatchObject({
        title: '技术栈',
        type: 'technical'
      });
    });
  });

  describe('文件解析', () => {
    it('应该能够从文件路径解析PRD', async () => {
      const mockFileContent = '# 测试PRD\n\n## 功能需求\n- 功能1\n- 功能2';
      
      // 模拟文件读取
      jest.doMock('fs/promises', () => ({
        readFile: jest.fn().mockResolvedValue(mockFileContent)
      }));

      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [{ title: '功能需求', content: '功能1、功能2' }],
        requirements: [
          { title: '功能1', type: 'functional' },
          { title: '功能2', type: 'functional' }
        ]
      });

      const result = await prdParser.parseFromFile('./test.md');

      expect(result).toBeDefined();
      expect(result.requirements).toHaveLength(2);
    });

    it('应该在文件不存在时抛出错误', async () => {
      jest.doMock('fs/promises', () => ({
        readFile: jest.fn().mockRejectedValue(new Error('File not found'))
      }));

      await expect(prdParser.parseFromFile('./nonexistent.md'))
        .rejects.toThrow('File not found');
    });
  });

  describe('解析选项', () => {
    const sampleContent = '# 测试PRD\n\n## 功能需求\n- 功能1';

    it('应该支持自定义模型类型', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: []
      });

      await prdParser.parseContent(sampleContent, FileType.MARKDOWN, {
        modelType: 'deepseek'
      });

      expect(mockModelCoordinator.parseDocument).toHaveBeenCalledWith(
        sampleContent,
        FileType.MARKDOWN,
        expect.objectContaining({
          modelType: 'deepseek'
        })
      );
    });

    it('应该支持禁用章节提取', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: []
      });

      await prdParser.parseContent(sampleContent, FileType.MARKDOWN, {
        extractSections: false
      });

      expect(mockModelCoordinator.parseDocument).toHaveBeenCalledWith(
        sampleContent,
        FileType.MARKDOWN,
        expect.objectContaining({
          extractSections: false
        })
      );
    });

    it('应该支持禁用特性提取', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: []
      });

      await prdParser.parseContent(sampleContent, FileType.MARKDOWN, {
        extractFeatures: false
      });

      expect(mockModelCoordinator.parseDocument).toHaveBeenCalledWith(
        sampleContent,
        FileType.MARKDOWN,
        expect.objectContaining({
          extractFeatures: false
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该处理模型协调器错误', async () => {
      mockModelCoordinator.parseDocument.mockRejectedValue(
        new Error('Model API error')
      );

      await expect(prdParser.parseContent('# 测试', FileType.MARKDOWN))
        .rejects.toThrow('Model API error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('PRD解析失败'),
        expect.any(Error)
      );
    });

    it('应该处理无效的文件类型', async () => {
      await expect(prdParser.parseContent('content', 'invalid' as FileType))
        .rejects.toThrow('不支持的文件类型');
    });

    it('应该处理空内容', async () => {
      await expect(prdParser.parseContent('', FileType.MARKDOWN))
        .rejects.toThrow('PRD内容不能为空');
    });
  });

  describe('复杂度分析', () => {
    it('应该能够分析需求复杂度', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: [
          { title: '简单功能', type: 'functional' },
          { title: '复杂功能', type: 'functional' }
        ]
      });

      mockModelCoordinator.analyzeComplexity.mockResolvedValue({
        '简单功能': { complexity: 2, factors: ['UI简单'] },
        '复杂功能': { complexity: 8, factors: ['算法复杂', '集成多个系统'] }
      });

      const result = await prdParser.parseContent('# 测试', FileType.MARKDOWN, {
        analyzeComplexity: true
      });

      expect(mockModelCoordinator.analyzeComplexity).toHaveBeenCalled();
      expect(result.complexity).toBeDefined();
    });
  });

  describe('优先级分析', () => {
    it('应该能够分析需求优先级', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: [
          { title: '核心功能', type: 'functional' },
          { title: '辅助功能', type: 'functional' }
        ]
      });

      const result = await prdParser.parseContent('# 测试', FileType.MARKDOWN, {
        prioritize: true
      });

      expect(result.requirements[0]).toHaveProperty('priority');
    });
  });

  describe('验收标准提取', () => {
    it('应该能够提取验收标准', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: [
          {
            title: '用户登录',
            type: 'functional',
            acceptance: [
              '登录成功率 > 95%',
              '响应时间 < 2秒',
              '支持多种登录方式'
            ]
          }
        ]
      });

      const result = await prdParser.parseContent('# 测试', FileType.MARKDOWN);

      expect(result.requirements[0].acceptance).toHaveLength(3);
      expect(result.requirements[0].acceptance).toContain('登录成功率 > 95%');
    });
  });

  describe('业务价值评估', () => {
    it('应该能够评估业务价值', async () => {
      mockModelCoordinator.parseDocument.mockResolvedValue({
        sections: [],
        requirements: [
          {
            title: '用户注册',
            type: 'functional',
            businessValue: 9,
            impact: 'high'
          }
        ]
      });

      const result = await prdParser.parseContent('# 测试', FileType.MARKDOWN, {
        evaluateBusinessValue: true
      });

      expect(result.requirements[0]).toHaveProperty('businessValue');
      expect(result.requirements[0].businessValue).toBe(9);
    });
  });
});
