import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

/**
 * 确认操作
 * @param message 提示消息
 * @param defaultValue 默认值
 */
export async function confirmAction(
  message: string,
  defaultValue = false
): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);

  return confirmed;
}

/**
 * 选择选项
 * @param message 提示消息
 * @param choices 选项列表
 * @param defaultValue 默认值
 */
export async function selectOption<T extends string>(
  message: string,
  choices: { name: string; value: T }[],
  defaultValue?: T
): Promise<T> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message,
      choices,
      default: defaultValue,
    },
  ]);

  return selected;
}

/**
 * 输入文本
 * @param message 提示消息
 * @param defaultValue 默认值
 * @param validate 验证函数
 */
export async function inputText(
  message: string,
  defaultValue = '',
  validate?: (input: string) => boolean | string | Promise<boolean | string>
): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message,
      default: defaultValue,
      validate,
    },
  ]);

  return input;
}

/**
 * 显示加载状态
 * @param initialText 初始文本
 */
export function showSpinner(initialText: string): Ora {
  return ora(initialText).start();
}

/**
 * 显示成功消息
 * @param message 消息内容
 */
export function showSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * 显示错误消息
 * @param message 消息内容
 */
export function showError(message: string): void {
  console.error(chalk.red(`✗ ${message}`));
}

/**
 * 显示警告消息
 * @param message 消息内容
 */
export function showWarning(message: string): void {
  console.warn(chalk.yellow(`⚠ ${message}`));
}

/**
 * 显示信息消息
 * @param message 消息内容
 */
export function showInfo(message: string): void {
  console.info(chalk.blue(`ℹ ${message}`));
}

/**
 * 显示下一步操作提示
 * @param steps 步骤列表
 */
export function showNextSteps(steps: string[]): void {
  console.log(chalk.cyan('\n后续步骤:'));
  steps.forEach((step, index) => {
    console.log(`${index + 1}. ${chalk.yellow(step)}`);
  });
}

/**
 * 创建进度条
 * @param total 总数
 * @param initialText 初始文本
 */
export function createProgressBar(
  total: number,
  initialText: string
): { update: (current: number, text?: string) => void; stop: () => void } {
  const spinner = ora(initialText).start();

  return {
    update: (current: number, text?: string) => {
      const percentage = Math.round((current / total) * 100);
      spinner.text = `${text || initialText} [${percentage}%] (${current}/${total})`;
    },
    stop: () => {
      spinner.succeed();
    },
  };
} 