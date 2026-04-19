#!/usr/bin/env node

/**
 * TaskFlow AI CLI UI 演示
 * 展示所有 UI 组件效果
 */

import { ui, showLogo, showSimpleLogo, Spinner, TableColumn, TableData } from './index';
import { prompts } from './prompts';
import { dashboard } from './dashboard';

async function demo() {
  // 1. Logo 展示
  console.clear();
  await showLogo();
  await sleep(1000);

  // 2. 简洁 Logo
  console.clear();
  showSimpleLogo();
  await sleep(500);

  // 3. 信息框
  ui.section('信息框组件');
  ui.success('操作成功', '项目初始化完成！');
  ui.info('提示信息', '请确保已配置 API 密钥');
  ui.warning('警告', '检测到未完成的任务');
  ui.error('操作失败', '无法连接到服务器', '请检查网络连接');
  await sleep(500);

  // 4. 加载动画
  ui.section('加载动画');
  const spinner = ui.spinner('正在初始化项目...').start();
  await sleep(2000);
  spinner.succeed('项目初始化完成！');

  const spinner2 = ui.spinner('正在解析 PRD...').start();
  await sleep(1500);
  spinner2.update('正在生成任务...');
  await sleep(1500);
  spinner2.succeed('任务生成完成！');
  await sleep(500);

  // 5. 列表
  ui.section('列表展示');
  ui.list('待办任务', ['解析 PRD 文档', '生成任务列表', '分配开发人员', '设置截止日期']);

  ui.keyValue({
    项目名称: 'TaskFlow AI',
    版本: '2.1.0',
    作者: 'Agions',
    许可证: 'MIT',
  });
  await sleep(500);

  // 6. 表格
  ui.section('表格展示');
  const columns: TableColumn[] = [
    { header: 'ID', key: 'id', width: 8 },
    { header: '任务', key: 'name', width: 25 },
    { header: '状态', key: 'status', width: 12 },
    { header: '优先级', key: 'priority', width: 10 },
  ];

  const data: TableData[] = [
    { id: 'T001', name: '解析 PRD', status: '已完成', priority: '高' },
    { id: 'T002', name: '生成代码', status: '进行中', priority: '高' },
    { id: 'T003', name: '编写测试', status: '待处理', priority: '中' },
    { id: 'T004', name: '部署上线', status: '待处理', priority: '低' },
  ];

  ui.table(columns, data);
  await sleep(500);

  // 7. 进度条
  ui.section('进度条');
  for (let i = 0; i <= 100; i += 10) {
    process.stdout.write('\r' + ui.progress(i, 100, '处理中'));
    await sleep(100);
  }
  console.log('\n');

  // 8. 仪表板
  ui.section('仪表板组件');

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

  // 9. 交互式提示（可选）
  ui.section('交互式提示');
  const shouldDemoPrompts = await prompts.confirm('是否演示交互式提示？', false);

  if (shouldDemoPrompts) {
    const name = await prompts.input('请输入项目名称', 'my-project');
    const type = await prompts.select('选择项目类型', [
      { name: 'Web 应用', value: 'web' },
      { name: 'Node.js 服务', value: 'node' },
      { name: 'CLI 工具', value: 'cli' },
    ]);
    const features = await prompts.multiSelect('选择需要的功能', [
      { name: 'TypeScript 支持', value: 'ts', checked: true },
      { name: '单元测试', value: 'test' },
      { name: 'ESLint', value: 'lint', checked: true },
      { name: 'Docker', value: 'docker' },
    ]);

    ui.success('配置完成', `项目: ${name}, 类型: ${type}, 功能: ${features.join(', ')}`);
  }

  // 结束
  ui.section('演示完成');
  ui.success('所有组件演示完毕', 'TaskFlow AI CLI UI 组件库');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行演示
if (require.main === module) {
  demo().catch(console.error);
}

export default demo;
