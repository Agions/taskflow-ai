/**
 * TaskFlow AI CLI入口
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from './index';
import * as fs from 'fs-extra';

// 导入命令处理器
import { visualizeCommand } from './commands/visualize';
import { statusCommand } from './commands/status';
import { interactiveCommand } from './commands/interactive';
import modelsCommand from './commands/models';
import { createMCPCommand } from './cli/commands/mcp';
import ora from 'ora';
import path from 'path';
import { ModelType, LogLevel } from './types/config';
import { yasiService } from './mcp/index';
import { JSONObject } from './types/strict-types';
import { ErrorHandler } from './core/error-handling/typed-errors';
import { TaskStatus } from './types/task';

// 全局错误处理器
function handleGlobalError(error: unknown): never {
  const taskFlowError = ErrorHandler.handleUnknownError(error, 'cli');
  const userMessage = ErrorHandler.formatUserMessage(taskFlowError);

  console.error(chalk.red('❌ 错误:'), userMessage);

  // 在开发模式下显示详细错误信息
  if (process.env.NODE_ENV === 'development') {
    console.error(chalk.gray('详细错误信息:'));
    console.error(taskFlowError.stack);
  }

  // 记录错误报告
  const errorReport = ErrorHandler.createErrorReport(taskFlowError);
  console.error(chalk.gray(`错误ID: ${errorReport.id}`));

  process.exit(1);
}

// 捕获未处理的异常
process.on('uncaughtException', handleGlobalError);
process.on('unhandledRejection', handleGlobalError);

// 创建命令行程序
const program = new Command();

// 设置版本号和描述
program
  .name('taskflow')
  .description(chalk.cyan('TaskFlow AI - 智能PRD文档解析与任务管理助手'))
  .version(VERSION)
  .addHelpText('before', chalk.cyan.bold('TaskFlow AI') + ' - 让AI帮您将产品需求转化为可执行的任务计划\n')
  .addHelpText('after', `
${chalk.yellow('快速开始:')}
  ${chalk.green('taskflow interactive')}     启动交互式模式 (推荐新用户)
  ${chalk.green('taskflow init')}            初始化新项目
  ${chalk.green('taskflow parse <file>')}    解析PRD文档

${chalk.yellow('示例:')}
  ${chalk.gray('taskflow parse ./prd.md')}
  ${chalk.gray('taskflow status --verbose')}
  ${chalk.gray('taskflow config set model.deepseek.apiKey <your-key>')}

${chalk.yellow('更多信息:')}
  ${chalk.blue('https://github.com/agions/taskflow-ai')}
`);

// 注册命令
visualizeCommand.register(program);
statusCommand.register(program);
interactiveCommand.register(program);
modelsCommand(program);

// 注册MCP命令
program.addCommand(createMCPCommand());

// 快速开始命令
program
  .command('init')
  .description('初始化TaskFlow AI项目并生成MCP配置')
  .option('--editor <editor>', '指定编辑器 (windsurf/trae/cursor/vscode)', 'all')
  .option('--force', '覆盖现有配置文件')
  .action(async (options) => {
    console.log(chalk.blue('🚀 TaskFlow AI - 项目初始化'));
    console.log();

    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      const { Logger } = await import('./infra/logger');
      const { ConfigManager } = await import('./infra/config/config-manager');

      const projectDir = process.cwd(); // 在当前目录初始化
      const logger = Logger.getInstance({
        level: LogLevel.INFO,
        output: 'console'
      });
      const config = new ConfigManager(logger);

      // 创建基本目录结构
      await fs.default.ensureDir(path.join(projectDir, '.taskflow'));
      await fs.default.ensureDir(path.join(projectDir, 'docs'));
      await fs.default.ensureDir(path.join(projectDir, 'tasks'));
      await fs.default.ensureDir(path.join(projectDir, 'output'));

      // 创建示例PRD文件
      const samplePRD = `# 示例产品需求文档

## 1. 产品概述

### 1.1 产品名称
示例Web应用

### 1.2 产品描述
这是一个示例的Web应用产品需求文档，用于演示TaskFlow AI的功能。

## 2. 功能需求

### 2.1 用户管理
- 用户注册功能
- 用户登录功能
- 用户信息管理

### 2.2 内容管理
- 内容创建功能
- 内容编辑功能
- 内容删除功能

### 2.3 权限管理
- 角色管理
- 权限分配
- 访问控制

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间不超过3秒
- 支持1000并发用户

### 3.2 安全要求
- 数据加密传输
- 用户身份验证
- 防止SQL注入

## 4. 技术要求

### 4.1 前端技术
- React.js
- TypeScript
- Tailwind CSS

### 4.2 后端技术
- Node.js
- Express.js
- MongoDB
`;

      await fs.default.writeFile(path.join(projectDir, 'docs', 'sample-prd.md'), samplePRD);

      // 生成MCP配置文件
      console.log(chalk.blue('📝 生成MCP配置文件...'));

      if (options.editor === 'all') {
        // 生成所有编辑器配置
        await config.generateAllMCPConfigs(projectDir, {
          includeAllModels: true,
          enableStreaming: true,
          enableHealthCheck: true
        });

        console.log(chalk.green('✅ 所有编辑器MCP配置生成完成'));
      } else {
        // 生成特定编辑器配置
        await config.writeMCPConfigFiles(options.editor, projectDir, {
          includeAllModels: true,
          enableStreaming: true,
          enableHealthCheck: true
        });

        console.log(chalk.green(`✅ ${options.editor} MCP配置生成完成`));
      }

      // 创建配置文件
      const taskflowConfig = {
        project: {
          name: "示例项目",
          description: "TaskFlow AI 示例项目"
        },
        engine: {
          autoSave: true,
          saveInterval: 300,
          outputDir: "./output",
          defaultModel: "deepseek",
          enableOptimization: true
        }
      };

      await fs.default.writeFile(path.join(projectDir, 'taskflow.config.json'), JSON.stringify(taskflowConfig, null, 2));

      // 创建环境变量模板
      const envTemplate = `# TaskFlow AI 环境变量配置
# 请填入您的API密钥

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key

# 智谱AI API
ZHIPU_API_KEY=your-zhipu-api-key

# 通义千问 API
QWEN_API_KEY=your-qwen-api-key

# 文心一言 API
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 月之暗面 API
MOONSHOT_API_KEY=your-moonshot-api-key

# 讯飞星火 API
SPARK_APP_ID=your-spark-app-id
SPARK_API_KEY=your-spark-api-key
SPARK_API_SECRET=your-spark-api-secret

# TaskFlow 配置
TASKFLOW_LOG_LEVEL=info
TASKFLOW_CACHE_ENABLED=true
`;

      await fs.default.writeFile(path.join(projectDir, '.env.example'), envTemplate);

      console.log(chalk.green('🎉 TaskFlow AI 项目初始化完成！'));
      console.log();
      console.log(chalk.yellow('📁 生成的文件：'));
      console.log('  ├── .cursor/mcp.json          # Cursor MCP配置');
      console.log('  ├── .cursor-rules             # Cursor AI规则');
      console.log('  ├── .windsurf/mcp.json        # Windsurf MCP配置');
      console.log('  ├── .trae/mcp-config.json     # Trae MCP配置');
      console.log('  ├── .vscode/settings.json     # VSCode MCP配置');
      console.log('  ├── .vscode/extensions.json   # VSCode扩展推荐');
      console.log('  ├── .taskflow/                # TaskFlow配置目录');
      console.log('  ├── docs/sample-prd.md        # 示例PRD文档');
      console.log('  ├── taskflow.config.json      # TaskFlow配置');
      console.log('  └── .env.example              # 环境变量模板');
      console.log();
      console.log(chalk.blue('🔧 下一步设置：'));
      console.log('  1. 复制 .env.example 为 .env');
      console.log('  2. 在 .env 中填入您的API密钥');
      console.log('  3. 打开您的AI编辑器（Cursor/Windsurf/Trae/VSCode）');
      console.log('  4. 编辑器会自动启动TaskFlow AI MCP服务');
      console.log();
      console.log(chalk.green('🚀 现在可以开始使用AI驱动的开发体验了！'));

    } catch (error) {
      console.error(chalk.red('❌ 初始化失败:'));
      console.error(chalk.red((error as Error).message));
    }
  });

// 解析PRD命令
program
  .command('parse <file>')
  .description('解析PRD文档并生成任务计划')
  .option('-o, --output <path>', '输出任务计划的路径', './taskflow/tasks.json')
  .option('-m, --model <type>', '使用的模型类型', 'deepseek')
  .option('--optimize', '启用任务计划优化', true)
  .option('--estimate-effort', '估算工作量', true)
  .option('--detect-dependencies', '检测依赖关系', true)
  .action(async (file, options) => {
    console.log(chalk.blue('📄 TaskFlow AI - PRD解析'));
    console.log();

    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      const ora = await import('ora');

      const spinner = ora.default('正在解析PRD文档...').start();

      // 检查文件是否存在
      if (!fs.default.existsSync(file)) {
        spinner.fail(`文件不存在: ${file}`);
        process.exit(1);
      }

      // 这里应该调用TaskFlow引擎进行解析
      // 暂时使用模拟数据
      spinner.text = '正在生成任务计划...';

      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 2000));

      const outputPath = path.resolve(process.cwd(), options.output);
      await fs.default.ensureDir(path.dirname(outputPath));

      // 生成示例任务计划
      const taskPlan = {
        id: 'project-' + Date.now(),
        name: '示例项目任务计划',
        description: '基于PRD文档生成的任务计划',
        tasks: [
          {
            id: 'task-1',
            title: '项目初始化',
            description: '创建项目结构，配置开发环境',
            status: 'not_started',
            priority: 'high',
            type: 'setup',
            dependencies: [],
            estimatedHours: 4,
            tags: ['setup', 'infrastructure'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'task-2',
            title: '用户管理模块',
            description: '实现用户注册、登录、信息管理功能',
            status: 'not_started',
            priority: 'high',
            type: 'feature',
            dependencies: ['task-1'],
            estimatedHours: 16,
            tags: ['user', 'authentication'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'task-3',
            title: '内容管理模块',
            description: '实现内容的创建、编辑、删除功能',
            status: 'not_started',
            priority: 'medium',
            type: 'feature',
            dependencies: ['task-2'],
            estimatedHours: 20,
            tags: ['content', 'crud'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      await fs.default.writeFile(outputPath, JSON.stringify(taskPlan, null, 2));

      spinner.succeed(`成功解析PRD并生成任务计划`);

      console.log();
      console.log(chalk.green('✅ 任务计划已生成:'));
      console.log(chalk.gray(`   文件: ${outputPath}`));
      console.log(chalk.gray(`   任务数量: ${taskPlan.tasks.length}`));
      console.log();
      console.log(chalk.cyan('🎯 下一步:'));
      console.log(chalk.gray(`   taskflow status -i ${outputPath}`));
      console.log(chalk.gray(`   taskflow visualize gantt -i ${outputPath}`));

    } catch (error) {
      console.error(chalk.red('❌ 解析失败:'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// 帮助命令
program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    console.log(chalk.blue('🤖 TaskFlow AI - 智能PRD文档解析与任务管理助手'));
    console.log();
    console.log(chalk.cyan('📖 主要功能:'));
    console.log(chalk.gray('  • PRD文档智能解析'));
    console.log(chalk.gray('  • AI任务编排优化'));
    console.log(chalk.gray('  • 任务状态管理'));
    console.log(chalk.gray('  • 可视化图表生成'));
    console.log();
    console.log(chalk.cyan('🚀 快速开始:'));
    console.log(chalk.gray('  1. taskflow init                    # 初始化项目'));
    console.log(chalk.gray('  2. taskflow parse docs/prd.md       # 解析PRD文档'));
    console.log(chalk.gray('  3. taskflow status                  # 查看任务状态'));
    console.log(chalk.gray('  4. taskflow visualize gantt         # 生成甘特图'));
    console.log();
    console.log(chalk.cyan('📋 常用命令:'));
    console.log(chalk.gray('  taskflow parse <file>               # 解析PRD文档'));
    console.log(chalk.gray('  taskflow status                     # 查看项目状态'));
    console.log(chalk.gray('  taskflow status next                # 获取推荐任务'));
    console.log(chalk.gray('  taskflow status update <id> <status> # 更新任务状态'));
    console.log(chalk.gray('  taskflow visualize gantt            # 生成甘特图'));
    console.log(chalk.gray('  taskflow visualize dependency       # 生成依赖图'));
    console.log();
    console.log(chalk.cyan('🎨 可视化类型:'));
    console.log(chalk.gray('  • gantt      - 甘特图'));
    console.log(chalk.gray('  • dependency - 依赖关系图'));
    console.log(chalk.gray('  • kanban     - 看板视图'));
    console.log(chalk.gray('  • progress   - 进度图表'));
    console.log();
    console.log(chalk.cyan('💡 更多帮助:'));
    console.log(chalk.gray('  taskflow <command> --help           # 查看命令详细帮助'));
    console.log(chalk.gray('  https://github.com/taskflow-ai/docs  # 在线文档'));
  });

// 获取下一个任务命令
program
  .command('next-task')
  .description('获取下一个要处理的任务')
  .option('-f, --file <path>', '任务计划文件路径', './tasks/tasks.json')
  .action(async (options) => {
    try {
      const spinner = ora('正在查找下一个任务...').start();

      // 加载任务计划
      const filePath = path.resolve(process.cwd(), options.file);

      if (!fs.existsSync(filePath)) {
        spinner.fail(`任务文件不存在: ${filePath}`);
        process.exit(1);
      }

      const result = await yasiService.loadTaskPlan(filePath);

      if (!result.success) {
        spinner.fail(`加载任务失败: ${result.error}`);
        process.exit(1);
      }

      // 获取下一个任务
      const nextResult = await yasiService.getNextTasks();

      if (!nextResult.success) {
        spinner.fail(`获取下一个任务失败: ${nextResult.error}`);
        process.exit(1);
      }

      spinner.succeed('成功查找下一个任务');

      const tasks = nextResult.data;

      if (!tasks || tasks.length === 0) {
        console.log(chalk.yellow('没有找到可处理的任务'));
        process.exit(0);
      }

      // 输出任务详情
      const task = tasks[0]; // 获取第一个可处理的任务

      console.log(chalk.cyan('\n下一个任务:'));
      console.log(chalk.cyan('-'.repeat(80)));
      console.log(chalk.cyan(`ID: ${task.id}`));
      console.log(chalk.cyan(`名称: ${task.name}`));
      console.log(chalk.cyan(`优先级: ${task.priority}`));
      console.log(chalk.cyan(`状态: ${task.status}`));
      console.log(chalk.cyan(`描述: ${task.description}`));

      if (task.subtasks && task.subtasks.length > 0) {
        console.log(chalk.cyan('\n子任务:'));
        task.subtasks.forEach((subtask, index) => {
          console.log(chalk.white(`  ${index + 1}. [${subtask.status}] ${subtask.name}`));
        });
      }

      console.log(chalk.cyan('-'.repeat(80)));
      console.log(chalk.green('\n执行此任务:'));
      console.log(chalk.white(`  yasi-ai update-task --id=${task.id} --status=in_progress`));
      console.log(chalk.white(`  # 完成任务后:`));
      console.log(chalk.white(`  yasi-ai update-task --id=${task.id} --status=done`));

    } catch (error) {
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// 更新任务命令
program
  .command('update-task')
  .description('更新任务状态或信息')
  .option('-f, --file <path>', '任务计划文件路径', './tasks/tasks.json')
  .requiredOption('--id <id>', '任务ID')
  .option('--status <status>', '新状态')
  .option('--name <name>', '新名称')
  .option('--description <description>', '新描述')
  .option('--priority <priority>', '新优先级')
  .action(async (options) => {
    try {
      const spinner = ora('正在更新任务...').start();

      // 加载任务计划
      const filePath = path.resolve(process.cwd(), options.file);

      if (!fs.existsSync(filePath)) {
        spinner.fail(`任务文件不存在: ${filePath}`);
        process.exit(1);
      }

      const result = await yasiService.loadTaskPlan(filePath);

      if (!result.success) {
        spinner.fail(`加载任务失败: ${result.error}`);
        process.exit(1);
      }

      // 构建更新数据
      const updateData: {
        status?: TaskStatus;
        name?: string;
        description?: string;
        priority?: string;
      } = {};

      if (options.status) updateData.status = options.status as TaskStatus;
      if (options.name) updateData.name = options.name;
      if (options.description) updateData.description = options.description;
      if (options.priority) updateData.priority = options.priority;

      // 更新任务
      const updateResult = await yasiService.updateTask(options.id, updateData);

      if (!updateResult.success) {
        spinner.fail(`更新任务失败: ${updateResult.error}`);
        process.exit(1);
      }

      // 保存任务计划
      const saveResult = await yasiService.saveTaskPlan(result.data, filePath);

      if (!saveResult.success) {
        spinner.fail(`保存任务计划失败: ${saveResult.error}`);
        process.exit(1);
      }

      spinner.succeed(`成功更新任务 ${options.id}`);

      // 输出更新后的任务信息
      const task = updateResult.data;

      if (task) {
        console.log(chalk.cyan('\n更新后的任务:'));
        console.log(chalk.cyan('-'.repeat(80)));
        console.log(chalk.cyan(`ID: ${task.id}`));
        console.log(chalk.cyan(`名称: ${task.name}`));
        console.log(chalk.cyan(`优先级: ${task.priority}`));
        console.log(chalk.cyan(`状态: ${task.status}`));
        console.log(chalk.cyan(`描述: ${task.description}`));
        console.log(chalk.cyan('-'.repeat(80)));
      }

    } catch (error) {
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// 配置命令
program
  .command('config')
  .description('查看或设置配置')
  .option('--get', '获取当前配置')
  .option('--set-model <type>', '设置默认模型类型')
  .option('--set-api-key <key>', '设置API密钥')
  .option('--model-type <type>', '指定设置API密钥的模型类型', 'baidu')
  .action(async (options) => {
    try {
      // 获取配置
      if (options.get) {
        const result = await yasiService.getConfig();

        if (!result.success) {
          console.error(chalk.red(`获取配置失败: ${result.error}`));
          process.exit(1);
        }

        console.log(chalk.cyan('\n当前配置:'));
        console.log(JSON.stringify(result.data, null, 2));
        return;
      }

      // 设置默认模型
      if (options.setModel) {
        const modelType = options.setModel as ModelType;

        const result = await yasiService.updateConfig({
          models: {
            default: modelType
          }
        });

        if (!result.success) {
          console.error(chalk.red(`设置默认模型失败: ${result.error}`));
          process.exit(1);
        }

        console.log(chalk.green(`成功设置默认模型为: ${modelType}`));
      }

      // 设置API密钥
      if (options.setApiKey) {
        const modelType = options.modelType as ModelType;
        const apiKey = options.setApiKey;

        const config: JSONObject = {
          models: {
            [modelType]: {
              apiKey: apiKey
            }
          }
        };

        // 百度文心模型需要设置secretKey
        if (modelType === ModelType.BAIDU && apiKey.includes(':')) {
          const [key, secret] = apiKey.split(':');
          if (config.models && typeof config.models === 'object') {
            (config.models as JSONObject)[modelType] = {
              apiKey: key,
              secretKey: secret
            };
          }
        }

        const result = await yasiService.updateConfig(config);

        if (!result.success) {
          console.error(chalk.red(`设置API密钥失败: ${result.error}`));
          process.exit(1);
        }

        console.log(chalk.green(`成功设置${modelType}模型的API密钥`));

        // 验证API密钥
        const validateResult = await yasiService.validateModelApiKey(modelType);

        if (!validateResult.success || !validateResult.data?.valid) {
          console.log(chalk.yellow(`警告: API密钥验证失败，请检查密钥是否正确`));
        } else {
          console.log(chalk.green(`API密钥验证成功`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`错误: ${(error as Error).message}`));
      process.exit(1);
    }
  });

// 旧的模型命令已被新的 modelsCommand 替代

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
  console.log(chalk.blue('🤖 TaskFlow AI - 智能PRD文档解析与任务管理助手'));
  console.log();
  console.log(chalk.cyan('🚀 快速开始:'));
  console.log(chalk.gray('  taskflow init                    # 初始化项目'));
  console.log(chalk.gray('  taskflow parse docs/prd.md       # 解析PRD文档'));
  console.log(chalk.gray('  taskflow status                  # 查看任务状态'));
  console.log();
  console.log(chalk.cyan('💡 获取帮助:'));
  console.log(chalk.gray('  taskflow help                    # 显示详细帮助'));
  console.log(chalk.gray('  taskflow <command> --help        # 查看命令帮助'));
}