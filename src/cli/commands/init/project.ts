/**
 * 项目信息收集
 */

import inquirer from 'inquirer';
import path = require('path');

/**
 * 收集项目信息
 */
export async function collectProjectInfo() {
  const currentDir = path.basename(process.cwd());

  return await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: '项目名称:',
      default: currentDir,
      validate: input => {
        if (!input.trim()) {
          return '项目名称不能为空';
        }
        if (!/^[a-zA-Z0-9-_\s]+$/.test(input)) {
          return '项目名称只能包含字母、数字、下划线和连字符';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'version',
      message: '项目版本:',
      default: '1.0.0',
      validate: input => {
        if (!/^\d+\.\d+\.\d+$/.test(input)) {
          return '请输入有效的语义化版本号 (如: 1.0.0)';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'methodology',
      message: '开发方法论:',
      choices: [
        { name: '敏捷开发 (Agile)', value: 'agile' },
        { name: '瀑布模型 (Waterfall)', value: 'waterfall' },
        { name: '精益创业 (Lean)', value: 'lean' },
      ],
      default: 'agile',
    },
  ]);
}
