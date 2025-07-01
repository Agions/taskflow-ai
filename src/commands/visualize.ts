/**
 * TaskFlow AI 可视化命令
 * 生成任务计划的各种可视化图表
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { Logger } from '../infra/logger';
import { ConfigManager } from '../infra/config';
import { TaskManager } from '../core/task/task-manager';
import { TaskVisualizer, VisualizationType } from '../core/visualizer/task-visualizer';
import { LogLevel } from '../types/config';

/**
 * 可视化命令处理器
 */
export class VisualizeCommand {
  private logger: Logger;
  private configManager: ConfigManager;
  private taskManager: TaskManager;
  private visualizer: TaskVisualizer;

  constructor() {
    this.logger = Logger.getInstance({ level: LogLevel.INFO, output: 'console' });
    this.configManager = new ConfigManager();
    this.taskManager = new TaskManager(this.logger, this.configManager);
    this.visualizer = new TaskVisualizer(this.logger);
  }

  /**
   * 注册可视化命令
   * @param program Commander程序实例
   */
  public register(program: Command): void {
    const visualizeCmd = program
      .command('visualize')
      .alias('viz')
      .description('生成任务计划可视化图表')
      .option('-t, --type <type>', '可视化类型 (gantt|dependency|kanban|timeline|progress)', 'gantt')
      .option('-f, --format <format>', '输出格式 (mermaid|json|html)', 'mermaid')
      .option('-o, --output <path>', '输出文件路径')
      .option('-i, --input <path>', '任务计划文件路径')
      .option('--include-subtasks', '包含子任务')
      .option('--show-progress', '显示进度信息')
      .option('--group-by <field>', '分组字段 (type|assignee|priority)')
      .action(async (options) => {
        await this.handleVisualize(options);
      });

    // 添加子命令
    visualizeCmd
      .command('gantt')
      .description('生成甘特图')
      .option('-o, --output <path>', '输出文件路径')
      .option('-i, --input <path>', '任务计划文件路径')
      .action(async (options) => {
        await this.handleVisualize({ ...options, type: 'gantt' });
      });

    visualizeCmd
      .command('dependency')
      .alias('deps')
      .description('生成依赖关系图')
      .option('-o, --output <path>', '输出文件路径')
      .option('-i, --input <path>', '任务计划文件路径')
      .action(async (options) => {
        await this.handleVisualize({ ...options, type: 'dependency' });
      });

    visualizeCmd
      .command('kanban')
      .description('生成看板视图')
      .option('-o, --output <path>', '输出文件路径')
      .option('-i, --input <path>', '任务计划文件路径')
      .option('--group-by <field>', '分组字段 (type|assignee|priority)')
      .action(async (options) => {
        await this.handleVisualize({ ...options, type: 'kanban' });
      });

    visualizeCmd
      .command('progress')
      .description('生成进度图表')
      .option('-o, --output <path>', '输出文件路径')
      .option('-i, --input <path>', '任务计划文件路径')
      .action(async (options) => {
        await this.handleVisualize({ ...options, type: 'progress' });
      });
  }

  /**
   * 处理可视化命令
   * @param options 命令选项
   */
  private async handleVisualize(options: any): Promise<void> {
    try {
      console.log(chalk.blue('🎨 TaskFlow AI - 任务可视化'));
      console.log();

      // 验证可视化类型
      const validTypes = ['gantt', 'dependency', 'kanban', 'timeline', 'progress'];
      if (!validTypes.includes(options.type)) {
        console.error(chalk.red(`❌ 无效的可视化类型: ${options.type}`));
        console.log(chalk.gray(`支持的类型: ${validTypes.join(', ')}`));
        return;
      }

      // 加载任务计划
      const taskPlan = await this.loadTaskPlan(options.input);
      if (!taskPlan) {
        return;
      }

      console.log(chalk.green(`✅ 已加载任务计划: ${taskPlan.name}`));
      console.log(chalk.gray(`   任务数量: ${taskPlan.tasks.length}`));
      console.log();

      // 生成可视化
      console.log(chalk.blue(`🔄 生成 ${options.type} 可视化...`));

      const visualizationOptions = {
        type: options.type as VisualizationType,
        format: options.format || 'mermaid',
        includeSubtasks: options.includeSubtasks || false,
        showProgress: options.showProgress || false,
        groupBy: options.groupBy
      };

      const result = this.visualizer.generateVisualization(taskPlan, visualizationOptions);

      // 输出结果
      if (options.output) {
        await this.saveVisualization(result, options.output, options.format);
        console.log(chalk.green(`✅ 可视化已保存到: ${options.output}`));
      } else {
        // 输出到控制台
        if (typeof result === 'string') {
          console.log(chalk.cyan('📊 可视化结果:'));
          console.log();
          console.log(result);
        } else {
          console.log(chalk.cyan('📊 可视化数据:'));
          console.log();
          console.log(JSON.stringify(result, null, 2));
        }
      }

      console.log();
      console.log(chalk.green('🎉 可视化生成完成!'));

      // 显示使用提示
      this.showUsageTips(options.type, options.format);

    } catch (error) {
      console.error(chalk.red('❌ 可视化生成失败:'));
      console.error(chalk.red((error as Error).message));
      this.logger.error(`可视化生成失败: ${(error as Error).message}`);
    }
  }

  /**
   * 加载任务计划
   * @param inputPath 输入路径
   */
  private async loadTaskPlan(inputPath?: string): Promise<any> {
    try {
      if (inputPath) {
        // 从指定文件加载
        if (!fs.existsSync(inputPath)) {
          console.error(chalk.red(`❌ 任务计划文件不存在: ${inputPath}`));
          return null;
        }
        return await this.taskManager.loadTaskPlan(inputPath);
      } else {
        // 从默认位置加载
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
        console.log(chalk.gray('请使用 -i 选项指定任务计划文件路径，或确保以下位置存在任务文件:'));
        defaultPaths.forEach(p => console.log(chalk.gray(`  - ${p}`)));
        return null;
      }
    } catch (error) {
      console.error(chalk.red(`❌ 加载任务计划失败: ${(error as Error).message}`));
      return null;
    }
  }

  /**
   * 保存可视化结果
   * @param result 可视化结果
   * @param outputPath 输出路径
   * @param format 格式
   */
  private async saveVisualization(result: any, outputPath: string, format: string): Promise<void> {
    // 确保输出目录存在
    await fs.ensureDir(path.dirname(outputPath));

    if (typeof result === 'string') {
      // 字符串结果直接保存
      await fs.writeFile(outputPath, result, 'utf-8');
    } else {
      // 对象结果转换为JSON保存
      await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    }
  }

  /**
   * 显示使用提示
   * @param type 可视化类型
   * @param format 格式
   */
  private showUsageTips(type: string, format: string): void {
    console.log(chalk.cyan('💡 使用提示:'));

    if (format === 'mermaid') {
      console.log(chalk.gray('  - 可以将Mermaid代码复制到 https://mermaid.live 查看图表'));
      console.log(chalk.gray('  - 或在支持Mermaid的Markdown编辑器中使用'));
    }

    switch (type) {
      case 'gantt':
        console.log(chalk.gray('  - 甘特图显示任务时间安排和依赖关系'));
        console.log(chalk.gray('  - 可用于项目时间规划和进度跟踪'));
        break;
      case 'dependency':
        console.log(chalk.gray('  - 依赖关系图显示任务间的依赖关系'));
        console.log(chalk.gray('  - 有助于识别关键路径和潜在瓶颈'));
        break;
      case 'kanban':
        console.log(chalk.gray('  - 看板视图适合敏捷开发流程'));
        console.log(chalk.gray('  - 可按状态、负责人或优先级分组'));
        break;
      case 'progress':
        console.log(chalk.gray('  - 进度图表显示项目整体完成情况'));
        console.log(chalk.gray('  - 适合向管理层汇报项目状态'));
        break;
    }
  }
}

// 导出命令实例
export const visualizeCommand = new VisualizeCommand();
