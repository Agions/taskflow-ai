/**
 * Agent 命令
 * taskflow agent create|list|run|collaborate
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { agentCoordinator, AgentFactory } from '../../core/agent';
import { AgentTask } from '../../core/agent/types';

const program = new Command('agent');

/**
 * 创建 Agent
 */
program
  .command('create')
  .description('创建新的 Agent')
  .argument('<type>', 'Agent 类型 (analyzer|executor|reviewer)')
  .argument('[name]', 'Agent 名称')
  .action((type: string, name?: string) => {
    let agent;
    
    switch (type) {
      case 'analyzer':
        agent = AgentFactory.createAnalyzer(name || 'analyzer');
        break;
      case 'executor':
        agent = AgentFactory.createExecutor(name || 'executor');
        break;
      case 'reviewer':
        agent = AgentFactory.createReviewer(name || 'reviewer');
        break;
      default:
        console.log(chalk.red(`未知类型: ${type}`));
        return;
    }

    agentCoordinator.register(agent);
    
    console.log(chalk.green(`\n✅ Agent 已创建:`));
    console.log(`   ID: ${agent.id}`);
    console.log(`   名称: ${agent.name}`);
    console.log(`   类型: ${type}`);
    console.log(`   能力: ${agent.capabilities.join(', ')}`);
    console.log(`   工具: ${agent.tools.join(', ')}\n`);
  });

/**
 * 列出 Agent
 */
program
  .command('list')
  .description('列出所有 Agent')
  .action(() => {
    const agents = agentCoordinator.list();

    if (agents.length === 0) {
      console.log(chalk.yellow('暂无 Agent'));
      return;
    }

    console.log(chalk.bold('\n🤖 Agent 列表:\n'));
    
    for (const agent of agents) {
      const statusColor = agent.status === 'idle' ? chalk.green :
                        agent.status === 'executing' ? chalk.cyan :
                        agent.status === 'failed' ? chalk.red : chalk.gray;
      
      console.log(`  ${chalk.cyan(agent.name)}`);
      console.log(`    ID: ${agent.id}`);
      console.log(`    状态: ${statusColor(agent.status)}`);
      console.log(`    能力: ${agent.capabilities.join(', ')}`);
      console.log(`    描述: ${agent.description || '-'}\n`);
    }
  });

/**
 * 运行 Agent
 */
program
  .command('run')
  .description('运行 Agent 执行任务')
  .argument('<agentId>', 'Agent ID')
  .argument('<task>', '任务描述')
  .option('-g, --goal <goal>', '目标')
  .action(async (agentId: string, task: string, options) => {
    const agent = agentCoordinator.get(agentId);
    
    if (!agent) {
      console.log(chalk.red(`Agent 不存在: ${agentId}`));
      return;
    }

    console.log(chalk.cyan(`\n🚀 启动 Agent: ${agentId}`));
    console.log(`   任务: ${task}\n`);

    const agentTask: AgentTask = {
      id: `task-${Date.now()}`,
      description: task,
      goal: options.goal || task,
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      const execution = await agent.execute(agentTask);
      
      console.log(chalk.bold('\n📊 执行结果:\n'));
      console.log(`   状态: ${execution.status === 'completed' ? chalk.green('完成') : chalk.red('失败')}`);
      console.log(`   步骤数: ${execution.steps.length}`);
      console.log(`   耗时: ${execution.finishedAt && execution.startedAt ? execution.finishedAt - execution.startedAt : 0}ms`);
      
      if (execution.steps.length > 0) {
        console.log(chalk.bold('\n📝 执行步骤:'));
        for (const step of execution.steps.slice(0, 5)) {
          const icon = step.type === 'thought' ? '💭' : 
                      step.type === 'action' ? '⚡' : 
                      step.type === 'observation' ? '👁️' : '🔍';
          console.log(`   ${icon} ${step.content.substring(0, 60)}...`);
        }
      }
      
      console.log();
    } catch (error) {
      console.log(chalk.red('执行失败:'), error);
    }
  });

/**
 * 协作模式
 */
program
  .command('collaborate')
  .description('多 Agent 协作')
  .argument('<agentIds...>', 'Agent ID 列表')
  .argument('<task>', '任务描述')
  .action(async (agentIds: string[], task: string) => {
    console.log(chalk.cyan(`\n🤝 启动协作: ${agentIds.join(', ')}`));
    console.log(`   任务: ${task}\n`);

    const agentTask: AgentTask = {
      id: `task-${Date.now()}`,
      description: task,
      goal: task,
      status: 'pending',
      createdAt: Date.now(),
    };

    try {
      const executions = await agentCoordinator.collaborate(agentTask, agentIds);
      
      console.log(chalk.bold('\n📊 协作结果:\n'));
      console.log(`   参与 Agent: ${executions.length}`);
      
      const successCount = executions.filter(e => e.status === 'completed').length;
      console.log(`   成功: ${chalk.green(successCount)}`);
      console.log(`   失败: ${chalk.red(executions.length - successCount)}\n`);
    } catch (error) {
      console.log(chalk.red('协作失败:'), error);
    }
  });

export default program;
export const agentCommand = program;
