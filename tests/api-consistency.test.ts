/**
 * API一致性测试
 * 验证文档中描述的API与实际实现的一致性
 */

import { 
  TaskFlowService, 
  ServiceResponse, 
  PRDParseResult, 
  FileType,
  ParseOptions 
} from '../src/index';

describe('API一致性测试', () => {
  let service: TaskFlowService;

  beforeEach(() => {
    service = new TaskFlowService();
  });

  describe('TaskFlowService导出', () => {
    it('应该能够正确导入TaskFlowService', () => {
      expect(TaskFlowService).toBeDefined();
      expect(typeof TaskFlowService).toBe('function');
    });

    it('应该能够创建TaskFlowService实例', () => {
      expect(service).toBeInstanceOf(TaskFlowService);
    });
  });

  describe('类型定义一致性', () => {
    it('ServiceResponse类型应该正确导出', () => {
      // 类型检查 - 如果类型不匹配，TypeScript会报错
      const response: ServiceResponse<string> = {
        success: true,
        data: 'test'
      };
      expect(response.success).toBe(true);
    });

    it('PRDParseResult类型应该正确导出', () => {
      // 类型检查
      const result: PRDParseResult = {
        title: 'Test PRD',
        description: 'Test Description',
        sections: []
      };
      expect(result.title).toBe('Test PRD');
    });

    it('FileType枚举应该正确导出', () => {
      expect(FileType.MARKDOWN).toBeDefined();
      expect(FileType.JSON).toBeDefined();
      expect(FileType.TEXT).toBeDefined();
    });
  });

  describe('API方法签名一致性', () => {
    it('parsePRD方法应该具有正确的签名', () => {
      // 检查方法存在
      expect(typeof service.parsePRD).toBe('function');
      
      // 检查方法参数（通过TypeScript类型检查）
      const testCall = async () => {
        const result: Promise<ServiceResponse<PRDParseResult>> = service.parsePRD(
          'test content',
          FileType.MARKDOWN,
          {} as ParseOptions
        );
        return result;
      };
      
      expect(testCall).toBeDefined();
    });

    it('parsePRDFromFile方法应该具有正确的签名', () => {
      expect(typeof service.parsePRDFromFile).toBe('function');
    });

    it('generateTaskPlan方法应该存在', () => {
      expect(typeof service.generateTaskPlan).toBe('function');
    });

    it('getAllTasks方法应该存在', () => {
      expect(typeof service.getAllTasks).toBe('function');
    });
  });

  describe('文档示例代码验证', () => {
    it('文档中的基本用法示例应该有效', () => {
      // 这个测试验证文档中的示例代码在语法上是正确的
      const documentedUsage = () => {
        // 来自文档的示例
        const service = new TaskFlowService();
        return service;
      };
      
      expect(documentedUsage()).toBeInstanceOf(TaskFlowService);
    });

    it('文档中的parsePRD示例应该有效', async () => {
      // 模拟文档中的使用方式
      const prdContent = `
# 用户管理系统
## 功能需求
### 用户注册
- 邮箱注册
- 密码验证
`;

      // 这个调用应该在类型上是正确的
      const resultPromise = service.parsePRD(prdContent, FileType.MARKDOWN);
      expect(resultPromise).toBeInstanceOf(Promise);
    });
  });
});
