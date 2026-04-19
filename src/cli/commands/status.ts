import { getLogger } from '../../utils/logger';
/**
 * Status命令 - 查看项目状态
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { ConfigManager } from '../../core/config';
import { CLI_SYMBOLS } from '../../constants';

const logger = getLogger('cli/commands/status');

export function statusCommand(program: Command) {
  const statusProgram = program.command('status').description('查看项目状态和任务列表');

  // status list - 显示任务列表
  statusProgram
    .command('list')
    .description('显示任务列表')
    .option('--filter <condition>', '过滤条件 (status=xxx|priority=xxx)')
    .option('--sort <field>', '排序字段', 'created_at')
    .option('--format <format>', '输出格式 (table|json)', 'table')
    .option('--limit <number>', '显示数量限制', '50')
    .option('--output <path>', '任务文件目录', 'output')
    .action(async options => {
      try {
        await runStatusList(options);
      } catch (error) {
        logger.error(chalk.red('获取任务列表失败:'), error);
        process.exit(1);
      }
    });

  // status next - 获取下一个推荐任务
  statusProgram
    .command('next')
    .description('获取下一个推荐任务')
    .option('-c, --count <number>', '推荐任务数量', '1')
    .option('-p, --priority <level>', '优先级过滤 (high|medium|low)')
    .option('--output <path>', '任务文件目录', 'output')
    .action(async options => {
      try {
        await runStatusNext(options);
      } catch (error) {
        logger.error(chalk.red('获取推荐任务失败:'), error);
        process.exit(1);
      }
    });

  // status progress - 查看项目进度
  statusProgram
    .command('progress')
    .description('查看项目进度')
    .option('--detailed', '显示详细报告')
    .option('--export <filepath>', '导出进度报告到文件')
    .option('--output <path>', '任务文件目录', 'output')
    .action(async options => {
      try {
        await runStatusProgress(options);
      } catch (error) {
        logger.error(chalk.red('获取项目进度失败:'), error);
        process.exit(1);
      }
    });

  // status update - 更新任务状态
  statusProgram
    .command('update')
    .description('更新任务状态')
    .argument('<任务ID>', '任务ID')
    .argument('<新状态>', '新状态 (todo|in_progress|done|blocked|cancelled)')
    .option('-m, --comment <备注>', '添加备注')
    .option('--output <path>', '任务文件目录', 'output')
    .action(async (taskId, newStatus, options) => {
      try {
        await runStatusUpdate(taskId, newStatus, options);
      } catch (error) {
        logger.error(chalk.red('更新任务状态失败:'), error);
        process.exit(1);
      }
    });

  // status current - 显示当前进行中的任务
  statusProgram
    .command('current')
    .description('显示当前进行中的任务')
    .option('--output <path>', '任务文件目录', 'output')
    .action(async options => {
      try {
        await runStatusCurrent(options);
      } catch (error) {
        logger.error(chalk.red('获取当前任务失败:'), error);
        process.exit(1);
      }
    });

  // status - 显示项目配置状态（原有功能）
  statusProgram
    .option('--json', '以JSON格式输出')
    .option('--detailed', '显示详细信息')
    .action(async options => {
      try {
        await runStatus(options);
      } catch (error) {
        logger.error(chalk.red('获取状态失败:'), error);
        process.exit(1);
      }
    });
}

// ─── 共享工具函数 ────────────────────────────────────────────────

interface TaskFile {
  tasks: TaskRecord[];
  document?: { title?: string };
  updatedAt?: string;
}

interface TaskRecord {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  estimatedHours?: number;
  [key: string]: unknown;
}

/**
 * 从 output 目录加载最新任务文件
 */
async function loadTaskFile(outputDir: string): Promise<{ filePath: string; data: TaskFile } | null> {
  if (!(await fs.pathExists(outputDir))) return null;
  const files = (await fs.readdir(outputDir)).filter(f => f.endsWith('.json') && !f.startsWith('.'));
  if (files.length === 0) return null;
  const latestFile = [...files].sort().reverse()[0];
  const filePath = path.join(outputDir, latestFile);
  const data = await fs.readJson(filePath);
  return { filePath, data };
}

// ─── 命令实现 ────────────────────────────────────────────────────

interface StatusOptions {
  json?: boolean;
  detailed?: boolean;
}

async function runStatus(options: StatusOptions) {
  const spinner = ora('正在获取项目状态...').start();

  try {
    const configManager = new ConfigManager();
    const configStats = await configManager.getConfigStats();

    if (!configStats.hasConfig) {
      spinner.fail(chalk.red('未找到配置文件，请先运行 "taskflow init"'));
      return;
    }

    const config = await configManager.loadConfig();
    if (!config) {
      spinner.fail(chalk.red('配置文件加载失败'));
      return;
    }

    spinner.succeed(chalk.green('状态获取完成'));

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            project: { name: config.projectName, version: config.version },
            aiModels: { total: configStats.aiModelsCount, enabled: configStats.enabledModelsCount },
            mcp: { enabled: configStats.mcpEnabled, port: config.mcpSettings?.port },
            lastModified: configStats.lastModified,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(chalk.cyan('\n📊 项目状态报告\n'));

    console.log(chalk.white('📁 项目信息:'));
    console.log(chalk.gray('  项目名称: ') + chalk.blue(config.projectName || '未设置'));
    console.log(chalk.gray('  项目版本: ') + chalk.blue(config.version || '未设置'));
    console.log(
      chalk.gray('  最后修改: ') + chalk.white(configStats.lastModified?.toLocaleString() || '未知')
    );

    console.log(chalk.white('\n🤖 AI模型配置:'));
    console.log(chalk.gray('  已配置模型: ') + chalk.yellow(configStats.aiModelsCount));
    console.log(chalk.gray('  启用的模型: ') + chalk.green(configStats.enabledModelsCount));

    if (config.aiModels.length > 0) {
      console.log(chalk.gray('  模型列表:'));
      config.aiModels.forEach((model, index) => {
        const status = model.enabled ? chalk.green('●') : chalk.red('○');
        console.log(
          chalk.gray(`    ${index + 1}. `) +
            status +
            ` ${model.provider} (${model.modelName}) ${chalk.gray(`[优先级: ${model.priority}]`)}`
        );
      });
    }

    console.log(chalk.white('\n🔌 MCP服务器:'));
    console.log(
      chalk.gray('  状态: ') +
        (configStats.mcpEnabled ? chalk.green('启用') : chalk.red('禁用'))
    );
    if (configStats.mcpEnabled) {
      console.log(
        chalk.gray('  地址: ') +
          chalk.blue(`http://${config.mcpSettings.host}:${config.mcpSettings.port}`)
      );
      console.log(chalk.gray('  工具数量: ') + chalk.yellow(config.mcpSettings.tools.length));
      console.log(
        chalk.gray('  安全模式: ') +
          (config.mcpSettings.security.authRequired ? chalk.green('启用') : chalk.yellow('禁用'))
      );
    }

    if (options.detailed) {
      console.log(chalk.white('\n💻 系统信息:'));
      console.log(chalk.gray('  Node.js版本: ') + chalk.white(process.version));
      console.log(chalk.gray('  操作系统: ') + chalk.white(process.platform));
      console.log(chalk.gray('  工作目录: ') + chalk.white(process.cwd()));
      const memUsage = process.memoryUsage();
      console.log(
        chalk.gray('  内存使用: ') + chalk.white(`${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
      );
    }

    console.log(chalk.white('\n🏥 健康检查:'));

    const apiKeyValidation = await configManager.validateApiKeys();
    const validKeys = apiKeyValidation.filter(result => result.valid).length;
    const totalKeys = apiKeyValidation.length;

    if (totalKeys > 0) {
      const keyStatus = validKeys === totalKeys ? chalk.green('正常') : chalk.yellow('部分异常');
      console.log(
        chalk.gray('  API密钥: ') + keyStatus + chalk.gray(` (${validKeys}/${totalKeys})`)
      );
      if (validKeys < totalKeys) {
        apiKeyValidation
          .filter(result => !result.valid)
          .forEach(result => {
            console.log(
              chalk.gray(`    ${CLI_SYMBOLS.ERROR} ${result.provider}: `) + chalk.red(result.error)
            );
          });
      }
    } else {
      console.log(chalk.gray('  API密钥: ') + chalk.yellow('未配置'));
    }

    const configPath = configManager.getConfigPath();
    console.log(chalk.gray('  配置文件: ') + chalk.green('正常') + chalk.gray(` (${configPath})`));

    console.log(chalk.cyan('\n💡 建议操作:'));

    if (configStats.aiModelsCount === 0) {
      console.log(chalk.yellow('  • 配置AI模型以启用智能功能'));
    }
    if (!configStats.mcpEnabled) {
      console.log(chalk.yellow('  • 启用MCP服务器以支持编辑器集成'));
    }
    if (validKeys < totalKeys) {
      console.log(chalk.yellow('  • 检查并更新无效的API密钥'));
    }

    console.log(chalk.gray('\n使用 "taskflow --help" 查看所有可用命令'));
  } catch (error) {
    spinner.fail('获取状态失败');
    throw error;
  }
}

/**
 * 运行 status list 命令 - 显示任务列表
 */
async function runStatusList(options: {
  filter?: string;
  sort?: string;
  format?: string;
  limit?: string;
  output?: string;
}) {
  const spinner = ora('正在加载任务列表...').start();
  const outputDir = path.resolve(options.output || 'output');

  try {
    const loaded = await loadTaskFile(outputDir);
    if (!loaded) {
      spinner.fail(chalk.red('未找到任务文件，请先运行 "taskflow parse"'));
      return;
    }
    const { filePath, data } = loaded;
    spinner.succeed(chalk.green('任务加载成功'));

    const tasks = data.tasks || [];
    const document = data.document || {};

    let filteredTasks = [...tasks];
    if (options.filter) {
      const [key, value] = options.filter.split('=');
      if (key && value) {
        filteredTasks = filteredTasks.filter((t: any) => t[key] === value);
      }
    }

    if (options.sort) {
      filteredTasks.sort((a: any, b: any) => {
        if (options.sort === 'priority') {
          const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[String(b.priority)] || 0) - (priorityOrder[String(a.priority)] || 0)
          );
        }
        return 0;
      });
    }

    const limit = parseInt(options.limit || '50');
    filteredTasks = filteredTasks.slice(0, limit);

    if (options.format === 'json') {
      console.log(JSON.stringify(filteredTasks, null, 2));
      return;
    }

    console.log(chalk.cyan(`\n📋 任务列表 (${filteredTasks.length}/${tasks.length})\n`));
    console.log(chalk.gray('文档: ') + chalk.white(document.title || '未知'));
    console.log(chalk.gray('文件: ') + chalk.blue(path.basename(filePath)));
    console.log();

    console.log(
      chalk.white('ID') +
        ' | ' +
        chalk.white('标题').padEnd(30) +
        ' | ' +
        chalk.white('状态').padEnd(12) +
        ' | ' +
        chalk.white('优先级').padEnd(8) +
        ' | ' +
        chalk.white('工时')
    );
    console.log(chalk.gray('-'.repeat(90)));

    filteredTasks.forEach((task: any) => {
      const statusColors: Record<string, any> = {
        todo: chalk.yellow,
        in_progress: chalk.cyan,
        done: chalk.green,
        blocked: chalk.red,
      };
      const priorityColors: Record<string, any> = {
        high: chalk.red,
        medium: chalk.yellow,
        low: chalk.gray,
      };

      const id = task.id?.substring(0, 8) || 'N/A';
      const title = (task.title || '无标题').substring(0, 28);
      const status = task.status || 'todo';
      const priority = task.priority || 'medium';
      const hours = task.estimatedHours || 0;

      console.log(
        chalk.gray(id) +
          ' | ' +
          chalk.white(title).padEnd(30) +
          ' | ' +
          (statusColors[status] || chalk.white)(status.padEnd(12)) +
          ' | ' +
          (priorityColors[priority] || chalk.white)(priority.padEnd(8)) +
          ' | ' +
          chalk.blue(`${hours}h`)
      );
    });

    console.log(chalk.gray('\n💡 提示:'));
    console.log(chalk.gray('  - 使用 "taskflow status list --filter status=todo" 过滤任务'));
    console.log(chalk.gray('  - 使用 "taskflow status list --format json" JSON格式输出'));
  } catch (error) {
    spinner.fail('加载任务列表失败');
    throw error;
  }
}

/**
 * 运行 status next 命令 - 获取下一个推荐任务
 */
async function runStatusNext(options: {
  count?: string;
  priority?: string;
  output?: string;
}) {
  const spinner = ora('正在分析任务列表...').start();
  const outputDir = path.resolve(options.output || 'output');

  try {
    const loaded = await loadTaskFile(outputDir);
    if (!loaded) {
      spinner.fail(chalk.red('未找到任务文件，请先运行 "taskflow parse"'));
      return;
    }
    spinner.succeed(chalk.green('分析完成'));

    const { data } = loaded;
    const tasks = data.tasks || [];
    const count = parseInt(options.count || '1');

    // 优先级排序函数
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

    // 过滤并排序：优先未完成的任务，再按优先级排序
    let candidates = tasks.filter((t: TaskRecord) => t.status !== 'done' && t.status !== 'cancelled');

    if (options.priority) {
      candidates = candidates.filter(
        (t: TaskRecord) => t.priority?.toLowerCase() === options.priority!.toLowerCase()
      );
    }

    // 按优先级和创建时间排序
    candidates.sort((a: TaskRecord, b: TaskRecord) => {
      const priorityDiff =
        (priorityOrder[String(b.priority)] || 0) - (priorityOrder[String(a.priority)] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      // 同优先级按创建时间排序（较早的优先）
      return 0;
    });

    const recommended = candidates.slice(0, count);

    if (recommended.length === 0) {
      console.log(chalk.yellow('\n⚠ 没有找到符合条件的任务'));
      console.log(chalk.gray('  - 所有任务已完成，或'));
      console.log(chalk.gray('  - 没有匹配优先级筛选条件的任务'));
      return;
    }

    console.log(chalk.cyan(`\n🎯 推荐任务 (${recommended.length}/${candidates.length})\n`));

    recommended.forEach((task: TaskRecord, index: number) => {
      const priorityColors: Record<string, any> = {
        high: chalk.red,
        medium: chalk.yellow,
        low: chalk.gray,
      };
      const statusColors: Record<string, any> = {
        todo: chalk.yellow,
        in_progress: chalk.cyan,
        blocked: chalk.red,
      };

      console.log(
        chalk.white(`  ${index + 1}. `) +
          chalk.bold((task.title || '无标题').substring(0, 50))
      );
      console.log(
        chalk.gray('     ID: ') +
          chalk.cyan(task.id?.substring(0, 8)) +
          chalk.gray('  状态: ') +
          (statusColors[task.status || 'todo'] || chalk.white)(task.status || 'todo') +
          chalk.gray('  优先级: ') +
          (priorityColors[task.priority || 'medium'] || chalk.white)(task.priority || 'medium') +
          chalk.gray('  工时: ') +
          chalk.blue(`${task.estimatedHours || 0}h`)
      );
      if (task.assignee) {
        console.log(chalk.gray('     分配人: ') + chalk.white(task.assignee));
      }
      console.log();
    });

    console.log(chalk.gray('💡 提示:'));
    console.log(
      chalk.gray('  - 使用 "taskflow status update ') +
        chalk.cyan(recommended[0]?.id?.substring(0, 8)) +
        chalk.gray(' in_progress" 开始任务')
    );
    console.log(chalk.gray('  - 使用 "taskflow status next --count 3" 获取多个推荐'));
  } catch (error) {
    spinner.fail('分析任务列表失败');
    throw error;
  }
}

/**
 * 运行 status progress 命令 - 查看项目进度
 */
async function runStatusProgress(options: {
  detailed?: boolean;
  export?: string;
  output?: string;
}) {
  const spinner = ora('正在计算项目进度...').start();
  const outputDir = path.resolve(options.output || 'output');

  try {
    const loaded = await loadTaskFile(outputDir);
    if (!loaded) {
      spinner.fail(chalk.red('未找到任务文件，请先运行 "taskflow parse"'));
      return;
    }
    spinner.succeed(chalk.green('进度计算完成'));

    const { data } = loaded;
    const tasks = data.tasks || [];
    const total = tasks.length;

    if (total === 0) {
      spinner.fail(chalk.red('任务列表为空'));
      return;
    }

    // 统计各状态任务数
    const statusCount: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    let totalHours = 0;
    let completedHours = 0;

    tasks.forEach((task: TaskRecord) => {
      const status = task.status || 'todo';
      const priority = task.priority || 'medium';
      statusCount[status] = (statusCount[status] || 0) + 1;
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      const hours = task.estimatedHours || 0;
      totalHours += hours;
      if (status === 'done' || status === 'completed') {
        completedHours += hours;
      }
    });

    const doneCount = statusCount['done'] || statusCount['completed'] || 0;
    const inProgressCount = statusCount['in_progress'] || 0;
    const todoCount = statusCount['todo'] || 0;
    const blockedCount = statusCount['blocked'] || 0;
    const progressPercent = Math.round((doneCount / total) * 100);
    const hoursPercent = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

    // 进度条
    const barLength = 30;
    const filled = Math.round((progressPercent / 100) * barLength);
    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(barLength - filled));

    console.log(chalk.cyan(`\n📊 项目进度报告\n`));
    console.log(
      chalk.gray('文档: ') + chalk.white((data.document?.title || '未知').substring(0, 50))
    );
    console.log();

    // 总体进度条
    console.log(
      chalk.white('  整体进度 ') + chalk.green(`${progressPercent}%`) + ` ${bar} ${chalk.gray(`${doneCount}/${total} 任务`)}`
    );
    console.log();

    // 状态分布
    console.log(chalk.white('  📈 状态分布:\n'));
    const statusLabels: Record<string, { label: string; color: any }> = {
      done: { label: '已完成', color: chalk.green },
      completed: { label: '已完成', color: chalk.green },
      in_progress: { label: '进行中', color: chalk.cyan },
      todo: { label: '待处理', color: chalk.yellow },
      blocked: { label: '已阻塞', color: chalk.red },
      cancelled: { label: '已取消', color: chalk.gray },
    };

    (Object.keys(statusCount) as string[]).forEach(status => {
      const count = statusCount[status] || 0;
      const pct = Math.round((count / total) * 100);
      const info = statusLabels[status] || { label: status, color: chalk.white };
      const bar2 = info.color('█'.repeat(Math.max(1, Math.round((count / total) * 20))));
      console.log(
        chalk.gray('    ') +
          info.color('●') +
          ` ${info.label.padEnd(8)} ` +
          bar2 +
          chalk.gray(' '.repeat(Math.max(0, 20 - Math.round((count / total) * 20)))) +
          chalk.white(`${count} (${pct}%)`)
      );
    });

    console.log();

    // 优先级分布
    if (options.detailed) {
      console.log(chalk.white('  🔥 优先级分布:\n'));
      const priorityLabels: Record<string, { label: string; color: any }> = {
        high: { label: '高', color: chalk.red },
        medium: { label: '中', color: chalk.yellow },
        low: { label: '低', color: chalk.gray },
      };
      (Object.keys(priorityCount) as string[]).forEach(priority => {
        const count = priorityCount[priority] || 0;
        const info = priorityLabels[priority] || { label: priority, color: chalk.white };
        console.log(
          chalk.gray('    ') +
            info.color('■') +
            ` ${info.label.padEnd(8)} ` +
            chalk.white(`${count} (${Math.round((count / total) * 100)}%)`)
        );
      });

      // 工时统计
      console.log();
      console.log(chalk.white('  ⏱  工时统计:\n'));
      console.log(
        chalk.gray('    总预计工时: ') + chalk.blue(`${totalHours}h`)
      );
      console.log(
        chalk.gray('    已完成工时: ') + chalk.green(`${completedHours}h`)
      );
      console.log(
        chalk.gray('    剩余工时:   ') + chalk.yellow(`${totalHours - completedHours}h`)
      );
      const hoursBar = chalk.green('█'.repeat(Math.round((hoursPercent / 100) * barLength))) +
        chalk.gray('░'.repeat(barLength - Math.round((hoursPercent / 100) * barLength)));
      console.log(
        chalk.gray('    工时进度    ') +
          chalk.green(`${hoursPercent}%`) +
          ` ${hoursBar}`
      );
    }

    // 导出
    if (options.export) {
      const exportData = {
        generatedAt: new Date().toISOString(),
        document: data.document,
        summary: {
          total,
          doneCount,
          inProgressCount,
          todoCount,
          blockedCount,
          progressPercent,
          totalHours,
          completedHours,
          hoursPercent,
        },
        statusBreakdown: statusCount,
        priorityBreakdown: priorityCount,
        tasks: options.detailed ? tasks : undefined,
      };
      await fs.writeJson(path.resolve(options.export), exportData, { spaces: 2 });
      console.log(chalk.green(`\n✅ 报告已导出到 ${options.export}`));
    }

    console.log(chalk.gray('\n💡 提示:'));
    console.log(chalk.gray('  - 使用 "taskflow status progress --detailed" 查看详细信息'));
    console.log(chalk.gray('  - 使用 "taskflow status progress --export report.json" 导出报告'));
  } catch (error) {
    spinner.fail('计算项目进度失败');
    throw error;
  }
}

/**
 * 运行 status update 命令 - 更新任务状态
 */
async function runStatusUpdate(
  taskId: string,
  newStatus: string,
  options: {
    comment?: string;
    output?: string;
  }
) {
  const spinner = ora('正在更新任务状态...').start();
  const outputDir = path.resolve(options.output || 'output');

  // 验证状态值
  const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'cancelled'];
  const normalizedStatus = newStatus.toLowerCase();
  if (!validStatuses.includes(normalizedStatus)) {
    spinner.fail(
      chalk.red(`无效状态 "${newStatus}"，有效值: ${validStatuses.join(' | ')}`)
    );
    return;
  }

  try {
    const loaded = await loadTaskFile(outputDir);
    if (!loaded) {
      spinner.fail(chalk.red('未找到任务文件，请先运行 "taskflow parse"'));
      return;
    }
    const { filePath, data } = loaded;

    // 查找任务（支持完整ID或前8位）
    const task = data.tasks.find(
      (t: TaskRecord) =>
        t.id === taskId || t.id?.substring(0, 8) === taskId || t.id?.startsWith(taskId)
    );

    if (!task) {
      spinner.fail(chalk.red(`未找到任务 "${taskId}"`));
      console.log(chalk.gray('  - 使用 "taskflow status list" 查看所有任务'));
      return;
    }

    const oldStatus = task.status || 'todo';

    // 更新状态
    task.status = normalizedStatus;

    // 添加备注
    if (options.comment) {
      const history = (task as any).history || [];
      history.push({
        status: normalizedStatus,
        comment: options.comment,
        timestamp: new Date().toISOString(),
      });
      (task as any).history = history;
    }

    // 更新时间
    data.updatedAt = new Date().toISOString();

    // 保存文件
    await fs.writeJson(filePath, data, { spaces: 2 });

    spinner.succeed(chalk.green('任务状态已更新'));

    // 状态中文映射
    const statusLabels: Record<string, string> = {
      todo: '待处理',
      in_progress: '进行中',
      done: '已完成',
      blocked: '已阻塞',
      cancelled: '已取消',
    };

    console.log(chalk.cyan('\n✅ 任务状态更新成功\n'));
    console.log(
      chalk.gray('  任务ID:   ') + chalk.cyan(task.id?.substring(0, 8))
    );
    console.log(
      chalk.gray('  标题:     ') + chalk.white((task.title || '无标题').substring(0, 40))
    );
    console.log(
      chalk.gray('  状态:     ') +
        chalk.green(statusLabels[normalizedStatus] || normalizedStatus) +
        chalk.gray(` (${oldStatus} → ${normalizedStatus})`)
    );
    if (options.comment) {
      console.log(chalk.gray('  备注:     ') + chalk.white(options.comment));
    }
    console.log();

    // 给出下一步提示
    if (normalizedStatus === 'in_progress') {
      console.log(chalk.gray('💡 任务已标记为进行中'));
      console.log(chalk.gray('  - 使用 "taskflow status current" 查看当前任务'));
    } else if (normalizedStatus === 'done') {
      console.log(chalk.gray('💡 恭喜任务完成！'));
      console.log(chalk.gray('  - 使用 "taskflow status next" 获取下一个推荐任务'));
    }
  } catch (error) {
    spinner.fail('更新任务状态失败');
    throw error;
  }
}

/**
 * 运行 status current 命令 - 显示当前进行中的任务
 */
async function runStatusCurrent(options: { output?: string }) {
  const spinner = ora('正在查找当前任务...').start();
  const outputDir = path.resolve(options.output || 'output');

  try {
    const loaded = await loadTaskFile(outputDir);
    if (!loaded) {
      spinner.fail(chalk.red('未找到任务文件，请先运行 "taskflow parse"'));
      return;
    }
    spinner.succeed(chalk.green('查找完成'));

    const { data } = loaded;
    const tasks = data.tasks || [];

    // 查找进行中的任务
    const inProgress = tasks.filter(
      (t: TaskRecord) => t.status === 'in_progress'
    );

    // 查找高优先级待处理任务
    const highPriorityTodo = tasks.filter(
      (t: TaskRecord) => t.status === 'todo' && t.priority === 'high'
    );

    if (inProgress.length === 0 && highPriorityTodo.length === 0) {
      console.log(chalk.yellow('\n⚠ 没有进行中的任务'));
      console.log(chalk.gray('  - 使用 "taskflow status next" 获取推荐任务'));
      console.log(chalk.gray('  - 使用 "taskflow status list --filter status=todo" 查看待处理任务'));
      return;
    }

    console.log(chalk.cyan('\n🎯 当前任务\n'));

    if (inProgress.length > 0) {
      console.log(chalk.white('  进行中的任务:\n'));
      inProgress.forEach((task: TaskRecord) => {
        console.log(
          chalk.cyan('  ▶ ') + chalk.bold((task.title || '无标题').substring(0, 50))
        );
        console.log(
          chalk.gray('    ID: ') +
            chalk.white(task.id?.substring(0, 8)) +
            chalk.gray('  优先级: ') +
            chalk.red(task.priority || 'medium') +
            chalk.gray('  工时: ') +
            chalk.blue(`${task.estimatedHours || 0}h`)
        );
        if ((task as any).assignee) {
          console.log(chalk.gray('    分配人: ') + chalk.white((task as any).assignee));
        }
        console.log();
      });
    }

    if (highPriorityTodo.length > 0) {
      console.log(chalk.white('  🔥 高优先级待处理:\n'));
      highPriorityTodo.slice(0, 3).forEach((task: TaskRecord) => {
        console.log(
          chalk.yellow('  ○ ') + chalk.white((task.title || '无标题').substring(0, 45))
        );
        console.log(
          chalk.gray('    ID: ') +
            chalk.cyan(task.id?.substring(0, 8)) +
            chalk.gray('  工时: ') +
            chalk.blue(`${task.estimatedHours || 0}h`)
        );
        console.log();
      });
    }

    console.log(chalk.gray('💡 提示:'));
    console.log(
      chalk.gray('  - 使用 "taskflow status update ') +
        chalk.cyan(inProgress[0]?.id?.substring(0, 8) || '<任务ID>') +
        chalk.gray(' done" 完成任务')
    );
    console.log(chalk.gray('  - 使用 "taskflow status list" 查看所有任务'));
  } catch (error) {
    spinner.fail('查找当前任务失败');
    throw error;
  }
}
