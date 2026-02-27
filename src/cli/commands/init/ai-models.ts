/**
 * AI 模型配置
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { AIProvider, AIModelConfig } from '../../../types';
import { AI_PROVIDERS } from '../../../constants';

const PROVIDER_NAMES: Record<string, string> = {
  [AI_PROVIDERS.DEEPSEEK]: '深度求索 (DeepSeek)',
  [AI_PROVIDERS.ZHIPU]: '智谱AI (GLM)',
  [AI_PROVIDERS.QWEN]: '通义千问 (Qwen)',
  [AI_PROVIDERS.BAIDU]: '文心一言 (ERNIE)',
  [AI_PROVIDERS.MOONSHOT]: '月之暗面 (Moonshot)',
  [AI_PROVIDERS.SPARK]: '讯飞星火 (Spark)',
  [AI_PROVIDERS.OPENAI]: 'OpenAI GPT',
  [AI_PROVIDERS.CLAUDE]: 'Claude',
};

const DEFAULT_MODELS: Record<string, string> = {
  [AI_PROVIDERS.DEEPSEEK]: 'deepseek-chat',
  [AI_PROVIDERS.ZHIPU]: 'glm-4',
  [AI_PROVIDERS.QWEN]: 'qwen-turbo',
  [AI_PROVIDERS.BAIDU]: 'ernie-4.0-8k',
  [AI_PROVIDERS.MOONSHOT]: 'moonshot-v1-8k',
  [AI_PROVIDERS.SPARK]: 'generalv3.5',
  [AI_PROVIDERS.OPENAI]: 'gpt-4',
  [AI_PROVIDERS.CLAUDE]: 'claude-3-sonnet-20240229',
};

/**
 * 配置 AI 模型
 */
export async function configureAIModels(): Promise<AIModelConfig[]> {
  console.log(chalk.cyan('\n🤖 配置AI模型'));
  console.log(chalk.gray('选择并配置您要使用的AI模型提供商:\n'));

  const { selectedProviders } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedProviders',
      message: '选择AI模型提供商:',
      choices: [
        { name: '深度求索 (DeepSeek) - 推荐', value: AI_PROVIDERS.DEEPSEEK, checked: true },
        { name: '智谱AI (GLM)', value: AI_PROVIDERS.ZHIPU },
        { name: '通义千问 (Qwen)', value: AI_PROVIDERS.QWEN },
        { name: '文心一言 (ERNIE)', value: AI_PROVIDERS.BAIDU },
        { name: '月之暗面 (Moonshot)', value: AI_PROVIDERS.MOONSHOT },
        { name: '讯飞星火 (Spark)', value: AI_PROVIDERS.SPARK },
        { name: 'OpenAI GPT', value: AI_PROVIDERS.OPENAI },
        { name: 'Claude', value: AI_PROVIDERS.CLAUDE },
      ],
      validate: input => {
        if (input.length === 0) {
          return '请至少选择一个AI模型提供商';
        }
        return true;
      },
    },
  ]);

  const aiModels: AIModelConfig[] = [];
  for (const provider of selectedProviders) {
    console.log(chalk.blue(`\n配置 ${PROVIDER_NAMES[provider]}:`));

    const modelConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'API密钥:',
        validate: input => input.trim() ? true : 'API密钥不能为空',
      },
      {
        type: 'input',
        name: 'modelName',
        message: '模型名称:',
        default: DEFAULT_MODELS[provider],
        validate: input => input.trim() ? true : '模型名称不能为空',
      },
      {
        type: 'list',
        name: 'priority',
        message: '优先级:',
        choices: [
          { name: '高优先级', value: 1 },
          { name: '中优先级', value: 2 },
          { name: '低优先级', value: 3 },
        ],
        default: aiModels.length === 0 ? 1 : 2,
      },
    ]);

    aiModels.push({
      provider,
      modelName: modelConfig.modelName,
      apiKey: modelConfig.apiKey,
      priority: modelConfig.priority,
      enabled: true,
      maxTokens: 4000,
      temperature: 0.7,
    });
  }

  return aiModels;
}

/**
 * 获取提供商名称
 */
export function getProviderName(provider: AIProvider): string {
  return PROVIDER_NAMES[provider as string] || provider;
}

/**
 * 获取默认模型名称
 */
export function getDefaultModelName(provider: AIProvider): string {
  return DEFAULT_MODELS[provider as string] || 'default';
}
