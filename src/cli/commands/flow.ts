/**
 * 工作流命令
 * taskflow flow list|run|create|pause|resume
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { WorkflowEngine, WorkflowParser } from '../../core/workflow';
import { loadConfig } from '../../core/config';

const program = new Command('flow');
let engine: WorkflowEngine | null = null;
let parser: WorkflowParser | null = null;

function getEngine(): WorkflowEngine {
  if (!engine) {
    engine = new WorkflowEngine();
  }
  return engine;
}

function getParser(): WorkflowParser {
  if (!parser) {
    parser = new WorkflowParser();
  }
  return parser;
}

/**
 * 列出工作流
 */
program
  .command('list')
  .description('列出所有工作流')
  .option('-d, --dir <dir>', '工作流目录', './workflows')
  .action(async (options) => {
    const workflowDir = path.resolve(options.dir);
    
    if (!(await fs.pathExists(workflowDir))) {
      console.log(chalk.yellow('工作流目录不存在'));
      return;
    }

    const files = await fs.readdir(workflowDir);
    const workflows = files.filter(f => f.endsWith('.json') || f.endsWith('.yaml'));

    if (workflows.length === 0) {
      console.log(chalk.yellow('暂无工作流'));
      return;
    }

    console.log(chalk.bold('\n📋 工作流列表:\n'));
    
    for (const file of workflows) {
      const filePath = path.join(workflowDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const format = file.endsWith('.yaml') ? 'yaml' : 'json';
        const workflow = getParser().parse(content, format);
        
        console.log(`  ${chalk.cyan(workflow.name)} (v${workflow.version})`);
        console.log(`    文件: ${file}`);
        console.log(`    步骤: ${workflow.steps.length}`);
        console.log(`    描述: ${workflow.description || '-'}\n`);
      } catch (_e) {
        console.log(chalk.red(`  ${file} - 解析失败`));
      }
    }
  });

/**
 * 运行工作流
 */
program
  .command('run')
  .description('运行工作流')
  .argument('<name>', '工作流名称')
  .option('-d, --dir <dir>', '工作流目录', './workflows')
  .option('-i, --input <json>', '输入变量 (JSON 格式)')
  .option('-f, --format <format>', '格式 (json|yaml)', 'json')
  .action(async (name: string, options) => {
    const workflowDir = path.resolve(options.dir);
    const filePath = path.join(workflowDir, `${name}.${options.format}`);

    if (!(await fs.pathExists(filePath))) {
      console.log(chalk.red(`工作流文件不存在: ${filePath}`));
      return;
    }

    console.log(chalk.cyan(`\n🚀 运行工作流: ${name}\n`));

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const workflow = getParser().parse(content, options.format as any);

      let input: Record<string, unknown> = {};
      if (options.input) {
        try {
          input = JSON.parse(options.input);
        } catch (e) {
          console.log(chalk.red('输入 JSON 解析失败'));
          return;
        }
      }

      const result = await getEngine().execute(workflow, input);

      if (result.success) {
        console.log(chalk.green(`\n✅ 工作流执行成功!`));
        console.log(`   耗时: ${result.duration}ms`);
        if (result.output) {
          console.log(`\n📊 输出:`);
          console.log(JSON.stringify(result.output, null, 2));
        }
      } else {
        console.log(chalk.red(`\n❌ 工作流执行失败!`));
        console.log(`   错误: ${result.error}`);
      }
    } catch (error) {
      console.log(chalk.red('执行失败:'), error);
    }
  });

/**
 * 创建工作流
 */
program
  .command('create')
  .description('创建新工作流')
  .argument('<name>', '工作流名称')
  .option('-d, --dir <dir>', '工作流目录', './workflows')
  .option('-t, --template <template>', '模板 (basic|prd-to-code|ci-cd)', 'basic')
  .action(async (name: string, options) => {
    const workflowDir = path.resolve(options.dir);
    
    await fs.ensureDir(workflowDir);

    const template = getTemplate(options.template);
    template.name = name;
    template.version = '1.0.0';

    const filePath = path.join(workflowDir, `${name}.json`);
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));

    console.log(chalk.green(`\n✅ 工作流已创建: ${filePath}\n`));
    console.log(chalk.gray('你可以编辑此文件来定制工作流'));
  });

/**
 * 查看执行历史
 */
program
  .command('history')
  .description('查看执行历史')
  .option('-w, --workflow <name>', '工作流名称')
  .action(async (options) => {
    const executions = getEngine().listExecutions();

    if (executions.length === 0) {
      console.log(chalk.yellow('暂无执行历史'));
      return;
    }

    console.log(chalk.bold('\n📜 执行历史:\n'));
    
    for (const exec of executions.slice(-10).reverse()) {
      const statusColor = exec.status === 'completed' ? chalk.green : 
                         exec.status === 'failed' ? chalk.red : 
                         chalk.yellow;
      
      console.log(`  ${chalk.cyan(exec.id)}`);
      console.log(`    状态: ${statusColor(exec.status)}`);
      console.log(`    开始: ${new Date(exec.startedAt).toLocaleString()}`);
      if (exec.finishedAt) {
        console.log(`    耗时: ${exec.finishedAt - exec.startedAt}ms`);
      }
      if (exec.error) {
        console.log(`    ${chalk.red('错误: ' + exec.error)}`);
      }
      console.log();
    }
  });

/**
 * 暂停/恢复 (占位)
 */
program
  .command('pause')
  .description('暂停工作流执行')
  .argument('<executionId>', '执行 ID')
  .action(async (executionId: string) => {
    const success = await getEngine().pause(executionId);
    if (success) {
      console.log(chalk.green('工作流已暂停'));
    } else {
      console.log(chalk.red('暂停失败'));
    }
  });

program
  .command('resume')
  .description('恢复工作流执行')
  .argument('<executionId>', '执行 ID')
  .action(async (executionId: string) => {
    try {
      const result = await getEngine().resume(executionId);
      if (result.success) {
        console.log(chalk.green('工作流已恢复'));
      } else {
        console.log(chalk.red('恢复失败: ' + result.error));
      }
    } catch (error) {
      console.log(chalk.red('恢复失败:', error));
    }
  });

/**
 * 获取模板
 */
function getTemplate(type: string): any {
  switch (type) {
    case 'prd-to-code':
      return {
        name: '',
        description: '从 PRD 生成代码',
        triggers: [{ type: 'manual' }],
        variables: { prd_content: '' },
        steps: [
          {
            id: 'parse',
            name: '解析 PRD',
            type: 'thought',
            prompt: '分析以下 PRD，提取功能点\n{{prd_content}}',
            output_key: 'parsed',
          },
          {
            id: 'decompose',
            name: '任务拆分',
            type: 'task',
            depends_on: ['parse'],
          },
          {
            id: 'generate',
            name: '生成代码',
            type: 'tool',
            tool: 'code_generate',
            depends_on: ['decompose'],
          },
        ],
      };

    case 'ci-cd':
      return {
        name: '',
        description: 'CI/CD 流水线',
        triggers: [{ type: 'event' }],
        steps: [
          {
            id: 'build',
            name: '构建',
            type: 'tool',
            tool: 'shell_exec',
            tool_input: { command: 'npm run build' },
          },
          {
            id: 'test',
            name: '测试',
            type: 'tool',
            tool: 'shell_exec',
            tool_input: { command: 'npm test' },
            depends_on: ['build'],
          },
        ],
      };

    default:
      return {
        name: '',
        description: '基础工作流',
        triggers: [{ type: 'manual' }],
        variables: {},
        steps: [
          {
            id: 'step1',
            name: '步骤 1',
            type: 'task',
          },
          {
            id: 'step2',
            name: '步骤 2',
            type: 'task',
            depends_on: ['step1'],
          },
        ],
      };
  }
}

export default program;
export const flowCommand = program;
