import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import { taskFlowService } from '../mcp/index';
import { ModelType } from '../types/config';
import { Ora } from 'ora';

// 导入正确的类型定义
import { ParsedPRD } from '../types/task';

// 定义服务响应接口，与TaskFlowService返回格式一致
interface ServiceResponse {
  success: boolean;
  data?: ParsedPRD;
  error?: string;
}

/**
 * 解析PRD文档命令
 * @param program Commander实例
 */
export default function parseCommand(program: Command): void {
  program
    .command('parse <file>')
    .description('解析PRD文档并提取结构化信息')
    .option('-m, --model <model>', '使用指定的模型类型', 'deepseek')
    .option('--multi-model', '启用多模型协作模式', false)
    .option('--primary <model>', '主要模型', 'deepseek')
    .option('--fallback <models>', '备用模型列表，用逗号分隔', 'zhipu,qwen')
    .option('--load-balancing', '启用负载均衡', false)
    .option('--cost-optimization', '启用成本优化', false)
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
        let spinner: Ora;
        let result: ServiceResponse;

        if (options.multiModel) {
          spinner = ora('正在启动多模型协作解析...').start();

          // 解析备用模型列表
          const fallbackModels = options.fallback.split(',').map((m: string) => m.trim().toLowerCase());

          spinner.text = `使用主模型 ${options.primary}，备用模型: ${fallbackModels.join(', ')}`;

          result = await taskFlowService.parsePRDFromFile(filePath, {
            modelType: options.primary.toLowerCase() as ModelType,
            multiModel: {
              enabled: true,
              primary: options.primary.toLowerCase() as ModelType,
              fallback: fallbackModels as ModelType[],
              loadBalancing: options.loadBalancing,
              costOptimization: options.costOptimization
            },
            extractSections: true,
            extractFeatures: true,
            prioritize: true,
          });
        } else {
          spinner = ora('正在解析PRD文档...').start();

          // 单模型解析
          const modelType = options.model.toLowerCase() as ModelType;
          result = await taskFlowService.parsePRDFromFile(filePath, {
            modelType,
            extractSections: true,
            extractFeatures: true,
            prioritize: true,
          });
        }

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