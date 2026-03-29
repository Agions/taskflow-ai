/**
 * 交互式提示组件
 */

import inquirer from 'inquirer';
import { theme } from './index';

// 自定义 inquirer 主题
const inquirerTheme = {
  prefix: theme.primary('?'),
  spinner: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
};

/**
 * 确认提示
 */
export async function confirm(message: string, defaultValue: boolean = true): Promise<boolean> {
  const { result } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'result',
      message: theme.info(message),
      default: defaultValue,
      prefix: inquirerTheme.prefix,
    },
  ]);
  return result;
}

/**
 * 输入提示
 */
export async function input(
  message: string,
  defaultValue?: string,
  validate?: (value: string) => boolean | string
): Promise<string> {
  const { result } = await inquirer.prompt([
    {
      type: 'input',
      name: 'result',
      message: theme.info(message),
      default: defaultValue,
      prefix: inquirerTheme.prefix,
      validate,
    },
  ]);
  return result;
}

/**
 * 密码输入
 */
export async function password(
  message: string,
  validate?: (value: string) => boolean | string
): Promise<string> {
  const { result } = await inquirer.prompt([
    {
      type: 'password',
      name: 'result',
      message: theme.info(message),
      mask: '●',
      prefix: inquirerTheme.prefix,
      validate,
    },
  ]);
  return result;
}

/**
 * 选择列表
 */
export async function select<T extends string>(
  message: string,
  choices: { name: string; value: T; disabled?: boolean }[],
  defaultValue?: T
): Promise<T> {
  const { result } = await inquirer.prompt([
    {
      type: 'list',
      name: 'result',
      message: theme.info(message),
      choices: choices.map(c => ({
        ...c,
        name: c.disabled ? theme.muted(c.name) : c.name,
      })),
      default: defaultValue,
      prefix: inquirerTheme.prefix,
    },
  ]);
  return result;
}

/**
 * 多选
 */
export async function multiSelect<T extends string>(
  message: string,
  choices: { name: string; value: T; checked?: boolean }[]
): Promise<T[]> {
  const { result } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'result',
      message: theme.info(message),
      choices,
      prefix: inquirerTheme.prefix,
    },
  ]);
  return result;
}

/**
 * 数字输入
 */
export async function number(
  message: string,
  defaultValue?: number,
  min?: number,
  max?: number
): Promise<number> {
  const { result } = await inquirer.prompt([
    {
      type: 'number',
      name: 'result',
      message: theme.info(message),
      default: defaultValue,
      prefix: inquirerTheme.prefix,
      validate: (value: number) => {
        if (min !== undefined && value < min) return theme.error(`最小值为 ${min}`);
        if (max !== undefined && value > max) return theme.error(`最大值为 ${max}`);
        return true;
      },
    },
  ]);
  return result;
}

/**
 * 编辑器输入
 */
export async function editor(message: string, defaultValue?: string): Promise<string> {
  const { result } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'result',
      message: theme.info(message),
      default: defaultValue,
      prefix: inquirerTheme.prefix,
    },
  ]);
  return result;
}

/**
 * 步骤向导
 */
export interface WizardStep {
  name: string;
  type: 'input' | 'password' | 'confirm' | 'list' | 'checkbox' | 'number';
  message: string;
  default?: any;
  choices?: { name: string; value: any }[];
  validate?: (value: unknown) => boolean | string;
  when?: (answers: unknown) => boolean;
}

/**
 * 多步骤向导
 */
export async function wizard(steps: WizardStep[], title?: string): Promise<Record<string, any>> {
  if (title) {
    console.log('\n' + theme.primary.bold('◆ ' + title));
    console.log(theme.muted('请回答以下问题:\n'));
  }

  const questions = steps.map((step, index) => ({
    ...step,
    prefix: theme.primary(`${index + 1}.`),
    message: theme.info(step.message),
  }));

  return inquirer.prompt(questions);
}

// 导出所有提示方法
export const prompts = {
  confirm,
  input,
  password,
  select,
  multiSelect,
  number,
  editor,
  wizard,
};

export default prompts;
