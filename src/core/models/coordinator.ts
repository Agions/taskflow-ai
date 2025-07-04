import { ModelFactory } from './factory';
import { ConfigManager } from '../../infra/config';
import { ModelType } from '../../types/config';
import {
  ChatMessage,
  ModelCallOptions,
  ModelResponse,
  ParseOptions,
  PlanningOptions,
  TestGenerationOptions,
  MessageRole
} from '../../types/model';
import { ParsedPRD } from '../../types/task';

/**
 * 模型协调器
 * 负责协调多个模型的使用，根据任务类型选择合适的模型
 */
export class ModelCoordinator {
  private modelFactory: ModelFactory;
  private configManager: ConfigManager;

  /**
   * 创建模型协调器实例
   * @param configManager 配置管理器实例
   */
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.modelFactory = new ModelFactory(configManager);
  }

  /**
   * 执行聊天请求
   * @param messages 消息数组
   * @param modelType 模型类型，不传时使用默认模型
   * @param options 调用选项
   */
  public async chat(
    messages: ChatMessage[],
    modelType?: ModelType,
    options?: ModelCallOptions
  ): Promise<ModelResponse> {
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
  public async chatStream(
    messages: ChatMessage[],
    onData: (content: string, done: boolean) => void,
    modelType?: ModelType,
    options?: ModelCallOptions
  ): Promise<void> {
    const adapter = this.modelFactory.createModelAdapter(modelType);
    return await adapter.chatStream({ messages }, onData, options);
  }

  /**
   * 执行PRD解析任务
   * @param content PRD文档内容
   * @param options 解析选项
   */
  public async parsePRD(content: string, options?: ParseOptions): Promise<ModelResponse> {
    const modelType = options?.modelType || this.configManager.getDefaultModelType();
    
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
    
    const messages: ChatMessage[] = [
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
  public async planTasks(parsedPRD: ParsedPRD, options?: PlanningOptions): Promise<ModelResponse> {
    const modelType = options?.modelType || this.configManager.getDefaultModelType();
    
    // 构建系统提示词
    const systemPrompt = `你是一位专业的项目规划师，请根据解析后的PRD内容，生成详细的任务计划。
请按照以下要求拆分任务：
1. 将大的功能需求拆分为更小的可执行子任务
2. 为每个任务分配合理的优先级和类型标签
3. 确定任务之间的依赖关系
4. ${options?.estimateDuration ? '估算每个任务的完成时间（以小时为单位）' : ''}
5. ${options?.assignTasks ? '为每个任务分配合适的角色' : ''}

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
      ${options?.estimateDuration ? '"estimatedDuration": 预计耗时（小时）,' : ''}
      ${options?.assignTasks ? '"assignee": "负责角色",' : ''}
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

${options?.taskTemplate ? `请参考以下任务模板进行规划：\n${options.taskTemplate}` : ''}

请生成详细的任务计划，按照要求的JSON格式返回结果。`;
    
    const messages: ChatMessage[] = [
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
  public async generateTests(taskDescription: string, options?: TestGenerationOptions): Promise<ModelResponse> {
    const modelType = options?.modelType || this.configManager.getDefaultModelType();
    const framework = options?.framework || this.configManager.get<string>('testSettings.framework', 'jest');
    
    // 构建系统提示词
    const systemPrompt = `你是一位专业的测试工程师，请根据任务描述，生成详细的测试用例。
请使用 ${framework} 测试框架编写测试代码。
要求：
1. 测试需要覆盖正常功能路径
2. ${options?.includeEdgeCases ? '测试需要覆盖边界条件和异常情况' : ''}
3. ${options?.mockDependencies ? '使用mock/stub处理外部依赖' : ''}
4. 测试代码应该清晰可读，包含必要的注释
5. 遵循测试框架的最佳实践

请输出完整可执行的测试代码。`;
    
    // 用户消息
    const userPrompt = `以下是需要编写测试用例的任务描述：

${taskDescription}

请为此任务生成测试用例。`;
    
    const messages: ChatMessage[] = [
      { role: MessageRole.SYSTEM, content: systemPrompt },
      { role: MessageRole.USER, content: userPrompt }
    ];
    
    return await this.chat(messages, modelType);
  }
  
  /**
   * 获取可用的模型类型列表
   */
  public getAvailableModelTypes(): ModelType[] {
    return this.modelFactory.getAvailableModelTypes();
  }
  
  /**
   * 验证指定类型模型的API密钥
   * @param modelType 模型类型
   */
  public async validateModelApiKey(modelType: ModelType): Promise<boolean> {
    return await this.modelFactory.validateModelApiKey(modelType);
  }
} 