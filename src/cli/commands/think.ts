/**
 * 思维分析命令
 * taskflow think <prompt>
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ThoughtChainManager, createRenderer } from '../../core/thought';
import { loadConfig } from '../../core/config';
import type { AIModelConfig } from '../../types/config';

const program = new Command('think');

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
    const config = await loadConfig();

    const models = config?.aiModels?.filter((m: AIModelConfig) => m.enabled) || [];

    if (models.length > 0) {
      try {
        await analyzeWithAI(manager, prompt, options.model);
      } catch (_error) {
        console.log(chalk.yellow('AI 分析失败，使用本地分析...\n'));
        analyzeLocally(manager, prompt);
      }
    } else {
      console.log(chalk.yellow('未配置 AI 模型，使用本地分析...\n'));
      analyzeLocally(manager, prompt);
    }

    const chains = manager.listChains();
    if (chains.length === 0) {
      console.log(chalk.red('分析失败'));
      return;
    }

    const latestChain = manager.getChain(chains[chains.length - 1].id);
    if (!latestChain) return;

    if (options.visualize) {
      const renderer = createRenderer('mermaid');
      console.log(renderer.render(latestChain));
    } else {
      const renderer = createRenderer(options.format as 'text' | 'markdown' | 'mermaid' | 'mindmap');
      console.log(renderer.render(latestChain));
    }
  });

/**
 * 本地分析 (无需 AI)
 */
function analyzeLocally(manager: ThoughtChainManager, prompt: string): void {
  const chain = manager.createChain(prompt);

  manager.addNode(chain.id, chain.root.id, 'analysis', '分析用户输入', '理解需求内容');

  manager.addNode(
    chain.id,
    chain.root.id,
    'decomposition',
    '拆解为子任务',
    '将复杂问题分解为可管理的部分'
  );

  manager.addNode(chain.id, chain.root.id, 'task', '生成具体任务列表', '创建可执行的任务项');

  manager.addNode(chain.id, chain.root.id, 'synthesis', '分析完成', '输出分析结果');
}

/**
 * AI 辅助分析
 */
async function analyzeWithAI(
  manager: ThoughtChainManager,
  prompt: string,
  _preferredModel?: string
): Promise<void> {
  analyzeLocally(manager, prompt);

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

    const renderer = createRenderer(options.format as 'text' | 'markdown' | 'mermaid' | 'mindmap');
    console.log(renderer.render(targetChain));
  });
export const thinkCommand = program;
