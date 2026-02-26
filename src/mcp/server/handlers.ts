/**
 * MCP 请求处理器
 */

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { toolRegistry } from '../tools/registry';
import { Logger } from '../../utils/logger';

export class MCPRequestHandlers {
  constructor(
    private server: Server,
    private logger: Logger,
    private toolExecutor: (name: string, args: any) => Promise<any>,
    private configProvider: () => any
  ) {}

  setup(): void {
    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = toolRegistry?.getAllTools() || [];
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.toolExecutor(name, args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  private setupResourceHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'taskflow://config',
          name: 'TaskFlow Configuration',
          mimeType: 'application/json',
          description: 'Current TaskFlow AI configuration',
        },
        {
          uri: 'taskflow://tools',
          name: 'Available Tools',
          mimeType: 'application/json',
          description: 'List of all available MCP tools',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;

      if (uri === 'taskflow://config') {
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(this.sanitizeConfig(this.configProvider()), null, 2),
          }],
        };
      }

      if (uri === 'taskflow://tools') {
        const tools = toolRegistry?.getAllTools() || [];
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(tools, null, 2),
          }],
        };
      }

      throw new Error(`Resource not found: ${uri}`);
    });
  }

  private setupPromptHandlers(): void {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [],
    }));

    this.server.setRequestHandler(GetPromptRequestSchema, async () => {
      throw new Error('Prompts not implemented');
    });
  }

  private sanitizeConfig(config: any): any {
    if (!config) return {};
    const sanitized = { ...config };
    if (sanitized.aiModels) {
      sanitized.aiModels = sanitized.aiModels.map((model: any) => ({
        ...model,
        apiKey: model.apiKey ? '***' : undefined,
      }));
    }
    return sanitized;
  }
}
