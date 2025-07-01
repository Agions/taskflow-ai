/**
 * ModelCoordinator 单元测试
 * 测试模型协调器的核心功能
 */

import { ModelCoordinator } from '../../../src/core/models/coordinator';
import { MockConfigManager, createMockResponse, createMockError } from '../../setup';
import { ModelType } from '../../../src/types/config';
import { ChineseLLMType } from '../../../src/core/models/chinese-llm-provider';

describe('ModelCoordinator', () => {
  let modelCoordinator: ModelCoordinator;
  let mockConfigManager: MockConfigManager;

  beforeEach(() => {
    mockConfigManager = new MockConfigManager();
    
    // 设置默认配置
    mockConfigManager.get.mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'models.default': ModelType.DEEPSEEK,
        'models.deepseek.apiKey': 'test-deepseek-key',
        'models.deepseek.endpoint': 'https://api.deepseek.com/v1/chat/completions',
        'models.zhipu.apiKey': 'test-zhipu-key',
        'models.qwen.apiKey': 'test-qwen-key',
        'models.wenxin.apiKey': 'test-wenxin-key'
      };
      return config[key as keyof typeof config] || defaultValue;
    });

    modelCoordinator = new ModelCoordinator(mockConfigManager as any);
  });

  describe('模型初始化', () => {
    it('应该能够初始化模型协调器', () => {
      expect(modelCoordinator).toBeDefined();
    });

    it('应该能够获取可用的模型类型', () => {
      const modelTypes = modelCoordinator.getAvailableModelTypes();

      expect(modelTypes).toContain(ChineseLLMType.DEEPSEEK);
      expect(modelTypes).toContain(ChineseLLMType.ZHIPU_GLM);
      expect(modelTypes).toContain(ChineseLLMType.ALIBABA_QWEN);
      expect(modelTypes).toContain(ChineseLLMType.BAIDU_WENXIN);
    });

    it('应该能够获取默认模型', () => {
      const defaultModel = modelCoordinator.getDefaultModel();

      expect(defaultModel).toBe(ChineseLLMType.DEEPSEEK);
    });
  });

  describe('聊天功能', () => {
    const mockMessages = [
      { role: 'user', content: '你好' }
    ];

    it('应该能够使用默认模型进行聊天', async () => {
      // 模拟成功的API响应
      const mockResponse = {
        content: '你好！我是AI助手。',
        role: 'assistant',
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        }
      };

      // 模拟模型提供商
      const mockProvider = {
        chat: jest.fn().mockResolvedValue(mockResponse)
      };

      // 注入模拟提供商
      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const result = await modelCoordinator.chat(mockMessages);

      expect(result).toEqual(mockResponse);
      expect(mockProvider.chat).toHaveBeenCalledWith({
        messages: mockMessages,
        temperature: 0.7,
        maxTokens: 2048
      });
    });

    it('应该能够指定特定模型进行聊天', async () => {
      const mockProvider = {
        chat: jest.fn().mockResolvedValue({
          content: '智谱AI回复',
          role: 'assistant'
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.ZHIPU_GLM, mockProvider);

      await modelCoordinator.chat(mockMessages, ChineseLLMType.ZHIPU_GLM);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('应该能够传递自定义选项', async () => {
      const mockProvider = {
        chat: jest.fn().mockResolvedValue({
          content: '回复',
          role: 'assistant'
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const options = {
        temperature: 0.5,
        maxTokens: 1024,
        topP: 0.8
      };

      await modelCoordinator.chat(mockMessages, undefined, options);

      expect(mockProvider.chat).toHaveBeenCalledWith({
        messages: mockMessages,
        ...options
      });
    });

    it('应该在模型不可用时抛出错误', async () => {
      await expect(
        modelCoordinator.chat(mockMessages, 'invalid-model' as ChineseLLMType)
      ).rejects.toThrow('模型不可用');
    });
  });

  describe('流式聊天功能', () => {
    const mockMessages = [
      { role: 'user', content: '请写一个故事' }
    ];

    it('应该能够进行流式聊天', async () => {
      const mockStreamData = [
        { content: '从前', role: 'assistant' },
        { content: '有一个', role: 'assistant' },
        { content: '美丽的', role: 'assistant' },
        { content: '公主', role: 'assistant' }
      ];

      const mockProvider = {
        streamChat: jest.fn().mockImplementation(async function* () {
          for (const data of mockStreamData) {
            yield data;
          }
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const stream = modelCoordinator.streamChat(mockMessages);
      const results = [];

      for await (const chunk of stream) {
        results.push(chunk);
      }

      expect(results).toEqual(mockStreamData);
      expect(mockProvider.streamChat).toHaveBeenCalled();
    });
  });

  describe('文档解析功能', () => {
    const mockDocument = `
# 用户管理系统

## 功能需求
- 用户注册
- 用户登录
- 密码重置
`;

    it('应该能够解析文档', async () => {
      const mockResponse = {
        sections: [
          { title: '功能需求', content: '用户注册、用户登录、密码重置' }
        ],
        requirements: [
          { title: '用户注册', type: 'functional', priority: 'high' },
          { title: '用户登录', type: 'functional', priority: 'high' },
          { title: '密码重置', type: 'functional', priority: 'medium' }
        ]
      };

      const mockProvider = {
        chat: jest.fn().mockResolvedValue({
          content: JSON.stringify(mockResponse),
          role: 'assistant'
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const result = await modelCoordinator.parseDocument(mockDocument, 'markdown');

      expect(result.sections).toHaveLength(1);
      expect(result.requirements).toHaveLength(3);
      expect(result.requirements[0].title).toBe('用户注册');
    });

    it('应该能够处理解析错误', async () => {
      const mockProvider = {
        chat: jest.fn().mockRejectedValue(new Error('API调用失败'))
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      await expect(
        modelCoordinator.parseDocument(mockDocument, 'markdown')
      ).rejects.toThrow('文档解析失败');
    });
  });

  describe('需求提取功能', () => {
    const mockText = '用户需要能够注册账号、登录系统、修改个人信息';

    it('应该能够提取需求', async () => {
      const mockRequirements = [
        { title: '用户注册', type: 'functional', description: '用户注册账号' },
        { title: '用户登录', type: 'functional', description: '用户登录系统' },
        { title: '个人信息管理', type: 'functional', description: '修改个人信息' }
      ];

      const mockProvider = {
        chat: jest.fn().mockResolvedValue({
          content: JSON.stringify(mockRequirements),
          role: 'assistant'
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const result = await modelCoordinator.extractRequirements(mockText);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('用户注册');
      expect(result[0].type).toBe('functional');
    });
  });

  describe('任务生成功能', () => {
    const mockRequirements = [
      { title: '用户注册', type: 'functional', description: '用户注册功能' },
      { title: '用户登录', type: 'functional', description: '用户登录功能' }
    ];

    it('应该能够生成任务', async () => {
      const mockTasks = [
        {
          title: '设计用户注册界面',
          description: '设计用户注册的UI界面',
          type: 'design',
          estimatedHours: 4,
          dependencies: []
        },
        {
          title: '实现用户注册API',
          description: '开发用户注册的后端API',
          type: 'backend',
          estimatedHours: 8,
          dependencies: []
        }
      ];

      const mockProvider = {
        chat: jest.fn().mockResolvedValue({
          content: JSON.stringify(mockTasks),
          role: 'assistant'
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const result = await modelCoordinator.generateTasks(mockRequirements);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('设计用户注册界面');
      expect(result[0].estimatedHours).toBe(4);
    });
  });

  describe('API密钥验证', () => {
    it('应该能够验证有效的API密钥', async () => {
      const mockProvider = {
        validateApiKey: jest.fn().mockResolvedValue(true)
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const isValid = await modelCoordinator.validateModelApiKey(ChineseLLMType.DEEPSEEK);

      expect(isValid).toBe(true);
      expect(mockProvider.validateApiKey).toHaveBeenCalled();
    });

    it('应该能够检测无效的API密钥', async () => {
      const mockProvider = {
        validateApiKey: jest.fn().mockResolvedValue(false)
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const isValid = await modelCoordinator.validateModelApiKey(ChineseLLMType.DEEPSEEK);

      expect(isValid).toBe(false);
    });

    it('应该在验证过程中处理错误', async () => {
      const mockProvider = {
        validateApiKey: jest.fn().mockRejectedValue(new Error('网络错误'))
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const isValid = await modelCoordinator.validateModelApiKey(ChineseLLMType.DEEPSEEK);

      expect(isValid).toBe(false);
    });
  });

  describe('模型切换', () => {
    it('应该能够切换默认模型', () => {
      modelCoordinator.setDefaultModel(ChineseLLMType.ZHIPU_GLM);

      expect(modelCoordinator.getDefaultModel()).toBe(ChineseLLMType.ZHIPU_GLM);
    });

    it('应该能够获取模型信息', () => {
      const mockProvider = {
        getModelInfo: jest.fn().mockReturnValue({
          name: 'DeepSeek Chat',
          description: 'DeepSeek通用对话模型',
          maxTokens: 32768
        })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const info = modelCoordinator.getModelInfo(ChineseLLMType.DEEPSEEK);

      expect(info.name).toBe('DeepSeek Chat');
      expect(info.maxTokens).toBe(32768);
    });
  });

  describe('错误处理和重试', () => {
    it('应该能够处理临时网络错误', async () => {
      const mockProvider = {
        chat: jest.fn()
          .mockRejectedValueOnce(new Error('网络超时'))
          .mockResolvedValueOnce({
            content: '重试成功',
            role: 'assistant'
          })
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      const result = await modelCoordinator.chat([{ role: 'user', content: '测试' }]);

      expect(result.content).toBe('重试成功');
      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it('应该在多次重试失败后抛出错误', async () => {
      const mockProvider = {
        chat: jest.fn().mockRejectedValue(new Error('持续失败'))
      };

      (modelCoordinator as any).providers.set(ChineseLLMType.DEEPSEEK, mockProvider);

      await expect(
        modelCoordinator.chat([{ role: 'user', content: '测试' }])
      ).rejects.toThrow('持续失败');
    });
  });
});
