import { getLogger } from '../../../utils/logger';
/**
 * Agent 运行器
 */

import chalk = require('chalk');
import ora = require('ora');
import { AgentStateMachine } from '../../../agent/state-machine';
import { AgentConfig, AgentContext, PRDDocument } from '../../../agent/types';
import type { AgentState } from '../../../agent/state-machine/types';
import { PlanningEngine } from '../../../agent/planning';
import { ExecutionEngine } from '../../../agent/execution';
import { VerificationEngine } from '../../../agent/verification/engine';
import { MCPServer } from '../../../mcp/server';
import { ConfigManager } from '../../../core/config';
import { MockAIService } from './mock-ai';
import type { TaskFlowConfig } from '../../../types/config';
const logger = getLogger('cli/commands/agent/runner');

import * as path from 'path';

export interface RunOptions {
  prd: PRDDocument;
  mode: AgentConfig['mode'];
  maxIterations: number;
  timeout: number;
  continueOnError: boolean;
  dryRun: boolean;
  constraints: string[];
}

export async function runAgent(options: RunOptions): Promise<void> {
  const spinner = ora('Initializing AI Agent...').start();

  try {
    const configManager = new ConfigManager(process.cwd());
    const projectConfig = (await configManager.loadConfig()) || createDefaultConfig();

    spinner.succeed(`PRD loaded: ${options.prd.title}`);

    const agentConfig: AgentConfig = {
      mode: options.mode,
      maxIterations: options.maxIterations,
      autoFix: options.mode === 'autonomous',
      approvalRequired: options.mode === 'supervised' ? ['file_write', 'shell_exec'] : [],
      continueOnError: options.continueOnError,
      timeout: options.timeout,
    };

    console.log(chalk.blue('\n⚙️  Agent Configuration:'));
    console.log(`   Mode: ${chalk.yellow(agentConfig.mode)}`);
    console.log(`   Max Iterations: ${chalk.yellow(agentConfig.maxIterations)}`);
    console.log(`   Auto Fix: ${chalk.yellow(agentConfig.autoFix)}`);

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 DRY RUN MODE - No changes will be made\n'));
      return;
    }

    const agentContext: AgentContext = {
      prd: options.prd,
      projectConfig,
      availableTools: [],
      constraints: options.constraints,
    };

    const aiService = new MockAIService();
    const planningEngine = new PlanningEngine(aiService);
    const mcpServer = new MCPServer({ serverName: 'agent', version: '1.0.0' }, projectConfig);
    const executionEngine = new ExecutionEngine(mcpServer, {
      config: agentConfig as unknown as Record<string, unknown>,
      projectPath: process.cwd(),
      workspacePath: path.join(process.cwd(), '.taskflow', 'workspace'),
    });
    const verificationEngine = new VerificationEngine(process.cwd());

    const agent = new AgentStateMachine(
      agentContext,
      agentConfig,
      planningEngine,
      executionEngine,
      verificationEngine
    );

    console.log(chalk.blue('\n🚀 Starting Agent execution...\n'));

    agent.start();
    agent.send({ type: 'START' });

    // Wait for completion
    await new Promise<void>(resolve => {
      agent.onStateChange((state: AgentState) => {
        if (state === 'completed' || state === 'failed') {
          resolve();
        }
      });
    });

    const success = agent.getState() === 'completed';

    if (success) {
      console.log(chalk.green('\n✅ Agent execution completed successfully!'));
    } else {
      console.log(chalk.red('\n❌ Agent execution failed'));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Agent execution failed');
    logger.error(chalk.red(error));
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDefaultConfig(): any {
  return {
    projectName: 'Untitled Project',
    version: '1.0.0',
    aiModels: [],
    mcpSettings: {
      enabled: true,
      serverName: 'taskflow-agent',
      version: '1.0.0',
      port: 3000,
      host: 'localhost',
      capabilities: [
        { name: 'tools', version: '1.0', description: 'Tool support', enabled: true },
        { name: 'resources', version: '1.0', description: 'Resource support', enabled: true },
        { name: 'prompts', version: '1.0', description: 'Prompt support', enabled: true },
      ],
      security: {
        authRequired: false,
        allowedOrigins: [],
        rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
        sandbox: { enabled: true, timeout: 30000, memoryLimit: 512 },
      },
      tools: [],
      resources: [],
    },
    outputFormats: ['markdown'],
    plugins: [],
  };
}
