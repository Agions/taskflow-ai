import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { taskFlowService } from '../mcp/index';
import { ModelType } from '../types/config';
import { Task } from '../types/task';

/**
 * 生成任务计划命令
 * @param program Commander实例
 */
export default function planCommand(program: Command): void {
  program
    .command('plan [parsed-file]')
    .description('根据解析的PRD生成任务计划')
    .option('-m, --model <model>', '使用指定的模型类型', 'baidu')
    .option('-o, --output <output>', '输出文件路径')
    .option('-t, --template <template>', '使用指定的任务模板')
    .option('-e, --estimate', '估算任务时间', false)
    .option('-a, --assign', '分配任务负责人', false)
    .option('-p, --pretty', '格式化输出结果', false)
    .action(async (parsedFile, options) => {
      try {
        const spinner = ora('正在准备生成任务计划...').start();

        const modelType = options.model.toLowerCase() as ModelType;

        // 获取解析结果
        let parsedPRD;
        if (parsedFile) {
          // 使用指定的解析结果文件
          const filePath = path.resolve(process.cwd(), parsedFile);
          if (!fs.existsSync(filePath)) {
            spinner.fail(chalk.red(`错误: 文件 ${filePath} 不存在`));
            return;
          }

          try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            parsedPRD = JSON.parse(fileContent);
          } catch (error) {
            spinner.fail(chalk.red(`错误: 无法读取解析结果文件: ${(error as Error).message}`));
            return;
          }
        } else {
          // 查找最新的解析结果
          spinner.text = '正在查找最新的PRD解析结果...';

          try {
            // 获取最新解析文件
            const baseDir = path.resolve(process.cwd(), 'tasks', 'parsed');
            if (!fs.existsSync(baseDir)) {
              spinner.fail(chalk.red('错误: 没有找到任何解析结果，请先运行 mcp parse 命令'));
              return;
            }

            const files = await fs.readdir(baseDir);
            const parsedFiles = files.filter(file => file.endsWith('_parsed.json'));

            if (parsedFiles.length === 0) {
              spinner.fail(chalk.red('错误: 没有找到任何解析结果，请先运行 mcp parse 命令'));
              return;
            }

            // 如果有多个解析结果，让用户选择
            let selectedFile;
            if (parsedFiles.length > 1) {
              spinner.stop();
              const result = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'selectedFile',
                  message: '找到多个解析结果，请选择:',
                  choices: parsedFiles,
                },
              ]);
              selectedFile = result.selectedFile;
              spinner.start('正在生成任务计划...');
            } else {
              selectedFile = parsedFiles[0];
            }

            // 读取解析结果文件
            const parsedFilePath = path.join(baseDir, selectedFile);
            const fileContent = await fs.readFile(parsedFilePath, 'utf-8');
            parsedPRD = JSON.parse(fileContent);
          } catch (error) {
            spinner.fail(chalk.red(`查找解析结果失败: ${(error as Error).message}`));
            return;
          }
        }

        spinner.text = '正在生成任务计划...';

        // 读取任务模板（如果指定）
        let taskTemplate;
        if (options.template) {
          const templatePath = path.resolve(process.cwd(), options.template);
          if (!fs.existsSync(templatePath)) {
            spinner.fail(chalk.red(`错误: 模板文件 ${templatePath} 不存在`));
            return;
          }

          try {
            taskTemplate = await fs.readFile(templatePath, 'utf-8');
          } catch (error) {
            spinner.fail(chalk.red(`错误: 无法读取模板文件: ${(error as Error).message}`));
            return;
          }
        }

        // 生成任务计划
        const planResult = await taskFlowService.generateTaskPlan(parsedPRD, {
          modelType,
          taskTemplate,
          estimateDuration: options.estimate,
          assignTasks: options.assign,
          suggestDependencies: true,
        });

        // 检查生成结果
        if (planResult.error) {
          spinner.fail(chalk.red(`生成任务计划失败: ${planResult.error}`));
          return;
        }

        const plan = planResult.data;

        // 处理输出
        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output);
          await fs.ensureDir(path.dirname(outputPath));

          const outputContent = JSON.stringify(plan, null, options.pretty ? 2 : 0);
          await fs.writeFile(outputPath, outputContent, 'utf-8');

          spinner.succeed(chalk.green(`任务计划生成完成，结果已保存至 ${chalk.blue(outputPath)}`));
        } else {
          spinner.succeed(chalk.green('任务计划生成完成'));
          console.log(chalk.cyan('\n任务计划概览:'));

          if (plan) {
            console.log(chalk.bold(`名称: ${plan.name || '未命名计划'}`));
            console.log(`描述: ${plan.description || '无描述'}`);
            console.log(`任务数量: ${plan.tasks?.length || 0}`);

            // 输出任务列表
            console.log(chalk.cyan('\n任务列表:'));
            const printTasks = (tasks: Task[], level = 0) => {
              tasks.forEach((task: Task) => {
                const indent = '  '.repeat(level);
                console.log(`${indent}- ${chalk.bold(task.name)} [${task.priority}]`);

                if (task.subtasks && task.subtasks.length > 0) {
                  printTasks(task.subtasks, level + 1);
                }
              });
            };

            if (plan.tasks && plan.tasks.length > 0) {
              printTasks(plan.tasks);
            } else {
              console.log(chalk.gray('  暂无任务'));
            }
          } else {
            console.log(chalk.gray('任务计划为空'));
          }
        }

        // 显示后续提示
        console.log(`
${chalk.cyan('后续步骤:')}
1. ${chalk.yellow('mcp start')} 开始执行任务计划
2. ${chalk.yellow('mcp status')} 查看任务执行状态
        `);
      } catch (error) {
        ora().fail(chalk.red(`生成任务计划失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });
} 