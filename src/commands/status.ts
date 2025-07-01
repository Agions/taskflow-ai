/**
 * TaskFlow AI 状态管理命令
 * 查看和更新任务状态
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Logger } from '../infra/logger';
import { ConfigManager } from '../infra/config';
import { TaskManager } from '../core/task/task-manager';
import { TaskStatus, TaskPriority } from '../types/task';
import { LogLevel } from '../types/config';

/**
 * 状态命令处理器
 */
export class StatusCommand {
  private logger: Logger;
  private configManager: ConfigManager;
  private taskManager: TaskManager;

  constructor() {
    this.logger = Logger.getInstance({ level: LogLevel.INFO, output: 'console' });
    this.configManager = new ConfigManager();
    this.taskManager = new TaskManager(this.logger, this.configManager);
  }

  /**
   * 注册状态命令
   * @param program Commander程序实例
   */
  public register(program: Command): void {
    const statusCmd = program
      .command('status')
      .description('查看和管理任务状态')
      .option('-i, --input <path>', '任务计划文件路径')
      .option('-f, --filter <filter>', '过滤条件 (status|type|assignee|priority)')
      .option('-v, --verbose', '显示详细信息')
      .action(async (options) => {
        await this.handleStatus(options);
      });

    // 子命令：更新任务状态
    statusCmd
      .command('update <taskId> <status>')
      .description('更新任务状态')
      .option('-i, --input <path>', '任务计划文件路径')
      .action(async (taskId, status, options) => {
        await this.handleUpdateStatus(taskId, status, options);
      });

    // 子命令：显示进度统计
    statusCmd
      .command('progress')
      .alias('stats')
      .description('显示项目进度统计')
      .option('-i, --input <path>', '任务计划文件路径')
      .action(async (options) => {
        await this.handleProgress(options);
      });

    // 子命令：获取下一个任务
    statusCmd
      .command('next')
      .description('获取推荐的下一个任务')
      .option('-i, --input <path>', '任务计划文件路径')
      .option('-n, --number <count>', '显示任务数量', '3')
      .action(async (options) => {
        await this.handleNext(options);
      });

    // 子命令：列出任务
    statusCmd
      .command('list')
      .alias('ls')
      .description('列出所有任务')
      .option('-i, --input <path>', '任务计划文件路径')
      .option('-s, --status <status>', '按状态过滤')
      .option('-t, --type <type>', '按类型过滤')
      .option('-a, --assignee <assignee>', '按负责人过滤')
      .option('-p, --priority <priority>', '按优先级过滤')
      .action(async (options) => {
        await this.handleList(options);
      });
  }

  /**
   * 处理状态命令
   * @param options 命令选项
   */
  private async handleStatus(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📊 TaskFlow AI - 任务状态'));
      console.log();

      // 加载任务计划
      const taskPlan = await this.loadTaskPlan(options.input);
      if (!taskPlan) {
        return;
      }

      console.log(chalk.green(`✅ 项目: ${taskPlan.name}`));
      console.log(chalk.gray(`   描述: ${taskPlan.description}`));
      console.log();

      // 显示进度统计
      await this.showProgressStats(taskPlan);

      // 显示任务列表
      if (options.verbose) {
        console.log(chalk.cyan('📋 任务列表:'));
        console.log();
        this.displayTaskList(taskPlan.tasks, options);
      }

    } catch (error) {
      console.error(chalk.red('❌ 获取状态失败:'));
      console.error(chalk.red((error as Error).message));
    }
  }

  /**
   * 处理更新状态命令
   * @param taskId 任务ID
   * @param status 新状态
   * @param options 选项
   */
  private async handleUpdateStatus(taskId: string, status: string, options: any): Promise<void> {
    try {
      console.log(chalk.blue('🔄 TaskFlow AI - 更新任务状态'));
      console.log();

      // 验证状态值
      const validStatuses = Object.values(TaskStatus);
      if (!validStatuses.includes(status as TaskStatus)) {
        console.error(chalk.red(`❌ 无效的状态值: ${status}`));
        console.log(chalk.gray(`支持的状态: ${validStatuses.join(', ')}`));
        return;
      }

      // 加载任务计划
      const taskPlan = await this.loadTaskPlan(options.input);
      if (!taskPlan) {
        return;
      }

      this.taskManager.setTaskPlan(taskPlan);

      // 更新任务状态
      const task = this.taskManager.updateTask(taskId, { status: status as TaskStatus });
      if (!task) {
        console.error(chalk.red(`❌ 任务不存在: ${taskId}`));
        return;
      }

      // 保存更新
      await this.taskManager.saveTaskPlan();

      console.log(chalk.green(`✅ 任务状态已更新:`));
      console.log(chalk.gray(`   任务: ${task.title}`));
      console.log(chalk.gray(`   状态: ${this.getStatusDisplay(task.status)} → ${this.getStatusDisplay(status)}`));

      // 显示相关信息
      if (status === TaskStatus.COMPLETED) {
        const nextTasks = this.taskManager.getNextTasks();
        if (nextTasks.length > 0) {
          console.log();
          console.log(chalk.cyan('🎯 推荐的下一个任务:'));
          nextTasks.slice(0, 3).forEach(nextTask => {
            console.log(chalk.gray(`   - ${nextTask.title} (${nextTask.priority})`));
          });
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ 更新状态失败:'));
      console.error(chalk.red((error as Error).message));
    }
  }

  /**
   * 处理进度命令
   * @param options 选项
   */
  private async handleProgress(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📈 TaskFlow AI - 项目进度'));
      console.log();

      // 加载任务计划
      const taskPlan = await this.loadTaskPlan(options.input);
      if (!taskPlan) {
        return;
      }

      await this.showProgressStats(taskPlan);

    } catch (error) {
      console.error(chalk.red('❌ 获取进度失败:'));
      console.error(chalk.red((error as Error).message));
    }
  }

  /**
   * 处理下一个任务命令
   * @param options 选项
   */
  private async handleNext(options: any): Promise<void> {
    try {
      console.log(chalk.blue('🎯 TaskFlow AI - 推荐任务'));
      console.log();

      // 加载任务计划
      const taskPlan = await this.loadTaskPlan(options.input);
      if (!taskPlan) {
        return;
      }

      this.taskManager.setTaskPlan(taskPlan);
      const nextTasks = this.taskManager.getNextTasks();

      if (nextTasks.length === 0) {
        console.log(chalk.yellow('🎉 所有任务都已完成或被阻塞!'));
        return;
      }

      const count = Math.min(parseInt(options.number) || 3, nextTasks.length);
      console.log(chalk.green(`✅ 推荐的 ${count} 个任务:`));
      console.log();

      nextTasks.slice(0, count).forEach((task, index) => {
        console.log(chalk.cyan(`${index + 1}. ${task.title}`));
        console.log(chalk.gray(`   ID: ${task.id}`));
        console.log(chalk.gray(`   优先级: ${this.getPriorityDisplay(task.priority)}`));
        console.log(chalk.gray(`   类型: ${task.type}`));
        console.log(chalk.gray(`   预计时间: ${task.estimatedHours || 8} 小时`));
        if (task.assignee) {
          console.log(chalk.gray(`   负责人: ${task.assignee}`));
        }
        console.log();
      });

    } catch (error) {
      console.error(chalk.red('❌ 获取推荐任务失败:'));
      console.error(chalk.red((error as Error).message));
    }
  }

  /**
   * 处理列表命令
   * @param options 选项
   */
  private async handleList(options: any): Promise<void> {
    try {
      console.log(chalk.blue('📋 TaskFlow AI - 任务列表'));
      console.log();

      // 加载任务计划
      const taskPlan = await this.loadTaskPlan(options.input);
      if (!taskPlan) {
        return;
      }

      this.taskManager.setTaskPlan(taskPlan);

      // 应用过滤器
      const filter: any = {};
      if (options.status) filter.status = options.status;
      if (options.type) filter.type = options.type;
      if (options.assignee) filter.assignee = options.assignee;
      if (options.priority) filter.priority = options.priority;

      const tasks = Object.keys(filter).length > 0
        ? this.taskManager.filterTasks(filter)
        : this.taskManager.getAllTasks();

      if (tasks.length === 0) {
        console.log(chalk.yellow('📭 没有找到匹配的任务'));
        return;
      }

      console.log(chalk.green(`✅ 找到 ${tasks.length} 个任务:`));
      console.log();

      this.displayTaskList(tasks, options);

    } catch (error) {
      console.error(chalk.red('❌ 获取任务列表失败:'));
      console.error(chalk.red((error as Error).message));
    }
  }

  /**
   * 加载任务计划
   * @param inputPath 输入路径
   */
  private async loadTaskPlan(inputPath?: string): Promise<any> {
    try {
      if (inputPath) {
        if (!fs.existsSync(inputPath)) {
          console.error(chalk.red(`❌ 任务计划文件不存在: ${inputPath}`));
          return null;
        }
        return await this.taskManager.loadTaskPlan(inputPath);
      } else {
        const defaultPaths = [
          './taskflow/tasks.json',
          './tasks/tasks.json',
          './tasks.json'
        ];

        for (const defaultPath of defaultPaths) {
          if (fs.existsSync(defaultPath)) {
            return await this.taskManager.loadTaskPlan(defaultPath);
          }
        }

        console.error(chalk.red('❌ 未找到任务计划文件'));
        console.log(chalk.gray('请使用 -i 选项指定任务计划文件路径'));
        return null;
      }
    } catch (error) {
      console.error(chalk.red(`❌ 加载任务计划失败: ${(error as Error).message}`));
      return null;
    }
  }

  /**
   * 显示进度统计
   * @param taskPlan 任务计划
   */
  private async showProgressStats(taskPlan: any): Promise<void> {
    const stats = {
      total: taskPlan.tasks.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      blocked: 0
    };

    taskPlan.tasks.forEach((task: any) => {
      switch (task.status) {
        case TaskStatus.COMPLETED:
          stats.completed++;
          break;
        case TaskStatus.IN_PROGRESS:
          stats.inProgress++;
          break;
        case TaskStatus.NOT_STARTED:
          stats.notStarted++;
          break;
        case TaskStatus.BLOCKED:
          stats.blocked++;
          break;
      }
    });

    const completionRate = (stats.completed / stats.total) * 100;

    console.log(chalk.cyan('📊 项目进度:'));
    console.log(chalk.green(`   完成率: ${completionRate.toFixed(1)}%`));
    console.log(chalk.gray(`   总任务: ${stats.total}`));
    console.log(chalk.gray(`   已完成: ${stats.completed}`));
    console.log(chalk.gray(`   进行中: ${stats.inProgress}`));
    console.log(chalk.gray(`   未开始: ${stats.notStarted}`));
    console.log(chalk.gray(`   被阻塞: ${stats.blocked}`));
    console.log();

    // 进度条
    const progressBar = this.generateProgressBar(completionRate);
    console.log(chalk.cyan(`进度: ${progressBar} ${completionRate.toFixed(1)}%`));
    console.log();
  }

  /**
   * 显示任务列表
   * @param tasks 任务列表
   * @param options 选项
   */
  private displayTaskList(tasks: any[], options: any): void {
    tasks.forEach((task, index) => {
      const statusIcon = this.getStatusIcon(task.status);
      const priorityColor = this.getPriorityColor(task.priority);

      console.log(`${statusIcon} ${priorityColor(task.title)}`);
      console.log(chalk.gray(`   ID: ${task.id}`));
      console.log(chalk.gray(`   状态: ${this.getStatusDisplay(task.status)}`));
      console.log(chalk.gray(`   优先级: ${this.getPriorityDisplay(task.priority)}`));

      if (task.assignee) {
        console.log(chalk.gray(`   负责人: ${task.assignee}`));
      }

      if (task.estimatedHours) {
        console.log(chalk.gray(`   预计时间: ${task.estimatedHours} 小时`));
      }

      if (task.dependencies && task.dependencies.length > 0) {
        console.log(chalk.gray(`   依赖: ${task.dependencies.join(', ')}`));
      }

      console.log();
    });
  }

  /**
   * 获取状态图标
   * @param status 状态
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case TaskStatus.COMPLETED:
        return '✅';
      case TaskStatus.IN_PROGRESS:
        return '🔄';
      case TaskStatus.BLOCKED:
        return '🚫';
      case TaskStatus.CANCELLED:
        return '❌';
      default:
        return '⏳';
    }
  }

  /**
   * 获取状态显示文本
   * @param status 状态
   */
  private getStatusDisplay(status: string): string {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return '未开始';
      case TaskStatus.IN_PROGRESS:
        return '进行中';
      case TaskStatus.COMPLETED:
        return '已完成';
      case TaskStatus.BLOCKED:
        return '被阻塞';
      case TaskStatus.CANCELLED:
        return '已取消';
      default:
        return status;
    }
  }

  /**
   * 获取优先级显示文本
   * @param priority 优先级
   */
  private getPriorityDisplay(priority: string): string {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return '紧急';
      case TaskPriority.HIGH:
        return '高';
      case TaskPriority.MEDIUM:
        return '中';
      case TaskPriority.LOW:
        return '低';
      default:
        return priority;
    }
  }

  /**
   * 获取优先级颜色函数
   * @param priority 优先级
   */
  private getPriorityColor(priority: string): (text: string) => string {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return chalk.red;
      case TaskPriority.HIGH:
        return chalk.yellow;
      case TaskPriority.MEDIUM:
        return chalk.blue;
      case TaskPriority.LOW:
        return chalk.gray;
      default:
        return chalk.white;
    }
  }

  /**
   * 生成进度条
   * @param percentage 百分比
   */
  private generateProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }
}

// 导出命令实例
export const statusCommand = new StatusCommand();
