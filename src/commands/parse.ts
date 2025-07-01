import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { taskFlowService } from '../mcp/index';
import { ModelType } from '../types/config';

/**
 * 解析PRD文档命令
 * @param program Commander实例
 */
export default function parseCommand(program: Command): void {
  program
    .command('parse <file>')
    .description('解析PRD文档并提取结构化信息')
    .option('-m, --model <model>', '使用指定的模型类型', 'baidu')
    .option('-o, --output <output>', '输出文件路径')
    .option('-p, --pretty', '格式化输出结果', false)
    .action(async (file, options) => {
      try {
        // 检查文件是否存在
        const filePath = path.resolve(process.cwd(), file);
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red(`错误: 文件 ${filePath} 不存在`));
          return;
        }

        // 检查文件类型
        const ext = path.extname(filePath).toLowerCase();
        const supportedExts = ['.md', '.txt', '.pdf'];
        if (!supportedExts.includes(ext)) {
          console.error(chalk.red(`错误: 不支持的文件类型 ${ext}，目前支持: ${supportedExts.join(', ')}`));
          return;
        }

        // 开始解析
        const spinner = ora('正在解析PRD文档...').start();

        // 解析文档
        const modelType = options.model.toLowerCase() as ModelType;
        const result = await taskFlowService.parsePRDFromFile(filePath, {
          modelType,
          extractSections: true,
          extractFeatures: true,
          prioritize: true,
        });

        // 检查解析结果
        if (result.error) {
          spinner.fail(chalk.red(`解析失败: ${result.error}`));
          return;
        }

        // 处理输出
        if (options.output) {
          const outputPath = path.resolve(process.cwd(), options.output);
          await fs.ensureDir(path.dirname(outputPath));

          const outputContent = JSON.stringify(result.data, null, options.pretty ? 2 : 0);
          await fs.writeFile(outputPath, outputContent, 'utf-8');

          spinner.succeed(chalk.green(`PRD解析完成，结果已保存至 ${chalk.blue(outputPath)}`));
        } else {
          spinner.succeed(chalk.green('PRD解析完成'));
          console.log(chalk.cyan('\n解析结果:'));

          // 格式化输出
          const formattedResult = options.pretty
            ? JSON.stringify(result.data, null, 2)
            : JSON.stringify(result.data);

          console.log(formattedResult);
        }

        // 显示后续提示
        console.log(`
${chalk.cyan('后续步骤:')}
1. ${chalk.yellow('mcp plan')} 根据解析结果生成任务计划
        `);
      } catch (error) {
        ora().fail(chalk.red(`解析PRD文档失败: ${(error as Error).message}`));
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });
} 