/**
 * Agent CLI 命令
 * AI Agent 自主执行模式
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { AgentService } from '../../agent/state-machine';
import { PlanningEngine } from '../../agent/planning/engine';
import { ExecutionEngine } from '../../agent/execution/engine';
import { VerificationEngine } from '../../agent/verification/engine';
import { MCPServer } from '../../mcp/server';
import { ConfigManager } from '../../core/config';
import {
  AgentConfig,
  AgentContext,
  PRDDocument,
  Requirement
} from '../../agent/types';

// 模拟 AI 服务（实际应该使用 OpenAI 或其他 AI 服务）
class MockAIService {
  async complete(prompt: string, options?: any): Promise<string> {
    // 模拟 AI 响应
    if (prompt.includes('task plan')) {
      return JSON.stringify({
        tasks: [
          {
            title: 'Setup Project',
            description: 'Initialize project structure',
            type: 'shell',
            priority: 'high',
            estimate: 2,
            dependencies: [],
            tags: ['setup']
          },
          {
            title: 'Implement Feature',
            description: 'Implement the main feature',
            type: 'code',
            priority: 'high',
            estimate: 8,
            dependencies: [],
            outputPath: 'src/feature/index.ts',
            tags: ['core', 'feature']
          },
          {
            title: 'Add Tests',
            description: 'Write unit tests',
            type: 'test',
            priority: 'medium',
            estimate: 4,
            dependencies: ['T002'],
            tags: ['test']
          }
        ]
      });
    }

    if (prompt.includes('analyze')) {
      return JSON.stringify({
        features: [
          {
            name: 'Core Feature',
            description: 'Main feature implementation',
            complexity: 'medium',
            dependencies: []
          }
        ],
        technicalConstraints: ['TypeScript', 'React'],
        risks: []
      });
    }

    return '{}';
  }
}

export const agentCommand = new Command('agent')
  .description('AI Agent autonomous execution mode')
  .option('-p, --prd <path>', 'PRD document path')
  .option('-m, --mode <mode>', 'Execution mode: assisted|autonomous|supervised', 'assisted')
  .option('-c, --constraint <constraints...>', 'Constraints (e.g., "use TypeScript", "follow existing style")')
  .option('--max-iterations <n>', 'Maximum iterations', '10')
  .option('--timeout <ms>', 'Task timeout in milliseconds', '30000')
  .option('--dry-run', 'Simulate execution without making changes')
  .option('--continue-on-error', 'Continue execution even if tasks fail')
  .action(async (options) => {
    const spinner = ora('Initializing AI Agent...').start();

    try {
      // 1. 加载 PRD
      if (!options.prd) {
        spinner.fail('PRD path is required. Use --prd <path>');
        process.exit(1);
      }

      const prdPath = path.resolve(options.prd);
      if (!await fs.pathExists(prdPath)) {
        spinner.fail(`PRD file not found: ${prdPath}`);
        process.exit(1);
      }

      const prdContent = await fs.readFile(prdPath, 'utf-8');
      const prd = parsePRD(prdContent, prdPath);

      spinner.succeed(`PRD loaded: ${prd.title}`);

      // 2. 加载项目配置
      const configManager = new ConfigManager(process.cwd());
      let projectConfig = await configManager.loadConfig();

      if (!projectConfig) {
        projectConfig = {
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
              { name: 'prompts', version: '1.0', description: 'Prompt support', enabled: true }
            ],
            security: {
              authRequired: false,
              allowedOrigins: [],
              rateLimit: { enabled: true, maxRequests: 100, windowMs: 60000 },
              sandbox: { enabled: true, timeout: 30000, memoryLimit: 512 }
            },
            tools: [],
            resources: []
          },
          outputFormats: ['markdown'],
          plugins: []
        };
      }

      // 3. 创建 Agent 配置
      const agentConfig: AgentConfig = {
        mode: options.mode as AgentConfig['mode'],
        maxIterations: parseInt(options.maxIterations),
        autoFix: options.mode === 'autonomous',
        approvalRequired: options.mode === 'supervised'
          ? ['file_write', 'shell_exec']
          : [],
        continueOnError: options.continueOnError || false,
        timeout: parseInt(options.timeout)
      };

      console.log(chalk.blue('\n⚙️  Agent Configuration:'));
      console.log(`   Mode: ${chalk.yellow(agentConfig.mode)}`);
      console.log(`   Max Iterations: ${chalk.yellow(agentConfig.maxIterations)}`);
      console.log(`   Auto Fix: ${chalk.yellow(agentConfig.autoFix)}`);
      console.log(`   Continue on Error: ${chalk.yellow(agentConfig.continueOnError)}`);

      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 DRY RUN MODE - No changes will be made\n'));
      }

      // 4. 创建 Agent 上下文
      const agentContext: AgentContext = {
        prd,
        projectConfig,
        availableTools: [], // 从 MCP 服务器获取
        constraints: options.constraint || []
      };

      // 5. 创建引擎
      const aiService = new MockAIService();
      const planningEngine = new PlanningEngine(aiService);
      const mcpServer = new MCPServer(
        { serverName: 'agent', version: '1.0.0' },
        projectConfig
      );
      const executionEngine = new ExecutionEngine(mcpServer, {
        config: agentConfig,
        projectPath: process.cwd(),
        workspacePath: path.join(process.cwd(), '.taskflow', 'workspace')
      });
      const verificationEngine = new VerificationEngine(process.cwd());

      // 6. 创建 Agent 服务
      const agentService = new AgentService(
        agentContext,
        agentConfig,
        planningEngine,
        executionEngine,
        verificationEngine
      );

      // 7. 监听状态变化
      agentService.onTransition((state) => {
        const statusMessage = getStatusMessage(state.status);
        spinner.text = statusMessage;

        if (state.status === 'completed') {
          spinner.succeed(chalk.green('✅ Agent execution completed successfully!'));
          console.log(chalk.green('\n📊 Execution Report:'));
          console.log(generateReport(state));
        } else if (state.status === 'failed') {
          spinner.fail(chalk.red('❌ Agent execution failed'));
          if (state.error) {
            console.error(chalk.red('\nError:'), state.error.message);
          }
        } else if (state.status === 'awaitingApproval') {
          spinner.stop();
          console.log(chalk.yellow('\n⏸️  Awaiting user approval...'));
          console.log('Actions requiring approval:', agentConfig.approvalRequired);
          // 这里可以添加交互式确认
        }
      });

      // 8. 启动 Agent
      console.log(chalk.blue('\n🚀 Starting Agent...\n'));
      agentService.start();

      // 9. 等待完成
      await waitForCompletion(agentService);

    } catch (error) {
      spinner.fail(`Failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Agent 子命令
agentCommand
  .command('status')
  .description('Check agent execution status')
  .option('-s, --session <id>', 'Session ID')
  .action(async (options) => {
    if (!options.session) {
      console.log(chalk.yellow('No session ID provided'));
      return;
    }

    console.log(chalk.blue(`Checking status for session: ${options.session}`));
    // 实现状态查询逻辑
  });

agentCommand
  .command('list')
  .description('List all agent sessions')
  .action(async () => {
    console.log(chalk.blue('Active Agent Sessions:'));
    // 实现会话列表逻辑
  });

agentCommand
  .command('pause')
  .description('Pause agent execution')
  .option('-s, --session <id>', 'Session ID')
  .action(async (options) => {
    if (!options.session) {
      console.log(chalk.red('Session ID is required'));
      return;
    }
    console.log(chalk.yellow(`Pausing session: ${options.session}`));
  });

agentCommand
  .command('resume')
  .description('Resume agent execution')
  .option('-s, --session <id>', 'Session ID')
  .action(async (options) => {
    if (!options.session) {
      console.log(chalk.red('Session ID is required'));
      return;
    }
    console.log(chalk.green(`Resuming session: ${options.session}`));
  });

agentCommand
  .command('stop')
  .description('Stop agent execution')
  .option('-s, --session <id>', 'Session ID')
  .action(async (options) => {
    if (!options.session) {
      console.log(chalk.red('Session ID is required'));
      return;
    }
    console.log(chalk.red(`Stopping session: ${options.session}`));
  });

// 辅助函数

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'idle': 'Ready to start',
    'planning': '📋 Analyzing PRD and planning tasks...',
    'executing': '🔄 Executing tasks...',
    'verifying': '🔍 Verifying results...',
    'awaitingApproval': '⏸️  Awaiting user approval...',
    'completed': '✅ Completed!',
    'failed': '❌ Failed'
  };
  return messages[status] || 'Processing...';
}

function parsePRD(content: string, filePath: string): PRDDocument {
  // 简化实现：从 Markdown 解析 PRD
  const lines = content.split('\n');
  const title = lines[0]?.replace(/^#\s*/, '') || 'Untitled';

  const requirements: Requirement[] = [];
  let inRequirements = false;

  for (const line of lines) {
    if (line.includes('## Requirements') || line.includes('## 需求')) {
      inRequirements = true;
      continue;
    }

    if (inRequirements && line.startsWith('##')) {
      inRequirements = false;
      continue;
    }

    if (inRequirements && line.startsWith('- ')) {
      const reqText = line.replace(/^-\s*/, '');
      const priority = reqText.includes('[High]') || reqText.includes('[高]')
        ? 'high'
        : reqText.includes('[Low]') || reqText.includes('[低]')
          ? 'low'
          : 'medium';

      requirements.push({
        id: `REQ-${requirements.length + 1}`,
        title: reqText.replace(/\[.*?\]\s*/, ''),
        description: reqText,
        priority,
        type: 'functional'
      });
    }
  }

  // 提取验收标准
  const acceptanceCriteria: string[] = [];
  let inCriteria = false;

  for (const line of lines) {
    if (line.includes('## Acceptance') || line.includes('## 验收')) {
      inCriteria = true;
      continue;
    }

    if (inCriteria && line.startsWith('##')) {
      inCriteria = false;
      continue;
    }

    if (inCriteria && line.startsWith('- ')) {
      acceptanceCriteria.push(line.replace(/^-\s*/, ''));
    }
  }

  return {
    id: `PRD-${Date.now()}`,
    title,
    description: content.slice(0, 500),
    requirements,
    acceptanceCriteria,
    metadata: {
      author: 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      tags: []
    }
  };
}

function generateReport(state: any): string {
  const lines: string[] = [];

  if (state.context?.taskPlan) {
    lines.push(`Tasks Planned: ${state.context.taskPlan.tasks.length}`);
    lines.push(`Total Estimate: ${state.context.taskPlan.totalEstimate} hours`);
  }

  if (state.context?.executionResult) {
    const result = state.context.executionResult;
    lines.push(`Tasks Completed: ${result.summary.completedTasks}/${result.summary.totalTasks}`);
    lines.push(`Tasks Failed: ${result.summary.failedTasks}`);
    lines.push(`Total Duration: ${(result.summary.totalDuration / 1000).toFixed(2)}s`);
  }

  if (state.context?.verificationResult) {
    const result = state.context.verificationResult;
    const passed = result.checks.filter((c: any) => c.passed).length;
    lines.push(`Verification Checks: ${passed}/${result.checks.length} passed`);
  }

  return lines.map(l => `   ${l}`).join('\n');
}

async function waitForCompletion(agentService: AgentService): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const state = agentService.getState();
      if (state.status === 'completed' || state.status === 'failed') {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
  });
}

export default agentCommand;
