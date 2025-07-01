/**
 * TaskFlow Service 核心功能测试
 */

import { TaskFlowService } from '../../../src/mcp/index';
import { FileType } from '../../../src/types/model';
import { TaskStatus, TaskPriority } from '../../../src/types/task';

describe('TaskFlowService', () => {
  let taskFlowService: TaskFlowService;

  beforeEach(() => {
    taskFlowService = new TaskFlowService();
  });

  describe('PRD解析功能', () => {
    it('应该能够解析简单的PRD内容', async () => {
      const prdContent = `
# 用户管理系统

## 功能需求

### 用户注册
- 用户可以通过邮箱注册账号
- 需要验证邮箱有效性
- 密码强度要求：至少8位，包含字母和数字

### 用户登录
- 支持邮箱和用户名登录
- 登录失败3次后锁定账号
- 支持记住登录状态
      `;

      const result = await taskFlowService.parsePRD(prdContent, FileType.MARKDOWN);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.title).toContain('用户管理系统');
      }
    });

    it('应该能够处理空内容', async () => {
      const result = await taskFlowService.parsePRD('', FileType.MARKDOWN);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('任务管理功能', () => {
    it('应该能够获取所有任务', async () => {
      const result = await taskFlowService.getAllTasks();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应该能够获取任务状态', async () => {
      const result = taskFlowService.getTaskStatus();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('配置管理功能', () => {
    it('应该能够获取配置信息', async () => {
      const result = await taskFlowService.getConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('应该能够更新配置', async () => {
      const config = {
        models: {
          default: 'deepseek'
        }
      };

      const result = taskFlowService.updateConfig(config);

      expect(result.success).toBe(true);
    });
  });

  describe('模型功能', () => {
    it('应该能够获取可用模型类型', async () => {
      const result = await taskFlowService.getAvailableModelTypes();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      if (result.data) {
        expect(result.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe('项目管理功能', () => {
    it('应该能够创建项目', async () => {
      const projectData = {
        name: '测试项目',
        description: '这是一个测试项目'
      };

      const result = await taskFlowService.createProject(projectData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe(projectData.name);
    });

    it('应该能够获取项目列表', async () => {
      const result = await taskFlowService.getProjects();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('应该能够获取项目详情', async () => {
      const projectId = 'test-project-id';
      const result = await taskFlowService.getProject(projectId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理无效的文件类型', async () => {
      const result = await taskFlowService.parsePRD('test content', 'invalid' as FileType);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
