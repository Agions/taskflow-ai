/**
 * 颜色主题定义
 */

import chalk = require('chalk');

// ==================== 颜色主题 ====================

export const theme = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.gray,
  muted: chalk.dim,
  highlight: chalk.bold.white,
  accent: chalk.magenta,
};

export default theme;
