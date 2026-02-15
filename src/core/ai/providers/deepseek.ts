/**
 * DeepSeek AI 服务实现
 */

import axios, { AxiosInstance } from 'axios';
import { AIModelConfig, PRDDocument, Task } from '../../../types';
import { AIService, GeneratedTask, DependencyAnalysis, PRDAnalysis, AIRequest, AIResponse } from '../index';
import { Logger } from '../../../utils/logger';

export class DeepSeekService implements AIService {
  readonly provider = 'deepseek' as const;
  readonly modelName: string;
  
  private client: AxiosInstance;
  private config: AIModelConfig;
  private logger: Logger;
  private baseURL = 'https://api.deepseek.com/v1';

  constructor(config: AIModelConfig) {
    this.config = config;
    this.modelName = config.modelName || 'deepseek-chat';
    this.logger = Logger.getInstance('DeepSeekService');
    
    this.client = axios.create({
      baseURL: config.endpoint || this.baseURL,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60秒超时
    });

    // 响应拦截器
    this.client.interceptors.response.use(
      response => response,
      error => {
        this.logger.error('DeepSeek API 错误:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * 发送请求到 DeepSeek API
   */
  private async sendRequest(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.modelName,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt }
        ],
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? this.config.maxTokens ?? 4000,
      });

      const data = response.data;
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        model: data.model || this.modelName,
        provider: 'deepseek',
      };
    } catch (error) {
      this.logger.error('DeepSeek 请求失败:', error);
      throw error;
    }
  }

  /**
   * 生成任务列表
   */
  async generateTasks(prdDocument: PRDDocument): Promise<GeneratedTask[]> {
    const systemPrompt = `你是一个专业的项目管理助手，擅长从 PRD 文档中提取任务并生成详细的开发计划。
请根据提供的 PRD 文档内容，生成结构化的任务列表。

输出格式必须是 JSON：
{
  "tasks": [
    {
      "title": "任务标题",
      "description": "详细描述",
      "type": "frontend|backend|database|testing|deployment|documentation|research|design",
      "priority": "low|medium|high|critical",
      "complexity": "simple|medium|complex",
      "estimatedHours": 数字,
      "dependencies": ["依赖任务标题"],
      "tags": ["标签1", "标签2"]
    }
  ]
}`;

    const prompt = `请分析以下 PRD 文档，生成开发任务列表：

文档标题: ${prdDocument.title}

文档内容:
${prdDocument.content}

请生成详细的任务列表，包括前端、后端、数据库、测试、部署等各阶段的任务。`;

    const response = await this.sendRequest({
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 4000,
    });

    try {
      // 提取 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.tasks || [];
    } catch (error) {
      this.logger.error('解析任务 JSON 失败:', error);
      this.logger.debug('原始响应:', response.content);
      throw new Error('AI 响应格式错误');
    }
  }

  /**
   * 估算任务工时
   */
  async estimateHours(taskDescription: string): Promise<number> {
    const systemPrompt = `你是一个经验丰富的项目经理，擅长估算开发工时。
请根据任务描述，给出一个合理的工时估算（小时数）。
只返回一个数字，表示预估的小时数。`;

    const prompt = `请估算以下任务的开发工时：

任务描述: ${taskDescription}

请只返回一个数字（小时）。`;

    const response = await this.sendRequest({
      prompt,
      systemPrompt,
      temperature: 0.2,
      maxTokens: 100,
    });

    // 提取数字
    const match = response.content.match(/(\d+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      return Math.max(1, Math.min(hours, 1000)); // 限制在 1-1000 小时
    }
    
    return 8; // 默认 8 小时
  }

  /**
   * 分析任务依赖关系
   */
  async analyzeDependencies(tasks: Task[]): Promise<DependencyAnalysis[]> {
    const systemPrompt = `你是一个架构师，擅长分析任务之间的依赖关系。
请分析给定的任务列表，识别任务之间的依赖关系。

输出格式必须是 JSON：
{
  "dependencies": [
    {
      "taskId": "任务ID",
      "dependsOn": ["依赖任务ID1", "依赖任务ID2"],
      "reason": "依赖原因说明"
    }
  ]
}`;

    const tasksText = tasks.map(t => `
ID: ${t.id}
标题: ${t.title}
类型: ${t.type}
描述: ${t.description}
`).join('\n---\n');

    const prompt = `请分析以下任务的依赖关系：

${tasksText}

请识别哪些任务需要在其他任务之前完成，并说明原因。`;

    const response = await this.sendRequest({
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [];
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.dependencies || [];
    } catch (error) {
      this.logger.error('解析依赖关系失败:', error);
      return [];
    }
  }

  /**
   * 分析 PRD 文档结构
   */
  async analyzePRDStructure(content: string): Promise<PRDAnalysis> {
    const systemPrompt = `你是一个专业的需求分析师，擅长分析 PRD 文档结构。
请分析文档内容，提取关键信息。

输出格式必须是 JSON：
{
  "title": "文档标题",
  "sections": [
    {
      "title": "章节标题",
      "type": "overview|requirements|functional|technical|ui-ux|acceptance",
      "requirements": ["需求1", "需求2"]
    }
  ],
  "complexity": "simple|medium|complex|epic",
  "estimatedTotalHours": 数字
}`;

    const prompt = `请分析以下 PRD 文档的结构：

${content.substring(0, 8000)} // 限制长度

请提取文档标题、章节结构、需求列表，并评估项目复杂度。`;

    const response = await this.sendRequest({
      prompt,
      systemPrompt,
      temperature: 0.3,
      maxTokens: 3000,
    });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析 PRD 分析结果');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('解析 PRD 分析失败:', error);
      
      // 返回默认分析
      return {
        title: '未命名文档',
        sections: [],
        complexity: 'medium',
        estimatedTotalHours: 80,
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 发送一个简单的请求检查服务可用性
      await this.client.post('/chat/completions', {
        model: this.modelName,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
