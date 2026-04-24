/**
 * 模型管理命令
 * taskflow model list|add|test|remove
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ModelGateway, ModelConfig, DEFAULT_MODELS } from '../../core/ai';
import { loadConfig, saveConfig } from '../../core/config';
import { TaskFlowConfig, AIModelConfig } from '../../types';

const program = new Command('model');

let gateway: ModelGateway | null = null;

async function getGateway(): Promise<ModelGateway> {
  if (!gateway) {
    const config = await loadConfig();
    const models = (config?.aiModels as unknown as ModelConfig[]) || DEFAULT_MODELS;
    gateway = new ModelGateway({ models, defaultRouter: 'smart' });
  }
  return gateway;
}

/** 模型添加选项 */
interface ModelAddOptions {
  id: string;
  provider: string;
  modelName: string;
  apiKey: string;
  baseUrl?: string;
  priority: string;
  enabled: string;
}

/** 模型 ID 选项 */
interface ModelIdOptions {
  id: string;
}

/** 测试选项 */
interface TestOptions {
  id?: string;
}

/** 路由选项 */
interface RouteOptions {
  strategy: 'smart' | 'cost' | 'speed' | 'priority';
}

/**
 * 列出所有模型
 */
program
  .command('list')
  .description('列出所有配置的模型')
  .action(async () => {
    const gw = await getGateway();
    const models = gw.getModels();

    if (models.length === 0) {
      console.log(chalk.yellow('未配置任何模型'));
      return;
    }

    console.log(chalk.bold('\n📦 已配置模型:\n'));

    const enabledModels = models.filter(m => m.enabled);
    const disabledModels = models.filter(m => !m.enabled);

    if (enabledModels.length > 0) {
      console.log(chalk.green('✓ 已启用:'));
      enabledModels.forEach(m => {
        console.log(`  ${chalk.cyan(m.id)} (${m.provider}) - 优先级: ${m.priority}`);
      });
    }

    if (disabledModels.length > 0) {
      console.log(chalk.gray('\n✗ 已禁用:'));
      disabledModels.forEach(m => {
        console.log(`  ${m.id} (${m.provider})`);
      });
    }

    console.log();
  });

/**
 * 添加模型
 */
program
  .command('add')
  .description('添加新模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .requiredOption('-p, --provider <provider>', '提供商 (deepseek|openai|anthropic|zhipu|qwen)')
  .requiredOption('-m, --model-name <name>', '模型名称')
  .requiredOption('-k, --api-key <key>', 'API Key')
  .option('-u, --base-url <url>', 'API 基础 URL')
  .option('--priority <n>', '优先级', '10')
  .option('--enabled', '是否启用', 'true')
  .action(async (options: ModelAddOptions) => {
    const config = (await loadConfig()) || ({} as TaskFlowConfig);

    const newModel: AIModelConfig & { id: string; capabilities: string[] } = {
      id: options.id,
      provider: options.provider as AIModelConfig['provider'],
      modelName: options.modelName,
      apiKey: options.apiKey,
      endpoint: options.baseUrl,
      priority: parseInt(options.priority),
      enabled: options.enabled === 'true',
      capabilities: ['chat'],
    };

    // AIModelConfig doesn't have id, so we need a type-safe search
    const models = config.aiModels! || [];
    const existingIndex = models.findIndex(
      m => (m as AIModelConfig & { id?: string }).id === newModel.id
    );
    if (existingIndex >= 0) {
      Object.assign(models[existingIndex], newModel);
      console.log(chalk.yellow(`更新现有模型: ${newModel.id}`));
    } else {
      models.push(newModel as AIModelConfig);
      console.log(chalk.green(`添加新模型: ${newModel.id}`));
    }
    config.aiModels! = models;

    await saveConfig(config);
    gateway = null;
  });

/**
 * 移除模型
 */
program
  .command('remove')
  .description('移除模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .action(async (options: ModelIdOptions) => {
    const config = await loadConfig();

    if (!config?.aiModels) {
      console.log(chalk.yellow('没有配置模型'));
      return;
    }

    const models = config.aiModels! as (AIModelConfig & { id?: string })[];
    const index = models.findIndex(m => m.id === options.id);
    if (index < 0) {
      console.log(chalk.yellow(`未找到模型: ${options.id}`));
      return;
    }

    config.aiModels!.splice(index, 1);
    await saveConfig(config);

    console.log(chalk.green(`已移除模型: ${options.id}`));
    gateway = null;
  });

/**
 * 启用模型
 */
program
  .command('enable')
  .description('启用模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .action(async (options: ModelIdOptions) => {
    const config = await loadConfig();
    const models = config?.aiModels as (AIModelConfig & { id?: string })[] | undefined;
    const model = models?.find(m => m.id === options.id);

    if (!model) {
      console.log(chalk.red(`未找到模型: ${options.id}`));
      return;
    }

    model.enabled = true;
    if (config) await saveConfig(config);

    console.log(chalk.green(`已启用模型: ${options.id}`));
    gateway = null;
  });

/**
 * 禁用模型
 */
program
  .command('disable')
  .description('禁用模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .action(async (options: ModelIdOptions) => {
    const config = await loadConfig();
    const models = config?.aiModels as (AIModelConfig & { id?: string })[] | undefined;
    const model = models?.find(m => m.id === options.id);

    if (!model) {
      console.log(chalk.red(`未找到模型: ${options.id}`));
      return;
    }

    model.enabled = false;
    if (config) await saveConfig(config);

    console.log(chalk.yellow(`已禁用模型: ${options.id}`));
    gateway = null;
  });

/**
 * 测试模型连接
 */
program
  .command('test')
  .description('测试所有模型的连接')
  .option('-i, --id <id>', '只测试指定模型')
  .action(async (options: TestOptions) => {
    const gw = await getGateway();

    console.log(chalk.bold('\n🔄 测试模型连接...\n'));

    const results = await gw.testAll();
    const filteredResults = options.id ? results.filter(r => r.modelId === options.id) : results;

    filteredResults.forEach(result => {
      if (result.success) {
        console.log(chalk.green(`✓ ${result.modelId}: 成功 (${result.latency}ms)`));
      } else {
        console.log(chalk.red(`✗ ${result.modelId}: 失败 - ${result.error}`));
      }
    });

    console.log();
  });

/**
 * 测试路由决策
 */
program
  .command('route')
  .description('测试模型路由决策')
  .argument('<message>', '测试消息')
  .option('-s, --strategy <strategy>', '路由策略 (smart|cost|speed|priority)', 'smart')
  .action(async (message: string, options: RouteOptions) => {
    const gw = await getGateway();

    const result = await gw.complete({
      messages: [{ role: 'user', content: message }],
      strategy: options.strategy,
    });

    console.log(chalk.bold('\n🧠 路由决策结果:\n'));
    console.log(`  模型: ${chalk.cyan(result.model.id)}`);
    console.log(`  提供商: ${result.model.provider}`);
    console.log(`  策略: ${result.routing.strategy}`);
    console.log(`  原因: ${result.routing.reason}`);
    console.log(`  延迟: ${result.latency}ms`);
    console.log(`  成本: $${result.cost.toFixed(6)}`);
    console.log();
  });

/**
 * 基准测试
 */
program
  .command('benchmark')
  .description('对比不同路由策略')
  .argument('<message>', '测试消息')
  .action(async (message: string) => {
    const gw = await getGateway();
    const strategies: Array<'smart' | 'cost' | 'speed' | 'priority'> = [
      'smart',
      'cost',
      'speed',
      'priority',
    ];

    console.log(chalk.bold('\n📊 路由策略基准测试:\n'));

    for (const strategy of strategies) {
      try {
        const result = await gw.complete({
          messages: [{ role: 'user', content: message }],
          strategy,
        });

        console.log(
          `${chalk.cyan(strategy.padEnd(8))} | ${result.model.id.padEnd(20)} | ${result.latency}ms`
        );
      } catch (_e) {
        console.log(`${chalk.cyan(strategy.padEnd(8))} | ${chalk.red('Failed')}`);
      }
    }

    console.log();
  });

export default program;
export const modelCommand = program;
