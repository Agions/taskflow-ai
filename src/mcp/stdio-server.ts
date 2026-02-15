#!/usr/bin/env node
/**
 * MCP Stdio Server Entry Point
 * 用于编辑器集成的标准输入输出模式 MCP 服务器
 */

import { MCPServer } from './server';
import { ConfigManager } from '../core/config';

async function main() {
  try {
    // 加载配置
    const configManager = new ConfigManager();
    const config = await configManager.loadConfig();

    // 如果没有配置，使用默认配置
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

    // 创建MCP服务器设置
    const mcpSettings = {
      serverName: 'taskflow-ai',
      version: '2.0.0',
    };

    // 创建并启动MCP服务器
    const mcpServer = new MCPServer(mcpSettings, effectiveConfig);
    await mcpServer.start();

    // 服务器会持续运行直到进程结束
  } catch (error) {
    console.error('MCP Server Error:', error);
    process.exit(1);
  }
}

main();
