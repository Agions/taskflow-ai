import { getLogger } from '../../utils/logger';
const logger = getLogger('mcp/config/generator');

/**
 * MCP 配置文件生成器
 * 支持主流编辑器的自动配置
 */

export interface MCPConfigOptions {
  packageName: string;
  packageVersion?: string;
  registryUrl?: string;
  apiKey?: string;
  env?: Record<string, string>;
}

export interface EditorConfig {
  name: string;
  configPath: string;
  config: Record<string, unknown>;
}

/**
 * 生成 Cursor MCP 配置
 */
export function generateCursorConfig(options: MCPConfigOptions): EditorConfig {
  const { packageName, packageVersion, apiKey, env = {} } = options;

  return {
    name: 'Cursor',
    configPath: '~/.cursor/mcp.json',
    config: {
      mcpServers: {
        [packageName]: {
          command: 'npx',
          args: ['-y', `${packageName}${packageVersion ? `@${packageVersion}` : ''}`],
          env: {
            ...(apiKey
              ? { [apiKey.startsWith('TASKFLOW_') ? apiKey : 'TASKFLOW_API_KEY']: `{{${apiKey}}}` }
              : {}),
            ...env,
          },
        },
      },
    },
  };
}

/**
 * 生成 Claude Desktop MCP 配置
 */
export function generateClaudeDesktopConfig(options: MCPConfigOptions): EditorConfig {
  const { packageName, packageVersion, apiKey, env = {} } = options;

  return {
    name: 'Claude Desktop',
    configPath: '~/Library/Application Support/Claude/claude_desktop_config.json',
    config: {
      mcpServers: {
        [packageName]: {
          command: 'npx',
          args: ['-y', `${packageName}${packageVersion ? `@${packageVersion}` : ''}`],
          env: {
            ...(apiKey ? { TASKFLOW_API_KEY: `{{${apiKey}}}` } : {}),
            ...env,
          },
        },
      },
    },
  };
}

/**
 * 生成 VSCode MCP 配置 (通过 extension)
 */
export function generateVSCodeConfig(options: MCPConfigOptions): EditorConfig {
  const { packageName, packageVersion, apiKey, env = {} } = options;

  return {
    name: 'VSCode',
    configPath: '~/.vscode/extensions/<your-extension>/mcp.json',
    config: {
      mcpServers: {
        [packageName]: {
          command: 'npx',
          args: ['-y', `${packageName}${packageVersion ? `@${packageVersion}` : ''}`],
          env: {
            ...(apiKey ? { TASKFLOW_API_KEY: `{{${apiKey}}}` } : {}),
            ...env,
          },
        },
      },
    },
  };
}

/**
 * 生成 Windsurf MCP 配置
 */
export function generateWindsurfConfig(options: MCPConfigOptions): EditorConfig {
  const { packageName, packageVersion, apiKey, env = {} } = options;

  return {
    name: 'Windsurf',
    configPath: '~/.windsurf/mcp.json',
    config: {
      mcpServers: {
        [packageName]: {
          command: 'npx',
          args: ['-y', `${packageName}${packageVersion ? `@${packageVersion}` : ''}`],
          env: {
            ...(apiKey ? { TASKFLOW_API_KEY: `{{${apiKey}}}` } : {}),
            ...env,
          },
        },
      },
    },
  };
}

/**
 * 生成 Trae MCP 配置
 */
export function generateTraeConfig(options: MCPConfigOptions): EditorConfig {
  const { packageName, packageVersion, apiKey, env = {} } = options;

  return {
    name: 'Trae',
    configPath: '~/.trae/mcp.json',
    config: {
      mcpServers: {
        [packageName]: {
          command: 'npx',
          args: ['-y', `${packageName}${packageVersion ? `@${packageVersion}` : ''}`],
          env: {
            ...(apiKey ? { TASKFLOW_API_KEY: `{{${apiKey}}}` } : {}),
            ...env,
          },
        },
      },
    },
  };
}

/**
 * 生成 Zed MCP 配置
 */
export function generateZedConfig(options: MCPConfigOptions): EditorConfig {
  const { packageName, packageVersion, apiKey, env = {} } = options;

  return {
    name: 'Zed',
    configPath: '~/.zed/settings.json',
    config: {
      assistant: {
        version: '1.0.0',
        mcp: {
          [packageName]: {
            command: 'npx',
            args: ['-y', `${packageName}${packageVersion ? `@${packageVersion}` : ''}`],
            env: {
              ...(apiKey ? { TASKFLOW_API_KEY: `{{${apiKey}}}` } : {}),
              ...env,
            },
          },
        },
      },
    },
  };
}

/**
 * 生成所有编辑器的配置
 */
export function generateAllConfigs(options: MCPConfigOptions): EditorConfig[] {
  return [
    generateCursorConfig(options),
    generateClaudeDesktopConfig(options),
    generateVSCodeConfig(options),
    generateWindsurfConfig(options),
    generateTraeConfig(options),
    generateZedConfig(options),
  ];
}

/**
 * 导出配置为指定格式
 */
export function exportConfig(config: EditorConfig, format: 'json' | 'yaml' = 'json'): string {
  if (format === 'yaml') {
    // 简单转换
    const yaml = `\
# ${config.name} MCP Configuration
# Path: ${config.configPath}

${JSON.stringify(config.config, null, 2)}
`;
    return yaml;
  }

  return JSON.stringify(config.config, null, 2);
}
