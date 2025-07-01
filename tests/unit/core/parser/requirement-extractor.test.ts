/**
 * 需求提取器单元测试
 * 测试PRD文档解析和需求提取功能
 */

import { RequirementExtractor } from '../../../../src/core/parser/requirement-extractor';
import { MockLogger, TestDataFactory } from '../../../setup';

describe('RequirementExtractor', () => {
  let extractor: RequirementExtractor;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    extractor = new RequirementExtractor(mockLogger);
  });

  describe('extractFromText', () => {
    it('应该从简单文本中提取基本需求', async () => {
      const text = `
        # 用户管理系统

        ## 功能需求
        1. 用户注册功能
        2. 用户登录功能
        3. 用户信息管理

        ## 非功能需求
        - 系统响应时间不超过2秒
        - 支持1000并发用户
      `;

      const requirements = await extractor.extractFromText(text);

      expect(requirements).toHaveLength(5);
      expect(requirements[0]).toMatchObject({
        title: expect.stringContaining('用户注册'),
        type: 'functional'
      });
      expect(requirements[3]).toMatchObject({
        type: 'non_functional'
      });
    });

    it('应该正确识别需求优先级', async () => {
      const text = `
        ## 高优先级需求
        - [高] 用户登录功能
        - [中] 用户注册功能
        - [低] 用户头像上传

        ## 关键需求
        - 数据安全保护
      `;

      const requirements = await extractor.extractFromText(text);

      const highPriorityReq = requirements.find(r => r.title.includes('登录'));
      const mediumPriorityReq = requirements.find(r => r.title.includes('注册'));
      const lowPriorityReq = requirements.find(r => r.title.includes('头像'));
      const criticalReq = requirements.find(r => r.title.includes('安全'));

      expect(highPriorityReq?.priority).toBe('high');
      expect(mediumPriorityReq?.priority).toBe('medium');
      expect(lowPriorityReq?.priority).toBe('low');
      expect(criticalReq?.priority).toBe('critical');
    });

    it('应该提取验收标准', async () => {
      const text = `
        ## 用户登录功能

        ### 验收标准
        - 用户输入正确的用户名和密码后能成功登录
        - 登录失败时显示错误提示
        - 支持记住登录状态
      `;

      const requirements = await extractor.extractFromText(text);
      const loginReq = requirements.find(r => r.title.includes('登录'));

      expect(loginReq?.acceptance).toHaveLength(3);
      expect(loginReq?.acceptance[0]).toContain('正确的用户名和密码');
    });

    it('应该处理空文本', async () => {
      const requirements = await extractor.extractFromText('');
      expect(requirements).toHaveLength(0);
    });

    it('应该处理无效文本', async () => {
      const text = '这是一段没有任何需求信息的普通文本。';
      const requirements = await extractor.extractFromText(text);
      expect(requirements).toHaveLength(0);
    });
  });

  describe('extractFromMarkdown', () => {
    it('应该从Markdown格式中提取需求', async () => {
      const markdown = `
        # 电商平台PRD

        ## 1. 用户模块

        ### 1.1 用户注册
        **优先级**: 高
        **类型**: 功能需求
        **描述**: 用户可以通过邮箱或手机号注册账户

        #### 验收标准
        - [ ] 支持邮箱注册
        - [ ] 支持手机号注册
        - [ ] 注册成功后自动登录

        ### 1.2 用户登录
        **优先级**: 高
        **类型**: 功能需求
        **描述**: 用户可以使用注册的账户登录系统

        ## 2. 商品模块

        ### 2.1 商品浏览
        **优先级**: 中
        **类型**: 功能需求
        **描述**: 用户可以浏览商品列表和详情
      `;

      const requirements = await extractor.extractFromMarkdown(markdown);

      expect(requirements).toHaveLength(3);
      
      const registerReq = requirements.find(r => r.title.includes('注册'));
      expect(registerReq).toMatchObject({
        title: expect.stringContaining('注册'),
        priority: 'high',
        type: 'functional',
        acceptance: expect.arrayContaining([
          expect.stringContaining('邮箱注册'),
          expect.stringContaining('手机号注册'),
          expect.stringContaining('自动登录')
        ])
      });
    });

    it('应该正确解析嵌套的Markdown结构', async () => {
      const markdown = `
        # 项目需求

        ## 模块A
        ### 功能1
        需求描述1

        ### 功能2
        需求描述2

        ## 模块B
        ### 功能3
        需求描述3
      `;

      const requirements = await extractor.extractFromMarkdown(markdown);
      expect(requirements).toHaveLength(3);
    });
  });

  describe('extractFromJSON', () => {
    it('应该从JSON格式中提取需求', async () => {
      const jsonData = {
        requirements: [
          {
            title: '用户注册',
            description: '用户注册功能',
            priority: 'high',
            type: 'functional',
            acceptance: ['支持邮箱注册', '支持手机号注册']
          },
          {
            title: '系统性能',
            description: '系统响应时间要求',
            priority: 'medium',
            type: 'non_functional',
            acceptance: ['响应时间<2秒']
          }
        ]
      };

      const requirements = await extractor.extractFromJSON(JSON.stringify(jsonData));

      expect(requirements).toHaveLength(2);
      expect(requirements[0]).toMatchObject({
        title: '用户注册',
        priority: 'high',
        type: 'functional'
      });
    });

    it('应该处理无效的JSON', async () => {
      const invalidJson = '{ invalid json }';
      
      await expect(extractor.extractFromJSON(invalidJson))
        .rejects.toThrow('Invalid JSON format');
    });
  });

  describe('analyzeRequirements', () => {
    it('应该分析需求的复杂度和业务价值', async () => {
      const requirements = [
        TestDataFactory.createRequirement({
          title: '用户登录',
          description: '实现用户登录功能，包括密码验证、会话管理、安全控制等复杂逻辑',
          type: 'functional',
          priority: 'high'
        }),
        TestDataFactory.createRequirement({
          title: '用户头像上传',
          description: '简单的文件上传功能',
          type: 'functional',
          priority: 'low'
        })
      ];

      const analysis = await extractor.analyzeRequirements(requirements);

      expect(analysis.totalRequirements).toBe(2);
      expect(analysis.complexityDistribution).toHaveProperty('high');
      expect(analysis.complexityDistribution).toHaveProperty('medium');
      expect(analysis.complexityDistribution).toHaveProperty('low');
      expect(analysis.priorityDistribution).toHaveProperty('high', 1);
      expect(analysis.priorityDistribution).toHaveProperty('low', 1);
    });

    it('应该计算平均业务价值', async () => {
      const requirements = [
        TestDataFactory.createRequirement({ businessValue: 8 }),
        TestDataFactory.createRequirement({ businessValue: 6 }),
        TestDataFactory.createRequirement({ businessValue: 4 })
      ];

      const analysis = await extractor.analyzeRequirements(requirements);
      expect(analysis.averageBusinessValue).toBe(6);
    });

    it('应该识别需求依赖关系', async () => {
      const requirements = [
        TestDataFactory.createRequirement({
          title: '用户注册',
          description: '用户注册功能'
        }),
        TestDataFactory.createRequirement({
          title: '用户登录',
          description: '用户登录功能，依赖用户注册'
        }),
        TestDataFactory.createRequirement({
          title: '个人资料',
          description: '用户个人资料管理，需要先登录'
        })
      ];

      const analysis = await extractor.analyzeRequirements(requirements);
      expect(analysis.dependencies).toBeDefined();
      expect(analysis.dependencies.length).toBeGreaterThan(0);
    });
  });

  describe('validateRequirements', () => {
    it('应该验证需求的完整性', async () => {
      const validRequirements = [
        TestDataFactory.createRequirement({
          title: '完整的需求',
          description: '这是一个完整的需求描述',
          acceptance: ['验收标准1', '验收标准2']
        })
      ];

      const incompleteRequirements = [
        TestDataFactory.createRequirement({
          title: '',
          description: '缺少标题的需求'
        }),
        TestDataFactory.createRequirement({
          title: '缺少描述的需求',
          description: ''
        })
      ];

      const validResult = await extractor.validateRequirements(validRequirements);
      const invalidResult = await extractor.validateRequirements(incompleteRequirements);

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('应该检查需求的一致性', async () => {
      const conflictingRequirements = [
        TestDataFactory.createRequirement({
          title: '需求A',
          description: '系统应该支持单点登录'
        }),
        TestDataFactory.createRequirement({
          title: '需求B',
          description: '系统不应该支持单点登录'
        })
      ];

      const result = await extractor.validateRequirements(conflictingRequirements);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    it('应该处理解析错误', async () => {
      const malformedText = null as any;
      
      await expect(extractor.extractFromText(malformedText))
        .rejects.toThrow();
    });

    it('应该记录解析过程中的警告', async () => {
      const textWithIssues = `
        ## 模糊的需求
        - 系统应该很快
        - 界面要好看
      `;

      await extractor.extractFromText(textWithIssues);
      
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('性能测试', () => {
    it('应该能处理大型文档', async () => {
      const largeText = Array(1000).fill('## 需求项\n描述内容\n').join('\n');
      
      const startTime = Date.now();
      const requirements = await extractor.extractFromText(largeText);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
      expect(requirements.length).toBeGreaterThan(0);
    });
  });
});
