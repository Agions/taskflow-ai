#!/usr/bin/env node
import { getLogger } from '../utils/logger';
/**
 * MCP Stdio Server Entry Point
 * 用于编辑器集成的标准输入输出模式 MCP 服务器
 */

import { MCPServer } from './server';
import { ConfigManager } from '../core/config';
const logger = getLogger('mcp/stdio-server');

async function main() {
  try {
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    const effectiveConfig = config || {
      projectName: 'taskflow-ai',
      version: '2.0.0',
      aiModels: [],
      mcpSettings: {
        enabled: true,
        port: 3000,
        host: 'localhost',
        serverName: 'taskflow-ai',
        version: '2.0.0',
        capabilities: [],
        security: {
          authRequired: false,
          allowedOrigins: [],
          rateLimit: {
            enabled: false,
            maxRequests: 100,
            windowMs: 60000,
          },
          sandbox: {
            enabled: true,
            timeout: 30000,
            memoryLimit: 512,
          },
        },
        tools: [],
        resources: [],
      },
      outputFormats: ['markdown', 'json'],
      plugins: [],
    };

    const mcpSettings = {
      serverName: 'taskflow-ai',
      version: '2.0.0',
    };

    const mcpServer = new MCPServer(mcpSettings, effectiveConfig);
    await mcpServer.start();
  } catch (error) {
    logger.error('MCP Server Error:', error);
    process.exit(1);
  }
}

main();
