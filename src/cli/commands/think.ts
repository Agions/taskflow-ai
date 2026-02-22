/**
 * 思维分析命令
 * taskflow think <prompt>
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ThoughtChainManager, createRenderer } from '../../core/thought';
import { loadConfig } from '../../core/config';

const program = new Command('think');

// 存储管理器实例
let manager: ThoughtChainManager | null = null;

function getManager(): ThoughtChainManager {
  if (!manager) {
    manager = new ThoughtChainManager({
      verbose: true,
      enableReflection: true,
      outputFormat: 'markdown',
    });
  }
  return manager;
}

/**
 * 思维分析命令
 */
program
  .description('AI 思维链分析')
  .argument('<prompt>', '需要分析的内容')
  .option('-m, --model <model>', '使用的模型')
  .option('-v, --visualize', '可视化输出', false)
  .option('-f, --format <format>', '输出格式 (text|markdown|mermaid|mindmap)', 'markdown')
  .option('--no-reflection', '禁用反思')
  .action(async (prompt: string, options) => {
    console.log(chalk.cyan('\n🧠 思维分析中...\n'));

    const manager = getManager();
    const config = loadConfig();

    // 如果有配置模型，尝试使用 AI 分析
    const models = config.aiModels?.filter(m => m.enabled) || [];
    
    if (models.length > 0) {
      try {
        // 使用 AI 进行深度分析
        await analyzeWithAI(manager, prompt, options.model);
      } catch (_error) {
        console.log(chalk.yellow('AI 分析失败，使用本地分析...\n'));
        analyzeLocally(manager, prompt);
      }
    } else {
      console.log(chalk.yellow('未配置 AI 模型，使用本地分析...\n'));
      analyzeLocally(manager, prompt);
    }

    // 获取最新的思维链
    const chains = manager.listChains();
    if (chains.length === 0) {
      console.log(chalk.red('分析失败'));
      return;
    }

    const latestChain = manager.getChain(chains[chains.length - 1].id);
    if (!latestChain) return;

    // 渲染输出
    if (options.visualize) {
      // 输出 Mermaid 流程图
      const renderer = createRenderer('mermaid');
      console.log(renderer.render(latestChain));
    } else {
      // 标准输出
      const renderer = createRenderer(options.format as any);
      console.log(renderer.render(latestChain));
    }
  });

/**
 * 本地分析 (无需 AI)
 */
function analyzeLocally(manager: ThoughtChainManager, prompt: string): void {
  const chain = manager.createChain(prompt);
  
  // 简单分析
  manager.addNode(
    chain.id,
    chain.root.id,
    'analysis',
    '分析用户输入',
    '理解需求内容'
  );

  // 任务拆解
  manager.addNode(
    chain.id,
    chain.root.id,
    'decomposition',
    '拆解为子任务',
    '将复杂问题分解为可管理的部分'
  );

  // 生成任务
  manager.addNode(
    chain.id,
    chain.root.id,
    'task',
    '生成具体任务列表',
    '创建可执行的任务项'
  );

  // 总结
  manager.addNode(
    chain.id,
    chain.root.id,
    'synthesis',
    '分析完成',
    '输出分析结果'
  );
}

/**
 * AI 辅助分析
 */
async function analyzeWithAI(
  manager: ThoughtChainManager,
  prompt: string,
  _preferredModel?: string
): Promise<void> {
  // 简化实现 - 实际应该调用 ModelGateway
  analyzeLocally(manager, prompt);
  
  // TODO: 集成 ModelGateway 进行深度 AI 分析
  console.log(chalk.gray('(AI 分析模块待完善...)'));
}

/**
 * 列出思维历史
 */
program
  .command('history')
  .description('查看思维分析历史')
  .action(() => {
    const manager = getManager();
    const chains = manager.listChains();

    if (chains.length === 0) {
      console.log(chalk.yellow('暂无分析历史'));
      return;
    }

    console.log(chalk.bold('\n📜 分析历史:\n'));
    
    chains.forEach((chain, index) => {
      const date = new Date(chain.createdAt).toLocaleString();
      const input = chain.input.substring(0, 50);
      console.log(`${index + 1}. ${chalk.cyan(chain.id)}`);
      console.log(`   ${chalk.gray(date)}`);
      console.log(`   ${input}...\n`);
    });
  });

/**
 * 可视化思维链
 */
program
  .command('visualize')
  .description('可视化思维链')
  .argument('[chainId]', '思维链 ID')
  .option('-f, --format <format>', '格式 (mermaid|mindmap)', 'mermaid')
  .action((chainId: string | undefined, options) => {
    const manager = getManager();
    
    let targetChain;
    if (chainId) {
      targetChain = manager.getChain(chainId);
    } else {
      const chains = manager.listChains();
      if (chains.length > 0) {
        targetChain = manager.getChain(chains[chains.length - 1].id);
      }
    }

    if (!targetChain) {
      console.log(chalk.red('未找到思维链'));
      return;
    }

    const renderer = createRenderer(options.format as any);
    console.log(renderer.render(targetChain));
  });

export default program;
