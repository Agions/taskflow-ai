#!/usr/bin/env node

/**
 * TaskFlow AI CLI UI 增强演示
 * 展示所有视觉效果、动画和交互功能
 */

import { ui, showLogo, showSimpleLogo, Spinner, TableColumn, TableData } from './index';
import { prompts } from './prompts';
import { dashboard } from './dashboard';
import { animations } from './animations';
import { createHelpDisplay } from './help';

async function demo() {
  // 1. 渐变 Logo
  console.clear();
  await showLogo();
  await sleep(1000);

  // 2. 动画效果展示
  ui.section('🎨 视觉效果');

  // 渐变文字
  console.log(animations.gradientText('✨ 渐变文字效果', 'brand'));
  console.log(animations.gradientText('🔥 火焰渐变', 'fire'));
  console.log(animations.gradientText('🌊 海洋渐变', 'ocean'));
  console.log(animations.gradientText('🌈 彩虹渐变', 'rainbow'));
  console.log(animations.gradientText('🌅 日落渐变', 'sunset'));
  console.log(animations.gradientText('💜 紫色梦幻', 'purple'));
  console.log(animations.gradientText('⭐ 金色奢华', 'gold'));
  console.log();

  // 脉冲效果
  console.log(animations.pulse('正在处理中...', 'green'));
  console.log(animations.pulse('警告信息', 'yellow'));
  console.log(animations.pulse('错误提示', 'red'));
  console.log();

  // 霓虹效果
  console.log(animations.neon('霓虹灯效果', 'pink'));
  console.log(animations.neon('蓝色霓虹', 'blue'));
  console.log(animations.neon('绿色霓虹', 'green'));
  console.log();

  // 波浪文字
  console.log(animations.wave('波浪文字效果展示'));
  console.log();

  // 闪烁效果
  console.log(animations.twinkle('闪烁星星效果'));
  console.log();

  // 装饰元素
  console.log(animations.decorativeBorder(50, 'double'));
  console.log(animations.stars(5));
  console.log(animations.arrow('right', '#00D9FF') + ' 箭头装饰');
  console.log();

  await sleep(500);

  // 3. Emoji 状态
  ui.section('😀 Emoji 状态');
  console.log(`${animations.statusEmoji('success')} 成功状态`);
  console.log(`${animations.statusEmoji('error')} 错误状态`);
  console.log(`${animations.statusEmoji('warning')} 警告状态`);
  console.log(`${animations.statusEmoji('info')} 信息状态`);
  console.log(`${animations.statusEmoji('loading')} 加载状态`);
  console.log();

  // 4. 信息框（带 Emoji）
  ui.section('📦 信息框');
  ui.success('操作成功', '任务已完成！✨');
  ui.info('提示信息', '请确保已配置 API 密钥 🔑');
  ui.warning('警告', '检测到未完成的任务 ⚠️');
  ui.error('操作失败', '无法连接到服务器', '请检查网络连接 🌐');
  await sleep(500);

  // 5. 加载动画（增强）
  ui.section('⏳ 加载动画');
  const spinner = ui.spinner('正在初始化项目...').start();
  await sleep(2000);
  spinner.succeed('项目初始化完成！✅');

  const spinner2 = ui.spinner('正在解析 PRD...').start();
  await sleep(1500);
  spinner2.update('正在生成任务...');
  await sleep(1500);
  spinner2.succeed('任务生成完成！✨');
  await sleep(500);

  // 6. 帮助展示
  ui.section('📚 帮助信息');
  const helpDisplay = createHelpDisplay();

  helpDisplay.register({
    name: 'init',
    description: '初始化新项目',
    category: 'Project',
    emoji: '🚀',
    usage: 'taskflow init [name]',
    examples: ['taskflow init my-project', 'taskflow init --template typescript'],
    options: [
      { flags: '-t, --template <name>', description: '使用模板' },
      { flags: '-f, --force', description: '强制覆盖' },
    ],
  });

  helpDisplay.register({
    name: 'status',
    description: '查看项目状态',
    category: 'Project',
    emoji: '📊',
    usage: 'taskflow status',
    examples: ['taskflow status', 'taskflow status --watch'],
  });

  helpDisplay.register({
    name: 'parse',
    description: '解析 PRD 文档',
    category: 'AI',
    emoji: '🤖',
    usage: 'taskflow parse <file>',
    examples: ['taskflow parse document.md', 'taskflow parse --output json'],
  });

  helpDisplay.register({
    name: 'mcp',
    description: 'MCP 服务器管理',
    category: 'MCP',
    emoji: '🔌',
    usage: 'taskflow mcp <command>',
    subcommands: [
      { name: 'start', description: '启动 MCP 服务器' },
      { name: 'stop', description: '停止 MCP 服务器' },
      { name: 'status', description: '查看 MCP 状态' },
    ],
  });

  helpDisplay.showMainHelp('TaskFlow', '2.1.0', '智能PRD文档解析与任务管理助手');
  await sleep(500);

  // 7. 命令帮助
  ui.section('📖 命令帮助');
  helpDisplay.showCommandHelp('init');
  await sleep(500);

  // 8. 搜索帮助
  ui.section('🔍 搜索帮助');
  helpDisplay.showSearchHelp('status');
  await sleep(500);

  // 9. 仪表板（增强）
  ui.section('📊 仪表板');

  dashboard.project({
    name: 'TaskFlow AI',
    version: '2.1.0',
    status: 'active',
    progress: 75,
    tasks: {
      total: 20,
      completed: 12,
      inProgress: 5,
      pending: 2,
      blocked: 1,
    },
    lastUpdated: '2024-01-15 10:30:00',
  });

  dashboard.system({
    nodeVersion: 'v20.11.0',
    platform: 'linux',
    memory: { used: 512, total: 2048 },
    uptime: '2d 4h 30m',
  });

  dashboard.tasks([
    { id: '1', name: '重构代码', status: 'in-progress', priority: 'high', assignee: 'dev1' },
    { id: '2', name: '编写文档', status: 'pending', priority: 'medium' },
    { id: '3', name: '修复 Bug', status: 'completed', priority: 'high', assignee: 'dev2' },
    { id: '4', name: '性能优化', status: 'blocked', priority: 'low' },
  ]);

  dashboard.timeline([
    { time: '10:30:00', event: '项目初始化完成', status: 'success' },
    { time: '10:25:30', event: '开始解析 PRD', status: 'info' },
    { time: '10:20:15', event: '检测到配置问题', status: 'warning' },
    { time: '10:15:00', event: '连接服务器失败', status: 'error' },
  ]);

  dashboard.stats([
    { label: '任务总数', value: 20, change: 5 },
    { label: '完成率', value: '75%', change: 10, unit: '%' },
    { label: '平均耗时', value: '2.5h', change: -0.5, unit: 'h' },
  ]);

  await sleep(500);

  // 10. 统计卡片（带 Emoji）
  ui.section('📈 统计卡片');
  console.log(`${animations.emojis.task} 任务: 20`);
  console.log(`${animations.emojis.ai} AI 调用: 150`);
  console.log(`${animations.emojis.code} 代码行数: 21,427`);
  console.log(`${animations.emojis.deploy} 部署: 12`);
  console.log(`${animations.emojis.doc} 文档: 45`);
  console.log(`${animations.emojis.config} 配置: 8`);
  console.log();

  // 11. 成功帮助
  ui.section('✨ 成功提示');
  ui.showSuccessHelp('项目初始化成功！', [
    '运行 taskflow status 查看状态',
    '运行 taskflow parse 解析 PRD',
    '运行 taskflow mcp start 启动 MCP',
  ]);

  // 12. 错误帮助
  ui.section('❌ 错误提示');
  ui.showErrorHelp('命令不存在', '使用 taskflow --help 查看可用命令');

  // 结束
  ui.section('🎉 演示完成');
  console.log(animations.gradientText('✨ 所有增强功能演示完毕！', 'success'));
  console.log(animations.rainbow('感谢使用 TaskFlow AI CLI UI 组件库'));
  console.log();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行演示
if (require.main === module) {
  demo().catch(console.error);
}

export default demo;
