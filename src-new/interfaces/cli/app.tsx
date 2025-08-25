#!/usr/bin/env node
/**
 * TaskFlow AI 2.0 主CLI应用
 * 整合所有重构组件，提供现代化的命令行界面
 */

import React, { useState, useEffect, useMemo } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { Command } from 'commander';
import chalk from 'chalk';

// 导入核心组件
import { TaskFlowEngine } from '../../core/engine';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';
import { SecurityManager } from '../../infrastructure/security/manager';
import { MCPConfigManager } from '../../infrastructure/config/mcp-config-manager';
import { MCPServerManager } from '../../integrations/mcp/server-manager';

// 导入界面组件
import WelcomeScreen from './components/WelcomeScreen';
import MainMenu from './components/MainMenu';
import TaskView from './components/TaskView';
import ConfigView from './components/ConfigView';
import MCPView from './components/MCPView';
import StatusBar from './components/StatusBar';

interface AppState {
  view: 'welcome' | 'menu' | 'tasks' | 'config' | 'mcp' | 'loading';
  loading: boolean;
  error?: string;
  initialized: boolean;
}

interface AppServices {
  engine?: TaskFlowEngine;
  configManager?: ConfigManager;
  cacheManager?: CacheManager;
  securityManager?: SecurityManager;
  mcpConfigManager?: MCPConfigManager;
  mcpServerManager?: MCPServerManager;
}

/**
 * 主CLI应用组件
 */
const TaskFlowApp: React.FC = () => {
  const { exit } = useApp();
  const [state, setState] = useState<AppState>({
    view: 'welcome',
    loading: true,
    initialized: false,
  });
  const [services, setServices] = useState<AppServices>({});

  // 初始化服务
  useEffect(() => {
    initializeServices();
  }, []);

  // 键盘输入处理
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      handleExit();
      return;
    }

    if (state.view === 'welcome' && (key.return || input === ' ')) {
      setState(prev => ({ ...prev, view: 'menu' }));
      return;
    }

    // 全局快捷键
    switch (input) {
      case 'q':
        if (state.view === 'menu') {
          handleExit();
        } else {
          setState(prev => ({ ...prev, view: 'menu' }));
        }
        break;
      case '1':
        if (state.view === 'menu') {
          setState(prev => ({ ...prev, view: 'tasks' }));
        }
        break;
      case '2':
        if (state.view === 'menu') {
          setState(prev => ({ ...prev, view: 'mcp' }));
        }
        break;
      case '3':
        if (state.view === 'menu') {
          setState(prev => ({ ...prev, view: 'config' }));
        }
        break;
    }
  });

  const initializeServices = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, view: 'loading' }));

      // 1. 初始化配置管理器
      const configManager = new ConfigManager();
      await configManager.initialize();

      // 2. 初始化缓存管理器
      const config = configManager.getAll();
      const cacheManager = new CacheManager(config.cache);
      await cacheManager.initialize();

      // 3. 初始化安全管理器
      const securityManager = new SecurityManager(config.security);
      await securityManager.initialize();

      // 4. 初始化MCP配置管理器
      const mcpConfigManager = new MCPConfigManager();
      await mcpConfigManager.initialize();

      // 5. 初始化MCP服务器管理器
      const mcpServerManager = new MCPServerManager(mcpConfigManager);
      await mcpServerManager.initialize();

      // 6. 初始化TaskFlow引擎
      const engine = new TaskFlowEngine({
        models: config.models,
        storage: {
          type: 'filesystem',
          path: configManager.get('project.workspaceDir'),
        },
        security: config.security,
        cache: config.cache,
      });
      await engine.initialize();

      setServices({
        engine,
        configManager,
        cacheManager,
        securityManager,
        mcpConfigManager,
        mcpServerManager,
      });

      setState(prev => ({
        ...prev,
        loading: false,
        initialized: true,
        view: 'welcome',
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '初始化失败',
        view: 'welcome',
      }));
    }
  };

  const handleExit = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // 优雅关闭所有服务
      if (services.mcpServerManager) {
        await services.mcpServerManager.shutdown();
      }
      if (services.engine) {
        await services.engine.shutdown();
      }
      if (services.securityManager) {
        await services.securityManager.shutdown();
      }
      if (services.cacheManager) {
        await services.cacheManager.shutdown();
      }
      if (services.configManager) {
        await services.configManager.shutdown();
      }
    } catch (error) {
      console.error('关闭服务时出错:', error);
    }

    exit();
  };

  const renderCurrentView = () => {
    switch (state.view) {
      case 'loading':
        return (
          <Box flexDirection="column" alignItems="center" justifyContent="center" height={10}>
            <Text color="blue">🚀 TaskFlow AI 正在启动...</Text>
            <Text color="gray">正在初始化服务...</Text>
          </Box>
        );

      case 'welcome':
        return (
          <WelcomeScreen
            initialized={state.initialized}
            error={state.error}
            onContinue={() => setState(prev => ({ ...prev, view: 'menu' }))}
          />
        );

      case 'menu':
        return (
          <MainMenu
            services={services}
            onNavigate={(view) => setState(prev => ({ ...prev, view }))}
            onExit={handleExit}
          />
        );

      case 'tasks':
        return (
          <TaskView
            engine={services.engine}
            onBack={() => setState(prev => ({ ...prev, view: 'menu' }))}
          />
        );

      case 'mcp':
        return (
          <MCPView
            mcpConfigManager={services.mcpConfigManager}
            mcpServerManager={services.mcpServerManager}
            onBack={() => setState(prev => ({ ...prev, view: 'menu' }))}
          />
        );

      case 'config':
        return (
          <ConfigView
            configManager={services.configManager}
            onBack={() => setState(prev => ({ ...prev, view: 'menu' }))}
          />
        );

      default:
        return <Text color="red">未知视图: {state.view}</Text>;
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* 主内容区域 */}
      <Box flexGrow={1}>
        {renderCurrentView()}
      </Box>

      {/* 状态栏 */}
      <StatusBar
        initialized={state.initialized}
        loading={state.loading}
        error={state.error}
        services={services}
      />
    </Box>
  );
};

/**
 * 命令行参数处理
 */
function setupCLI() {
  const program = new Command();

  program
    .name('taskflow')
    .description('TaskFlow AI - 智能PRD文档解析与任务管理助手')
    .version('2.0.0');

  // 交互式模式（默认）
  program
    .command('interactive', { isDefault: true })
    .alias('i')
    .description('启动交互式CLI界面')
    .action(() => {
      console.clear();
      render(<TaskFlowApp />);
    });

  // 解析PRD文档
  program
    .command('parse <file>')
    .description('解析PRD文档并生成任务')
    .option('-o, --output <file>', '输出文件路径')
    .option('-f, --format <format>', '输出格式 (json|markdown|csv)', 'json')
    .action(async (file, options) => {
      try {
        await executeParseCommand(file, options);
      } catch (error) {
        console.error(chalk.red('❌ 解析失败:'), error);
        process.exit(1);
      }
    });

  // 配置管理
  program
    .command('config')
    .description('配置管理')
    .option('-s, --set <key=value>', '设置配置项')
    .option('-g, --get <key>', '获取配置项')
    .option('-l, --list', '列出所有配置')
    .option('-r, --reset [key]', '重置配置')
    .action(async (options) => {
      try {
        await executeConfigCommand(options);
      } catch (error) {
        console.error(chalk.red('❌ 配置操作失败:'), error);
        process.exit(1);
      }
    });

  // MCP服务器管理
  program
    .command('mcp')
    .description('MCP服务器管理')
    .option('-l, --list', '列出所有MCP服务器')
    .option('-s, --start <server>', '启动MCP服务器')
    .option('-t, --stop <server>', '停止MCP服务器')
    .option('-r, --restart <server>', '重启MCP服务器')
    .option('--status', '显示服务器状态')
    .action(async (options) => {
      try {
        await executeMCPCommand(options);
      } catch (error) {
        console.error(chalk.red('❌ MCP操作失败:'), error);
        process.exit(1);
      }
    });

  return program;
}

/**
 * 执行解析命令
 */
async function executeParseCommand(file: string, options: any) {
  const configManager = new ConfigManager();
  await configManager.initialize();

  const config = configManager.getAll();
  const cacheManager = new CacheManager(config.cache);
  await cacheManager.initialize();

  const securityManager = new SecurityManager(config.security);
  await securityManager.initialize();

  const engine = new TaskFlowEngine({
    models: config.models,
    storage: { type: 'filesystem', path: process.cwd() },
    security: config.security,
    cache: config.cache,
  });
  
  await engine.initialize();

  console.log(chalk.blue('📄 开始解析PRD文档...'));
  
  const taskSet = await engine.parseDocument(file);
  const exported = await engine.exportTasks(taskSet.id, options.format);

  if (options.output) {
    const fs = await import('fs-extra');
    await fs.writeFile(options.output, exported);
    console.log(chalk.green(`✅ 结果已保存到: ${options.output}`));
  } else {
    console.log(exported);
  }

  await engine.shutdown();
  await securityManager.shutdown();
  await cacheManager.shutdown();
  await configManager.shutdown();
}

/**
 * 执行配置命令
 */
async function executeConfigCommand(options: any) {
  const configManager = new ConfigManager();
  await configManager.initialize();

  if (options.list) {
    const config = configManager.getAll();
    console.log(JSON.stringify(config, null, 2));
  } else if (options.get) {
    const value = configManager.get(options.get);
    console.log(JSON.stringify(value, null, 2));
  } else if (options.set) {
    const [key, value] = options.set.split('=');
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    await configManager.set(key, parsedValue);
    console.log(chalk.green(`✅ 配置已更新: ${key} = ${value}`));
  } else if (options.reset) {
    await configManager.reset(options.reset === true ? undefined : options.reset);
    console.log(chalk.green('✅ 配置已重置'));
  }

  await configManager.shutdown();
}

/**
 * 执行MCP命令
 */
async function executeMCPCommand(options: any) {
  const mcpConfigManager = new MCPConfigManager();
  await mcpConfigManager.initialize();

  const mcpServerManager = new MCPServerManager(mcpConfigManager);
  await mcpServerManager.initialize();

  if (options.list) {
    const servers = mcpConfigManager.getEnabledServers();
    console.table(servers.map(({ id, config }) => ({
      ID: id,
      Name: config.description || id,
      Type: config.httpUrl ? 'Remote' : 'Local',
      Enabled: config.enabled,
    })));
  } else if (options.status) {
    const statuses = mcpServerManager.getAllServerStatuses();
    console.table(statuses.map(status => ({
      ID: status.id,
      Name: status.name,
      Status: status.status,
      Uptime: `${Math.floor(status.uptime / 1000)}s`,
      Tools: status.tools.length,
      Resources: status.resources.length,
    })));
  } else if (options.start) {
    const config = mcpConfigManager.getServerConfig(options.start);
    if (!config) {
      throw new Error(`服务器不存在: ${options.start}`);
    }
    await mcpServerManager.startServer(options.start, config);
    console.log(chalk.green(`✅ 服务器已启动: ${options.start}`));
  } else if (options.stop) {
    await mcpServerManager.stopServer(options.stop);
    console.log(chalk.green(`✅ 服务器已停止: ${options.stop}`));
  } else if (options.restart) {
    await mcpServerManager.restartServer(options.restart);
    console.log(chalk.green(`✅ 服务器已重启: ${options.restart}`));
  }

  await mcpServerManager.shutdown();
}

// 主程序入口
if (require.main === module) {
  const program = setupCLI();
  
  // 处理未捕获的错误
  process.on('uncaughtException', (error) => {
    console.error(chalk.red('❌ 未捕获的异常:'), error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error(chalk.red('❌ 未处理的Promise拒绝:'), reason);
    process.exit(1);
  });

  // 解析命令行参数
  program.parse();
}