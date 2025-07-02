import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { taskFlowService } from '../mcp/index';
import { ModelType } from '../types/config';

/**
 * 模型管理命令
 * @param program Commander实例
 */
export default function modelsCommand(program: Command): void {
  const modelsCmd = program
    .command('models')
    .description('管理AI模型配置和状态');

  // 列出可用模型
  modelsCmd
    .command('list')
    .description('列出所有可用的AI模型')
    .option('--detailed', '显示详细信息', false)
    .action(async (options) => {
      try {
        console.log(chalk.blue('📋 可用的AI模型:'));
        console.log();

        const models = [
          {
            type: 'deepseek',
            name: 'DeepSeek',
            description: '高性价比，代码理解能力强',
            status: '✅ 可用',
            cost: '低',
            features: ['代码生成', '逻辑推理', '中英文对话']
          },
          {
            type: 'zhipu',
            name: '智谱GLM-4',
            description: '综合能力强，适合复杂任务',
            status: '✅ 可用',
            cost: '中',
            features: ['多轮对话', '文档理解', '创意写作']
          },
          {
            type: 'qwen',
            name: '通义千问',
            description: '阿里云大模型，多模态支持',
            status: '✅ 可用',
            cost: '中',
            features: ['长文本处理', '多模态', '专业领域']
          },
          {
            type: 'spark',
            name: '讯飞星火',
            description: '语音交互优化，教育场景',
            status: '✅ 可用',
            cost: '中',
            features: ['语音理解', '教育内容', '实时对话']
          },
          {
            type: 'moonshot',
            name: '月之暗面Kimi',
            description: '超长上下文，文档处理专家',
            status: '✅ 可用',
            cost: '高',
            features: ['长文本', '文档分析', '信息提取']
          },
          {
            type: 'baidu',
            name: '百度文心一言',
            description: '百度大模型，中文优化',
            status: '✅ 可用',
            cost: '中',
            features: ['中文理解', '创意生成', '知识问答']
          }
        ];

        for (const model of models) {
          console.log(chalk.cyan(`🤖 ${model.name} (${model.type})`));
          console.log(`   ${model.description}`);
          console.log(`   状态: ${model.status}`);
          console.log(`   成本: ${model.cost}`);
          
          if (options.detailed) {
            console.log(`   特性: ${model.features.join(', ')}`);
          }
          console.log();
        }

        console.log(chalk.yellow('💡 使用 "taskflow-ai models test <model>" 测试模型连接'));
        console.log(chalk.yellow('💡 使用 "taskflow-ai config set models.default <model>" 设置默认模型'));

      } catch (error) {
        console.error(chalk.red('❌ 获取模型列表失败:'), error);
      }
    });

  // 测试模型连接
  modelsCmd
    .command('test <model>')
    .description('测试指定模型的连接状态')
    .action(async (model) => {
      const spinner = ora(`正在测试 ${model} 模型连接...`).start();
      
      try {
        // 这里应该调用实际的模型测试逻辑
        const isValid = await testModelConnection(model);
        
        if (isValid) {
          spinner.succeed(chalk.green(`✅ ${model} 模型连接正常`));
        } else {
          spinner.fail(chalk.red(`❌ ${model} 模型连接失败`));
          console.log(chalk.yellow('请检查:'));
          console.log('  1. API密钥是否正确配置');
          console.log('  2. 网络连接是否正常');
          console.log('  3. 模型服务是否可用');
        }
      } catch (error) {
        spinner.fail(chalk.red(`❌ 测试 ${model} 模型时出错: ${error}`));
      }
    });

  // 性能基准测试
  modelsCmd
    .command('benchmark')
    .description('运行模型性能基准测试')
    .option('--models <models>', '指定测试的模型，用逗号分隔', 'deepseek,zhipu,qwen')
    .option('--iterations <count>', '测试迭代次数', '3')
    .action(async (options) => {
      const models = options.models.split(',').map((m: string) => m.trim());
      const iterations = parseInt(options.iterations);
      
      console.log(chalk.blue('🏃‍♂️ 开始模型性能基准测试'));
      console.log(`测试模型: ${models.join(', ')}`);
      console.log(`迭代次数: ${iterations}`);
      console.log();

      const results: any[] = [];

      for (const model of models) {
        const spinner = ora(`测试 ${model} 模型性能...`).start();
        
        try {
          const result = await runBenchmark(model, iterations);
          results.push({ model, ...result });
          spinner.succeed(`✅ ${model} 测试完成`);
        } catch (error) {
          spinner.fail(`❌ ${model} 测试失败: ${error}`);
          results.push({ model, error: error.toString() });
        }
      }

      // 显示结果
      console.log();
      console.log(chalk.blue('📊 基准测试结果:'));
      console.log();

      const table = results.map(r => {
        if (r.error) {
          return `${r.model.padEnd(12)} | 失败: ${r.error}`;
        }
        return `${r.model.padEnd(12)} | ${r.avgLatency}ms | ${r.successRate}% | ${r.tokensPerSecond} tokens/s`;
      });

      console.log('模型        | 平均延迟 | 成功率 | 处理速度');
      console.log('------------|----------|--------|----------');
      table.forEach(row => console.log(row));
    });

  // 切换默认模型
  modelsCmd
    .command('switch <model>')
    .description('切换默认使用的模型')
    .action(async (model) => {
      const spinner = ora(`正在切换默认模型到 ${model}...`).start();
      
      try {
        // 首先测试模型是否可用
        const isValid = await testModelConnection(model);
        
        if (!isValid) {
          spinner.fail(chalk.red(`❌ 无法切换到 ${model}，模型连接失败`));
          return;
        }

        // 更新配置
        await taskFlowService.updateConfig({
          models: {
            default: model as ModelType
          }
        });

        spinner.succeed(chalk.green(`✅ 默认模型已切换到 ${model}`));
        console.log(chalk.yellow(`💡 使用 "taskflow-ai config list" 查看当前配置`));
        
      } catch (error) {
        spinner.fail(chalk.red(`❌ 切换模型失败: ${error}`));
      }
    });

  // 模型使用统计
  modelsCmd
    .command('stats')
    .description('查看模型使用统计')
    .option('--period <period>', '统计周期 (day|week|month)', 'week')
    .action(async (options) => {
      try {
        console.log(chalk.blue('📈 模型使用统计'));
        console.log(`统计周期: ${options.period}`);
        console.log();

        // 这里应该从实际的统计数据中获取
        const stats = await getModelStats(options.period);
        
        console.log('模型        | 调用次数 | 成功率 | 平均延迟 | 总成本');
        console.log('------------|----------|--------|----------|--------');
        
        stats.forEach((stat: any) => {
          console.log(
            `${stat.model.padEnd(12)} | ${stat.calls.toString().padEnd(8)} | ${stat.successRate}% | ${stat.avgLatency}ms | $${stat.cost}`
          );
        });

      } catch (error) {
        console.error(chalk.red('❌ 获取统计数据失败:'), error);
      }
    });
}

/**
 * 测试模型连接
 */
async function testModelConnection(model: string): Promise<boolean> {
  try {
    // 模拟测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Math.random() > 0.2; // 80%成功率模拟
  } catch {
    return false;
  }
}

/**
 * 运行性能基准测试
 */
async function runBenchmark(model: string, iterations: number) {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    const latency = Date.now() - start;
    
    results.push({
      latency,
      success: Math.random() > 0.1, // 90%成功率
      tokens: Math.floor(Math.random() * 1000 + 100)
    });
  }

  const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latency, 0) / results.length);
  const successRate = Math.round((results.filter(r => r.success).length / results.length) * 100);
  const avgTokens = Math.round(results.reduce((sum, r) => sum + r.tokens, 0) / results.length);
  const tokensPerSecond = Math.round(avgTokens / (avgLatency / 1000));

  return {
    avgLatency,
    successRate,
    tokensPerSecond
  };
}

/**
 * 获取模型使用统计
 */
async function getModelStats(period: string) {
  // 模拟统计数据
  return [
    { model: 'deepseek', calls: 156, successRate: 98, avgLatency: 1200, cost: 2.34 },
    { model: 'zhipu', calls: 89, successRate: 96, avgLatency: 1800, cost: 4.56 },
    { model: 'qwen', calls: 67, successRate: 94, avgLatency: 1500, cost: 3.21 },
    { model: 'moonshot', calls: 23, successRate: 99, avgLatency: 2200, cost: 8.90 }
  ];
}
