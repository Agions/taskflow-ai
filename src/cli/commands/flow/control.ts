/**
 * Flow 控制命令 (pause/resume)
 */

import chalk = require('chalk');
import { getEngine } from './engine';

/**
 * 执行 pause 命令
 */
export async function executePause(executionId: string): Promise<void> {
  const success = await getEngine().pause(executionId);
  if (success) {
    console.log(chalk.green('工作流已暂停'));
  } else {
    console.log(chalk.red('暂停失败'));
  }
}

/**
 * 执行 resume 命令
 */
export async function executeResume(executionId: string): Promise<void> {
  try {
    const result = await getEngine().resume(executionId);
    if ((result as any).success) {
      console.log(chalk.green('工作流已恢复'));
    } else {
      console.log(chalk.red('恢复失败: ' + (result as any).error));
    }
  } catch (error) {
    console.log(chalk.red('恢复失败:', error));
  }
}
