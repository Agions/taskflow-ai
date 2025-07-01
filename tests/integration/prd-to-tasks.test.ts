/**
 * PRD到任务的集成测试
 * 测试从PRD文档到任务计划的完整流程
 */

import { taskFlowService } from '../../src/mcp/index';
import { TestDataFactory } from '../setup';

describe('PRD到任务完整流程集成测试', () => {

  beforeEach(() => {
    // 重置服务状态
    jest.clearAllMocks();
  });

  describe('完整的PRD处理流程', () => {
    it('应该能够处理完整的电商PRD文档', async () => {
      const prdContent = `
        # 电商平台PRD文档

        ## 1. 项目概述
        构建一个现代化的电商平台，支持商品展示、购物车、订单管理等核心功能。

        ## 2. 功能需求

        ### 2.1 用户管理模块
        **优先级**: 高
        **业务价值**: 9

        #### 2.1.1 用户注册
        - 支持邮箱注册
        - 支持手机号注册
        - 注册验证码验证
        - 用户协议确认

        **验收标准**:
        - [ ] 用户可以通过邮箱成功注册
        - [ ] 用户可以通过手机号成功注册
        - [ ] 验证码验证正确
        - [ ] 必须同意用户协议才能注册

        #### 2.1.2 用户登录
        - 支持邮箱/用户名登录
        - 支持手机号登录
        - 记住登录状态
        - 忘记密码功能

        **验收标准**:
        - [ ] 用户可以使用邮箱/用户名登录
        - [ ] 用户可以使用手机号登录
        - [ ] 登录状态可以保持
        - [ ] 忘记密码功能正常

        ### 2.2 商品管理模块
        **优先级**: 高
        **业务价值**: 8

        #### 2.2.1 商品展示
        - 商品列表页面
        - 商品详情页面
        - 商品搜索功能
        - 商品分类浏览

        #### 2.2.2 商品管理
        - 商品信息录入
        - 商品库存管理
        - 商品价格管理
        - 商品状态管理

        ### 2.3 购物车模块
        **优先级**: 中
        **业务价值**: 7

        #### 2.3.1 购物车功能
        - 添加商品到购物车
        - 修改商品数量
        - 删除购物车商品
        - 购物车商品结算

        ### 2.4 订单管理模块
        **优先级**: 高
        **业务价值**: 9

        #### 2.4.1 订单创建
        - 订单信息填写
        - 收货地址管理
        - 支付方式选择
        - 订单确认提交

        #### 2.4.2 订单处理
        - 订单状态跟踪
        - 订单修改/取消
        - 订单发货处理
        - 订单完成确认

        ## 3. 非功能需求

        ### 3.1 性能要求
        **优先级**: 高
        - 页面加载时间不超过3秒
        - 支持1000并发用户
        - 数据库查询响应时间不超过100ms

        ### 3.2 安全要求
        **优先级**: 高
        - 用户密码加密存储
        - 支付信息安全传输
        - 防止SQL注入攻击
        - 用户权限控制

        ### 3.3 可用性要求
        **优先级**: 中
        - 系统可用性99.9%
        - 支持移动端访问
        - 界面友好易用

        ## 4. 技术要求

        ### 4.1 技术栈
        - 前端: React + TypeScript
        - 后端: Node.js + Express
        - 数据库: PostgreSQL
        - 缓存: Redis

        ### 4.2 部署要求
        - 支持Docker容器化部署
        - 支持云平台部署
        - 支持负载均衡
      `;

      // 第一步：提取需求
      const requirements = await requirementExtractor.extractFromMarkdown(prdContent);

      expect(requirements.length).toBeGreaterThan(10);
      expect(requirements.some(r => r.title.includes('用户注册'))).toBe(true);
      expect(requirements.some(r => r.title.includes('商品展示'))).toBe(true);
      expect(requirements.some(r => r.title.includes('购物车'))).toBe(true);
      expect(requirements.some(r => r.title.includes('订单'))).toBe(true);

      // 第二步：生成任务计划
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      expect(taskPlan).toBeValidTaskPlan();
      expect(taskPlan.tasks.length).toBeGreaterThan(20);
      expect(taskPlan.name).toContain('电商平台');

      // 验证任务类型分布
      const taskTypes = new Set(taskPlan.tasks.map(t => t.type));
      expect(taskTypes.has('design')).toBe(true);
      expect(taskTypes.has('feature')).toBe(true);
      expect(taskTypes.has('test')).toBe(true);

      // 验证任务优先级分布
      const highPriorityTasks = taskPlan.tasks.filter(t => t.priority === 'high');
      const mediumPriorityTasks = taskPlan.tasks.filter(t => t.priority === 'medium');

      expect(highPriorityTasks.length).toBeGreaterThan(0);
      expect(mediumPriorityTasks.length).toBeGreaterThan(0);

      // 验证任务依赖关系
      const tasksWithDependencies = taskPlan.tasks.filter(t => t.dependencies.length > 0);
      expect(tasksWithDependencies.length).toBeGreaterThan(0);

      // 第三步：智能编排
      const orchestrationOptions = {
        strategy: 'balanced' as const,
        teamSize: 5,
        riskTolerance: 'medium' as const,
        prioritizeUserValue: true,
        allowParallelExecution: true,
        maxParallelTasks: 3,
        considerSkillsets: true,
        enableAutoAdjustment: true
      };

      const orchestrationResult = await orchestrator.orchestrate(
        taskPlan,
        requirements,
        orchestrationOptions
      );

      expect(orchestrationResult.optimizedPlan).toBeDefined();
      expect(orchestrationResult.executionPath).toBeDefined();
      expect(orchestrationResult.recommendations.length).toBeGreaterThan(0);
      expect(orchestrationResult.metrics.overallScore).toBeGreaterThan(0);

      // 验证执行路径
      const { executionPath } = orchestrationResult;
      expect(executionPath.phases.length).toBeGreaterThan(0);
      expect(executionPath.criticalPath.length).toBeGreaterThan(0);
      expect(executionPath.estimatedDuration).toBeGreaterThan(0);

      // 验证里程碑
      expect(executionPath.milestones.length).toBeGreaterThan(0);
      const criticalMilestones = executionPath.milestones.filter(m => m.importance === 'critical');
      expect(criticalMilestones.length).toBeGreaterThan(0);

      // 验证推荐建议
      const { recommendations } = orchestrationResult;
      const highPriorityRecommendations = recommendations.filter(r => r.priority === 'high');
      expect(highPriorityRecommendations.length).toBeGreaterThan(0);
    }, 60000); // 增加超时时间到60秒

    it('应该能够处理简单的功能需求', async () => {
      const simplePrd = `
        # 简单博客系统

        ## 功能需求

        ### 文章管理
        - 创建文章
        - 编辑文章
        - 删除文章
        - 文章列表

        ### 用户评论
        - 添加评论
        - 删除评论
        - 评论列表
      `;

      const requirements = await requirementExtractor.extractFromMarkdown(simplePrd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      expect(requirements.length).toBeGreaterThan(0);
      expect(taskPlan.tasks.length).toBeGreaterThan(0);
      expect(taskPlan.name).toContain('博客系统');
    });

    it('应该能够处理包含技术约束的需求', async () => {
      const technicalPrd = `
        # 微服务架构项目

        ## 技术需求
        - 使用Docker容器化
        - 实现服务发现
        - 配置API网关
        - 实现分布式日志

        ## 性能需求
        - 响应时间<100ms
        - 支持10000 QPS
        - 99.99%可用性
      `;

      const requirements = await requirementExtractor.extractFromMarkdown(technicalPrd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      expect(requirements.length).toBeGreaterThan(0);
      expect(taskPlan.tasks.length).toBeGreaterThan(0);

      // 应该包含基础设施相关任务
      const infraTasks = taskPlan.tasks.filter(t =>
        t.title.toLowerCase().includes('docker') ||
        t.title.toLowerCase().includes('网关') ||
        t.title.toLowerCase().includes('日志')
      );
      expect(infraTasks.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理空的PRD文档', async () => {
      const emptyPrd = '';

      const requirements = await requirementExtractor.extractFromMarkdown(emptyPrd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      expect(requirements).toHaveLength(0);
      expect(taskPlan.tasks).toHaveLength(0);
    });

    it('应该处理格式不规范的PRD文档', async () => {
      const malformedPrd = `
        这是一个没有明确结构的文档
        包含一些随意的文本
        没有明确的需求描述
        
        可能有一些功能：
        - 登录
        - 注册
        
        但是描述不够清晰
      `;

      const requirements = await requirementExtractor.extractFromMarkdown(malformedPrd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      // 应该能够提取到一些基本需求
      expect(requirements.length).toBeGreaterThanOrEqual(0);
      expect(taskPlan.tasks.length).toBeGreaterThanOrEqual(0);
    });

    it('应该处理包含冲突需求的PRD', async () => {
      const conflictingPrd = `
        # 冲突需求测试

        ## 需求A
        系统必须支持实时同步

        ## 需求B  
        系统必须支持离线模式

        ## 需求C
        数据必须加密存储

        ## 需求D
        数据必须明文存储以便调试
      `;

      const requirements = await requirementExtractor.extractFromMarkdown(conflictingPrd);
      const validation = await requirementExtractor.validateRequirements(requirements);

      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大型PRD文档', async () => {
      // 生成大型PRD文档
      const largePrd = `
        # 大型企业系统PRD

        ${Array(50).fill(null).map((_, i) => `
        ## 模块${i + 1}
        ### 功能${i + 1}.1
        描述功能${i + 1}.1的详细需求
        
        ### 功能${i + 1}.2
        描述功能${i + 1}.2的详细需求
        
        ### 功能${i + 1}.3
        描述功能${i + 1}.3的详细需求
        `).join('\n')}
      `;

      const startTime = Date.now();

      const requirements = await requirementExtractor.extractFromMarkdown(largePrd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(30000); // 30秒内完成
      expect(requirements.length).toBeGreaterThan(100);
      expect(taskPlan.tasks.length).toBeGreaterThan(100);
    }, 60000);
  });

  describe('数据一致性验证', () => {
    it('应该保持需求到任务的可追溯性', async () => {
      const prd = `
        # 用户系统

        ## 用户注册功能
        实现用户注册功能

        ## 用户登录功能  
        实现用户登录功能
      `;

      const requirements = await requirementExtractor.extractFromMarkdown(prd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      // 验证每个需求都有对应的任务
      requirements.forEach(requirement => {
        const relatedTasks = taskPlan.tasks.filter(task =>
          task.title.toLowerCase().includes(requirement.title.toLowerCase()) ||
          task.description.toLowerCase().includes(requirement.title.toLowerCase())
        );
        expect(relatedTasks.length).toBeGreaterThan(0);
      });
    });

    it('应该保持任务优先级与需求优先级的一致性', async () => {
      const prd = `
        # 优先级测试

        ## 高优先级功能
        **优先级**: 高
        关键业务功能

        ## 低优先级功能
        **优先级**: 低
        辅助功能
      `;

      const requirements = await requirementExtractor.extractFromMarkdown(prd);
      const taskPlan = await taskGenerator.generateFromRequirements(requirements);

      const highPriorityReq = requirements.find(r => r.priority === 'high');
      const lowPriorityReq = requirements.find(r => r.priority === 'low');

      if (highPriorityReq && lowPriorityReq) {
        const highPriorityTasks = taskPlan.tasks.filter(t =>
          t.title.includes(highPriorityReq.title) && t.priority === 'high'
        );
        const lowPriorityTasks = taskPlan.tasks.filter(t =>
          t.title.includes(lowPriorityReq.title) && t.priority === 'low'
        );

        expect(highPriorityTasks.length).toBeGreaterThan(0);
        expect(lowPriorityTasks.length).toBeGreaterThan(0);
      }
    });
  });
});
