import { getLogger } from '../../../utils/logger';
/**
 * Agent CLI 命令
 * AI Agent 自主执行模式
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { parsePRD } from './prd-parser';
import { runAgent } from './runner';

const logger = getLogger('cli/commands/agent/index');

export * from './mock-ai';
export * from './prd-parser';
export * from './runner';

interface AgentCLIOptions {
  prd?: string;
  mode?: string;
  constraint?: string[];
  maxIterations?: string;
  timeout?: string;
  dryRun?: boolean;
  continueOnError?: boolean;
}

export const agentCommand = new Command('agent')
  .description('AI Agent autonomous execution mode')
  .option('-p, --prd <path>', 'PRD document path')
  .option('-m, --mode <mode>', 'Execution mode: assisted|autonomous|supervised', 'assisted')
  .option('-c, --constraint <constraints...>', 'Constraints')
  .option('--max-iterations <n>', 'Maximum iterations', '10')
  .option('--timeout <ms>', 'Task timeout in milliseconds', '30000')
  .option('--dry-run', 'Simulate execution without making changes')
  .option('--continue-on-error', 'Continue execution even if tasks fail')
  .action(async (options: AgentCLIOptions) => {
    const ora = (await import('ora')).default;
    const spinner = ora('Initializing AI Agent...').start();

    try {
      if (!options.prd) {
        spinner.fail('PRD path is required. Use --prd <path>');
        process.exit(1);
      }

      const prdPath = path.resolve(options.prd);
      if (!(await fs.pathExists(prdPath))) {
        spinner.fail(`PRD file not found: ${prdPath}`);
        process.exit(1);
      }

      const prdContent = await fs.readFile(prdPath, 'utf-8');
      const prd = parsePRD(prdContent, prdPath);

      spinner.stop();

      await runAgent({
        prd,
        mode: options.mode as 'assisted' | 'autonomous' | 'supervised',
        maxIterations: parseInt(options.maxIterations as string),
        timeout: parseInt(options.timeout as string),
        continueOnError: options.continueOnError || false,
        dryRun: options.dryRun || false,
        constraints: (options.constraint as string[] | undefined) || [],
      });
    } catch (error) {
      spinner.fail('Agent execution failed');
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

export default agentCommand;
