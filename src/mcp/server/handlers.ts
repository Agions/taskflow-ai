import { getLogger } from '../../utils/logger';
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
const logger = getLogger('mcp/server/handlers');

interface Config {
  aiModels?: Array<{ apiKey?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export class MCPRequestHandlers {
  constructor(
    private server: Server,
    private logger: Logger,
    private toolExecutor: (name: string, args: Record<string, unknown>) => Promise<unknown>,
    private configProvider: () => Config
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

      const registeredTool = toolRegistry?.getTool(name);
      if (!registeredTool) {
        this.logger.warn(`Attempted to call unregistered tool: ${name}`);
        return {
          content: [{ type: 'text', text: `Error: Tool not registered: ${name}` }],
          isError: true,
        };
      }

      try {
        const result = await this.toolExecutor(name, args as Record<string, unknown>);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
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
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(this.sanitizeConfig(this.configProvider()), null, 2),
            },
          ],
        };
      }

      if (uri === 'taskflow://tools') {
        const tools = toolRegistry?.getAllTools() || [];
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(tools, null, 2),
            },
          ],
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

  private sanitizeConfig(config: Config): Config {
    if (!config) return {};

    const sanitized = { ...config } as Config;
    if (sanitized.aiModels && Array.isArray(sanitized.aiModels)) {
      sanitized.aiModels = sanitized.aiModels.map(model => {
        const m = model as { apiKey?: string } & Record<string, unknown>;
        return {
          ...m,
          apiKey: m.apiKey ? '***' : undefined,
        };
      });
    }

    return sanitized;
  }
}
