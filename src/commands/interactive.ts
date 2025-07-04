/**
 * TaskFlow AI 交互式命令
 * 提供用户友好的交互式界面
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import boxen from 'boxen';
import * as fs from 'fs-extra';
import { taskFlowService } from '../mcp/index';
// ModelType 未使用，已移除
import { FileType } from '../types/model';
import { Task, TaskStatus } from '../types/task';

/**
 * 交互式命令处理器
 */
export class InteractiveCommand {
  /**
   * 注册交互式命令
   */
  public register(program: Command): void {
    program
      .command('interactive')
      .alias('i')
      .description('启动交互式模式')
      .action(async () => {
        await this.startInteractiveMode();
      });
  }

  /**
   * 启动交互式模式
   */
  private async startInteractiveMode(): Promise<void> {
    console.clear();

    // 显示欢迎信息
    this.showWelcome();

    let running = true;
    while (running) {
      try {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '请选择要执行的操作:',
            choices: [
              { name: '📄 解析PRD文档', value: 'parse' },
              { name: '📋 查看任务列表', value: 'tasks' },
              { name: '⚙️  配置管理', value: 'config' },
              { name: '🤖 AI对话', value: 'chat' },
              { name: '📊 项目状态', value: 'status' },
              { name: '❌ 退出', value: 'exit' }
            ]
          }
        ]);

        if (action === 'exit') {
          console.log(chalk.green('\n👋 感谢使用 TaskFlow AI！'));
          break;
        }

        await this.handleAction(action);

        // 询问是否继续
        const { continue: shouldContinue } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continue',
            message: '是否继续使用？',
            default: true
          }
        ]);

        if (!shouldContinue) {
          console.log(chalk.green('\n👋 感谢使用 TaskFlow AI！'));
          running = false;
        }

        console.log('\n' + '─'.repeat(50) + '\n');
      } catch (error) {
        console.error(chalk.red(`❌ 操作失败: ${(error as Error).message}`));

        const { retry } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: '是否重试？',
            default: true
          }
        ]);

        if (!retry) break;
      }
    }
  }

  /**
   * 显示欢迎信息
   */
  private showWelcome(): void {
    const welcome = boxen(
      chalk.cyan.bold('TaskFlow AI') + '\n\n' +
      chalk.white('智能PRD文档解析与任务管理助手') + '\n' +
      chalk.gray('让AI帮您将产品需求转化为可执行的任务计划'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    );

    console.log(welcome);
  }

  /**
   * 处理用户选择的操作
   */
  private async handleAction(action: string): Promise<void> {
    switch (action) {
      case 'parse':
        await this.handleParsePRD();
        break;
      case 'tasks':
        await this.handleViewTasks();
        break;
      case 'config':
        await this.handleConfig();
        break;
      case 'chat':
        await this.handleChat();
        break;
      case 'status':
        await this.handleStatus();
        break;
    }
  }

  /**
   * 处理PRD解析
   */
  private async handleParsePRD(): Promise<void> {
    console.log(chalk.blue('\n📄 PRD文档解析'));

    const { inputType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'inputType',
        message: '请选择输入方式:',
        choices: [
          { name: '📁 从文件读取', value: 'file' },
          { name: '✏️  直接输入文本', value: 'text' }
        ]
      }
    ]);

    let content = '';
    let filePath = '';

    if (inputType === 'file') {
      const { path } = await inquirer.prompt([
        {
          type: 'input',
          name: 'path',
          message: '请输入PRD文件路径:',
          validate: (input) => input.trim() !== '' || '文件路径不能为空'
        }
      ]);
      filePath = path;
    } else {
      const { text } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'text',
          message: '请输入PRD文档内容:'
        }
      ]);
      content = text;
    }

    // 选择AI模型
    const { modelType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'modelType',
        message: '请选择AI模型:',
        choices: [
          { name: '🚀 DeepSeek (推荐)', value: 'deepseek' },
          { name: '🧠 智谱AI GLM', value: 'zhipu' },
          { name: '🌟 通义千问', value: 'qwen' },
          { name: '💫 文心一言', value: 'wenxin' }
        ]
      }
    ]);

    const spinner = ora('正在解析PRD文档...').start();

    try {
      let result;
      if (inputType === 'file') {
        result = await taskFlowService.parsePRDFromFile(filePath, { modelType });
      } else {
        result = await taskFlowService.parsePRD(content, FileType.MARKDOWN, { modelType });
      }

      spinner.succeed('PRD解析完成！');

      if (result.success && result.data) {
        console.log(chalk.green('\n✅ 解析成功！'));

        // 检查数据结构并显示相应信息
        if ('sections' in result.data && result.data.sections) {
          console.log(chalk.white(`📋 解析了 ${result.data.sections.length} 个章节`));
        } else if ('metadata' in result.data && result.data.metadata?.features) {
          console.log(chalk.white(`📋 提取了 ${result.data.metadata.features.length} 个功能特性`));
        } else {
          console.log(chalk.white('📋 PRD解析完成'));
        }

        // 询问是否保存
        const { save } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'save',
            message: '是否保存解析结果？',
            default: true
          }
        ]);

        if (save) {
          const { outputPath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'outputPath',
              message: '请输入保存路径:',
              default: './prd-parsed.json'
            }
          ]);

          await fs.writeJSON(outputPath, result.data, { spaces: 2 });
          console.log(chalk.green(`💾 解析结果已保存到: ${outputPath}`));
        }
      } else {
        console.log(chalk.red(`❌ 解析失败: ${result.error}`));
      }
    } catch (error) {
      spinner.fail('PRD解析失败');
      throw error;
    }
  }

  /**
   * 处理查看任务
   */
  private async handleViewTasks(): Promise<void> {
    console.log(chalk.blue('\n📋 任务列表'));

    const spinner = ora('正在获取任务列表...').start();

    try {
      const result = taskFlowService.getAllTasks();
      spinner.succeed('任务列表获取完成');

      if (result.success && result.data && result.data.length > 0) {
        console.log(chalk.green(`\n📊 共有 ${result.data.length} 个任务\n`));

        result.data.forEach((task: Task, index: number) => {
          const statusIcon = this.getStatusIcon(task.status);
          const priorityColor = this.getPriorityColor(task.priority);

          console.log(
            `${index + 1}. ${statusIcon} ${chalk.white(task.title)} ` +
            `${priorityColor(`[${task.priority}]`)} ` +
            `${chalk.gray(`(${task.estimatedHours}h)`)}`
          );
        });
      } else {
        console.log(chalk.yellow('📭 暂无任务'));
      }
    } catch (error) {
      spinner.fail('获取任务列表失败');
      throw error;
    }
  }

  /**
   * 处理配置管理
   */
  private async handleConfig(): Promise<void> {
    console.log(chalk.blue('\n⚙️  配置管理'));

    const { configAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configAction',
        message: '请选择配置操作:',
        choices: [
          { name: '👀 查看当前配置', value: 'view' },
          { name: '🔑 设置API密钥', value: 'apikey' },
          { name: '🎛️  模型设置', value: 'model' }
        ]
      }
    ]);

    if (configAction === 'view') {
      const result = taskFlowService.getConfig();
      if (result.success) {
        console.log(chalk.green('\n📋 当前配置:'));
        console.log(JSON.stringify(result.data, null, 2));
      }
    } else if (configAction === 'apikey') {
      await this.handleApiKeyConfig();
    } else if (configAction === 'model') {
      await this.handleModelConfig();
    }
  }

  /**
   * 处理API密钥配置
   */
  private async handleApiKeyConfig(): Promise<void> {
    const { modelType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'modelType',
        message: '请选择要配置的模型:',
        choices: [
          { name: 'DeepSeek', value: 'deepseek' },
          { name: '智谱AI', value: 'zhipu' },
          { name: '通义千问', value: 'qwen' },
          { name: '文心一言', value: 'wenxin' }
        ]
      }
    ]);

    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: `请输入${modelType}的API密钥:`,
        mask: '*'
      }
    ]);

    const config = {
      models: {
        [modelType]: { apiKey }
      }
    };

    const result = taskFlowService.updateConfig(config);
    if (result.success) {
      console.log(chalk.green('✅ API密钥配置成功！'));
    } else {
      console.log(chalk.red(`❌ 配置失败: ${result.error}`));
    }
  }

  /**
   * 处理模型配置
   */
  private async handleModelConfig(): Promise<void> {
    const { defaultModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'defaultModel',
        message: '请选择默认模型:',
        choices: [
          { name: 'DeepSeek', value: 'deepseek' },
          { name: '智谱AI', value: 'zhipu' },
          { name: '通义千问', value: 'qwen' },
          { name: '文心一言', value: 'wenxin' }
        ]
      }
    ]);

    const config = {
      models: {
        default: defaultModel
      }
    };

    const result = taskFlowService.updateConfig(config);
    if (result.success) {
      console.log(chalk.green('✅ 默认模型设置成功！'));
    } else {
      console.log(chalk.red(`❌ 设置失败: ${result.error}`));
    }
  }

  /**
   * 处理AI对话
   */
  private async handleChat(): Promise<void> {
    console.log(chalk.blue('\n🤖 AI对话模式'));
    console.log(chalk.gray('输入 "exit" 退出对话\n'));

    let chatting = true;
    while (chatting) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: '您:',
          validate: (input) => input.trim() !== '' || '消息不能为空'
        }
      ]);

      if (message.toLowerCase() === 'exit') {
        chatting = false;
        continue;
      }

      const spinner = ora('AI正在思考...').start();

      try {
        const result = await taskFlowService.chat([
          { role: 'user', content: message }
        ]);

        spinner.stop();

        if (result.success && result.data) {
          console.log(chalk.cyan('AI:'), result.data.content || result.data);
        } else {
          console.log(chalk.red(`❌ 对话失败: ${result.error}`));
        }
      } catch (error) {
        spinner.fail('对话失败');
        console.log(chalk.red(`❌ ${(error as Error).message}`));
      }

      console.log();
    }
  }

  /**
   * 处理状态查看
   */
  private async handleStatus(): Promise<void> {
    console.log(chalk.blue('\n📊 项目状态'));

    const spinner = ora('正在获取项目状态...').start();

    try {
      const tasksResult = taskFlowService.getAllTasks();
      const configResult = taskFlowService.getConfig();

      spinner.succeed('状态获取完成');

      if (tasksResult.success && tasksResult.data) {
        const tasks = tasksResult.data;
        const completed = tasks.filter((t: Task) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.DONE).length;
        const inProgress = tasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.RUNNING).length;
        const pending = tasks.filter((t: Task) => t.status === TaskStatus.PENDING || t.status === TaskStatus.NOT_STARTED).length;

        console.log(chalk.green('\n📈 任务统计:'));
        console.log(`  ✅ 已完成: ${completed}`);
        console.log(`  🔄 进行中: ${inProgress}`);
        console.log(`  ⏳ 待开始: ${pending}`);
        console.log(`  📊 总计: ${tasks.length}`);
      }

      if (configResult.success) {
        const config = configResult.data;
        console.log(chalk.blue('\n⚙️  配置状态:'));
        console.log(`  🎯 默认模型: ${config.models?.default || '未设置'}`);
        console.log(`  🔑 已配置模型: ${Object.keys(config.models || {}).filter(k => k !== 'default').length}`);
      }
    } catch (error) {
      spinner.fail('获取状态失败');
      throw error;
    }
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'pending': '⏳',
      'in_progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
      'cancelled': '❌'
    };
    return icons[status] || '❓';
  }

  /**
   * 获取优先级颜色
   */
  private getPriorityColor(priority: string): (text: string) => string {
    const colors: Record<string, (text: string) => string> = {
      'high': chalk.red,
      'medium': chalk.yellow,
      'low': chalk.green
    };
    return colors[priority] || chalk.gray;
  }
}

// 导出实例
export const interactiveCommand = new InteractiveCommand();
