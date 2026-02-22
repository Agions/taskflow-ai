/**
 * 模型管理命令
 * taskflow model list|add|test|remove
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ModelGateway, ModelConfig, DEFAULT_MODELS } from '../../core/ai';
import { loadConfig, saveConfig } from '../../core/config';

const program = new Command('model');

// 存储当前 gateway 实例
let gateway: ModelGateway | null = null;

function getGateway(): ModelGateway {
  if (!gateway) {
    const config = loadConfig();
    const models: ModelConfig[] = config.aiModels || DEFAULT_MODELS;
    gateway = new ModelGateway({ models, defaultRouter: 'smart' });
  }
  return gateway;
}

/**
 * 列出所有模型
 */
program
  .command('list')
  .description('列出所有配置的模型')
  .action(() => {
    const gw = getGateway();
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
  .action(async (options) => {
    const config = loadConfig();
    
    const newModel: ModelConfig = {
      id: options.id,
      provider: options.provider,
      modelName: options.modelName,
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      priority: parseInt(options.priority),
      enabled: options.enabled === 'true',
      capabilities: ['chat'],
    };

    // 检查是否已存在
    const existingIndex = config.aiModels?.findIndex(m => m.id === newModel.id);
    if (existingIndex !== undefined && existingIndex >= 0) {
      config.aiModels![existingIndex] = newModel;
      console.log(chalk.yellow(`更新现有模型: ${newModel.id}`));
    } else {
      config.aiModels = config.aiModels || [];
      config.aiModels.push(newModel);
      console.log(chalk.green(`添加新模型: ${newModel.id}`));
    }

    saveConfig(config);
    
    // 重置 gateway
    gateway = null;
  });

/**
 * 移除模型
 */
program
  .command('remove')
  .description('移除模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .action((options) => {
    const config = loadConfig();
    
    if (!config.aiModels) {
      console.log(chalk.yellow('没有配置模型'));
      return;
    }

    const index = config.aiModels.findIndex(m => m.id === options.id);
    if (index < 0) {
      console.log(chalk.yellow(`未找到模型: ${options.id}`));
      return;
    }

    config.aiModels.splice(index, 1);
    saveConfig(config);
    
    console.log(chalk.green(`已移除模型: ${options.id}`));
    
    // 重置 gateway
    gateway = null;
  });

/**
 * 启用/禁用模型
 */
program
  .command('enable')
  .description('启用模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .action((options) => {
    const config = loadConfig();
    const model = config.aiModels?.find(m => m.id === options.id);
    
    if (!model) {
      console.log(chalk.red(`未找到模型: ${options.id}`));
      return;
    }

    model.enabled = true;
    saveConfig(config);
    
    console.log(chalk.green(`已启用模型: ${options.id}`));
    gateway = null;
  });

program
  .command('disable')
  .description('禁用模型')
  .requiredOption('-i, --id <id>', '模型 ID')
  .action((options) => {
    const config = loadConfig();
    const model = config.aiModels?.find(m => m.id === options.id);
    
    if (!model) {
      console.log(chalk.red(`未找到模型: ${options.id}`));
      return;
    }

    model.enabled = false;
    saveConfig(config);
    
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
  .action(async (options) => {
    const gw = getGateway();
    
    console.log(chalk.bold('\n🔄 测试模型连接...\n'));
    
    const results = options.id 
      ? [{ modelId: options.id, ...(await gw.getModel(options.id)?.test() || { success: false, latency: 0, error: 'Model not found' }) }]
      : await gw.testAll();
    
    results.forEach(result => {
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
  .action(async (message, options) => {
    const gw = getGateway();
    
    const result = await gw.complete({
      messages: [{ role: 'user', content: message }],
      strategy: options.strategy as any,
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
  .action(async (message) => {
    const gw = getGateway();
    const strategies = ['smart', 'cost', 'speed', 'priority'] as const;
    
    console.log(chalk.bold('\n📊 路由策略基准测试:\n'));
    
    for (const strategy of strategies) {
      try {
        const result = await gw.complete({
          messages: [{ role: 'user', content: message }],
          strategy,
        });
        
        console.log(`${chalk.cyan(strategy.padEnd(8))} | ${result.model.id.padEnd(20)} | ${result.latency}ms`);
      } catch (e) {
        console.log(`${chalk.cyan(strategy.padEnd(8))} | ${chalk.red('Failed')}`);
      }
    }
    
    console.log();
  });

export default program;
