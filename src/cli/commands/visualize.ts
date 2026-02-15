/**
 * Visualize命令 - 生成项目可视化报告
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';

export function visualizeCommand(program: Command) {
  program
    .command('visualize')
    .description('生成项目可视化报告和图表')
    .option('-t, --type <type>', '图表类型 (gantt|pie|bar|timeline|kanban)', 'gantt')
    .option('-o, --output <path>', '输出路径', './reports')
    .option('-f, --format <format>', '输出格式 (html|svg|png)', 'html')
    .option('--interactive', '交互式模式')
    .action(async options => {
      try {
        await runVisualize(options);
      } catch (error) {
        console.error(chalk.red('可视化生成失败:'), error);
        process.exit(1);
      }
    });
}

async function runVisualize(options: any) {
  const spinner = ora('正在生成可视化报告...').start();

  try {
    // 交互式模式
    if (options.interactive) {
      spinner.stop();
      options = await getVisualizationOptions(options);
      spinner.start('正在生成可视化报告...');
    }

    // 检查数据源
    const dataFiles = await findDataFiles();
    if (dataFiles.length === 0) {
      spinner.fail(chalk.yellow('未找到项目数据，请先运行 "taskflow parse" 解析PRD文档'));
      return;
    }

    // 加载数据
    const data = await loadProjectData(dataFiles);

    // 生成图表
    const charts = await generateCharts(data, options);

    // 生成报告
    const reportPath = await generateReport(charts, options);

    spinner.succeed(chalk.green('可视化报告生成完成！'));

    // 显示结果
    console.log(chalk.cyan('\n📊 可视化报告:'));
    console.log(chalk.gray('  类型: ') + chalk.white(options.type));
    console.log(chalk.gray('  格式: ') + chalk.white(options.format));
    console.log(chalk.gray('  输出: ') + chalk.blue(reportPath));
    console.log(chalk.gray('  数据源: ') + chalk.white(`${dataFiles.length} 个文件`));

    // 显示统计信息
    showVisualizationStats(data);

    // 打开文件建议
    if (options.format === 'html') {
      console.log(chalk.yellow('\n💡 提示: 使用浏览器打开 HTML 文件查看交互式图表'));
    }
  } catch (error) {
    spinner.fail('可视化生成失败');
    throw error;
  }
}

async function getVisualizationOptions(baseOptions: any) {
  console.log(chalk.cyan('🎨 交互式可视化配置\n'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: '选择图表类型:',
      choices: [
        { name: '甘特图 - 显示任务时间线和依赖关系', value: 'gantt' },
        { name: '饼图 - 显示任务类型分布', value: 'pie' },
        { name: '柱状图 - 显示工时统计', value: 'bar' },
        { name: '时间线 - 显示项目进度', value: 'timeline' },
        { name: '看板 - 显示任务状态', value: 'kanban' },
        { name: '组合图表 - 生成多种图表', value: 'combined' },
      ],
      default: baseOptions.type,
    },
    {
      type: 'list',
      name: 'format',
      message: '选择输出格式:',
      choices: [
        { name: 'HTML - 交互式网页图表', value: 'html' },
        { name: 'SVG - 矢量图格式', value: 'svg' },
        { name: 'PNG - 图片格式', value: 'png' },
        { name: 'PDF - 文档格式', value: 'pdf' },
      ],
      default: baseOptions.format,
    },
    {
      type: 'checkbox',
      name: 'features',
      message: '选择包含的功能:',
      choices: [
        { name: '任务统计', value: 'stats', checked: true },
        { name: '进度分析', value: 'progress', checked: true },
        { name: '团队分工', value: 'team', checked: false },
        { name: '风险识别', value: 'risks', checked: false },
        { name: '里程碑标记', value: 'milestones', checked: true },
        { name: '数据导出', value: 'export', checked: false },
      ],
    },
    {
      type: 'list',
      name: 'theme',
      message: '选择主题:',
      choices: [
        { name: '明亮主题', value: 'light' },
        { name: '暗色主题', value: 'dark' },
        { name: '商务主题', value: 'business' },
        { name: '彩色主题', value: 'colorful' },
      ],
      default: 'light',
    },
    {
      type: 'input',
      name: 'output',
      message: '输出目录:',
      default: baseOptions.output,
      validate: input => (input.trim() ? true : '输出目录不能为空'),
    },
  ]);

  return { ...baseOptions, ...answers };
}

async function findDataFiles(): Promise<string[]> {
  const possiblePaths = ['./output', './reports', './.taskflow/data', './data'];

  const dataFiles: string[] = [];

  for (const dirPath of possiblePaths) {
    if (await fs.pathExists(dirPath)) {
      const files = await fs.readdir(dirPath);
      const jsonFiles = files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dirPath, file));
      dataFiles.push(...jsonFiles);
    }
  }

  return dataFiles;
}

async function loadProjectData(dataFiles: string[]): Promise<any> {
  const allData: {
    projects: any[];
    tasks: any[];
    documents: any[];
    summary: Record<string, any>;
  } = {
    projects: [],
    tasks: [],
    documents: [],
    summary: {},
  };

  for (const file of dataFiles) {
    try {
      const fileData = await fs.readJson(file);

      if (fileData.tasks) {
        allData.tasks.push(...fileData.tasks);
      }

      if (fileData.document) {
        allData.documents.push(fileData.document);
      }

      if (fileData.summary) {
        Object.assign(allData.summary, fileData.summary);
      }
    } catch (error) {
      console.warn(chalk.yellow(`警告: 无法解析文件 ${file}`));
    }
  }

  return allData;
}

async function generateCharts(data: any, options: any): Promise<any[]> {
  const charts = [];

  switch (options.type) {
    case 'gantt':
      charts.push(generateGanttChart(data, options));
      break;
    case 'pie':
      charts.push(generatePieChart(data, options));
      break;
    case 'bar':
      charts.push(generateBarChart(data, options));
      break;
    case 'timeline':
      charts.push(generateTimelineChart(data, options));
      break;
    case 'kanban':
      charts.push(generateKanbanChart(data, options));
      break;
    case 'combined':
      charts.push(
        generateGanttChart(data, options),
        generatePieChart(data, options),
        generateBarChart(data, options)
      );
      break;
  }

  return charts;
}

function generateGanttChart(data: any, options: any) {
  return {
    type: 'gantt',
    title: '项目甘特图',
    data: data.tasks.map((task: any, index: number) => ({
      id: task.id,
      name: task.title,
      start: new Date().toISOString().split('T')[0],
      duration: task.estimatedHours || 8,
      progress: task.progress || 0,
      dependencies: task.dependencies || [],
      type: task.type,
      priority: task.priority,
    })),
    config: {
      theme: options.theme || 'light',
      showProgress: true,
      showDependencies: true,
      showMilestones: options.features?.includes('milestones'),
    },
  };
}

function generatePieChart(data: any, options: any) {
  const taskTypes = data.tasks.reduce((acc: any, task: any) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});

  return {
    type: 'pie',
    title: '任务类型分布',
    data: Object.entries(taskTypes).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: (((count as number) / data.tasks.length) * 100).toFixed(1),
    })),
    config: {
      theme: options.theme || 'light',
      showLabels: true,
      showPercentages: true,
    },
  };
}

function generateBarChart(data: any, options: any) {
  const workloadByType = data.tasks.reduce((acc: any, task: any) => {
    acc[task.type] = (acc[task.type] || 0) + (task.estimatedHours || 0);
    return acc;
  }, {});

  return {
    type: 'bar',
    title: '工时分布统计',
    data: Object.entries(workloadByType).map(([type, hours]) => ({
      name: type,
      value: hours,
      unit: '小时',
    })),
    config: {
      theme: options.theme || 'light',
      showValues: true,
      orientation: 'vertical',
    },
  };
}

function generateTimelineChart(data: any, options: any) {
  return {
    type: 'timeline',
    title: '项目时间线',
    data: data.tasks.map((task: any) => ({
      name: task.title,
      start: new Date().toISOString(),
      end: new Date(Date.now() + (task.estimatedHours || 8) * 60 * 60 * 1000).toISOString(),
      type: task.type,
      status: task.status,
    })),
    config: {
      theme: options.theme || 'light',
      showToday: true,
      groupBy: 'type',
    },
  };
}

function generateKanbanChart(data: any, options: any) {
  const columns = ['todo', 'in-progress', 'review', 'done'];
  const kanbanData = columns.map(status => ({
    name: status,
    tasks: data.tasks.filter((task: any) => task.status === status),
  }));

  return {
    type: 'kanban',
    title: '任务看板',
    data: kanbanData,
    config: {
      theme: options.theme || 'light',
      showTaskDetails: true,
      allowDragDrop: false,
    },
  };
}

async function generateReport(charts: any[], options: any): Promise<string> {
  const outputDir = path.resolve(options.output);
  await fs.ensureDir(outputDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `taskflow-report-${timestamp}`;

  let reportPath: string;
  let content: string;

  switch (options.format) {
    case 'html':
      reportPath = path.join(outputDir, `${fileName}.html`);
      content = generateHTMLReport(charts, options);
      break;
    case 'svg':
      reportPath = path.join(outputDir, `${fileName}.svg`);
      content = generateSVGReport(charts, options);
      break;
    default:
      reportPath = path.join(outputDir, `${fileName}.html`);
      content = generateHTMLReport(charts, options);
  }

  await fs.writeFile(reportPath, content, 'utf-8');
  return reportPath;
}

function generateHTMLReport(charts: any[], options: any): string {
  const chartHTML = charts
    .map(
      chart => `
    <div class="chart-container">
      <h3>${chart.title}</h3>
      <div class="chart-placeholder">
        <p>📊 ${chart.type.toUpperCase()} 图表</p>
        <p>数据点: ${Array.isArray(chart.data) ? chart.data.length : '未知'}</p>
        <p>主题: ${chart.config.theme}</p>
      </div>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskFlow AI - 项目可视化报告</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: ${options.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
            color: ${options.theme === 'dark' ? '#ffffff' : '#333333'};
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: ${options.theme === 'dark' ? '#2a2a2a' : '#ffffff'};
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: ${options.theme === 'dark' ? '#2a2a2a' : '#ffffff'};
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .chart-placeholder {
            height: 400px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: ${options.theme === 'dark' ? '#3a3a3a' : '#f8f9fa'};
            border: 2px dashed ${options.theme === 'dark' ? '#555' : '#ddd'};
            border-radius: 8px;
            color: ${options.theme === 'dark' ? '#aaa' : '#666'};
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            padding: 20px;
            background: ${options.theme === 'dark' ? '#2a2a2a' : '#ffffff'};
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #3B82F6;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: ${options.theme === 'dark' ? '#aaa' : '#666'};
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 TaskFlow AI 项目可视化报告</h1>
        <p>生成时间: ${new Date().toLocaleString()}</p>
        <p>报告类型: ${options.type.toUpperCase()}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${charts.length}</div>
            <div>图表数量</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${options.theme}</div>
            <div>主题风格</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${options.format.toUpperCase()}</div>
            <div>输出格式</div>
        </div>
    </div>

    ${chartHTML}

    <div class="footer">
        <p>📋 该报告由 TaskFlow AI 自动生成</p>
        <p>💡 完整的交互式图表功能即将在下个版本中提供</p>
        <p>🔗 访问 <a href="https://github.com/Agions/taskflow-ai">GitHub</a> 获取更多信息</p>
    </div>
</body>
</html>`;
}

function generateSVGReport(charts: any[], options: any): string {
  return `
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${options.theme === 'dark' ? '#1a1a1a' : '#ffffff'}"/>
  <text x="400" y="50" text-anchor="middle" font-size="24" font-weight="bold" fill="${options.theme === 'dark' ? '#ffffff' : '#333333'}">
    TaskFlow AI 项目报告
  </text>
  <text x="400" y="300" text-anchor="middle" font-size="16" fill="${options.theme === 'dark' ? '#aaa' : '#666'}">
    📊 包含 ${charts.length} 个图表
  </text>
  <text x="400" y="350" text-anchor="middle" font-size="14" fill="${options.theme === 'dark' ? '#aaa' : '#666'}">
    完整的 SVG 图表功能开发中
  </text>
</svg>`;
}

function showVisualizationStats(data: any) {
  const stats = {
    totalTasks: data.tasks.length,
    totalHours: data.tasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0),
    completedTasks: data.tasks.filter((task: any) => task.status === 'done').length,
    documents: data.documents.length,
  };

  console.log(chalk.cyan('\n📈 数据统计:'));
  console.log(chalk.gray('  总任务数: ') + chalk.white(stats.totalTasks));
  console.log(chalk.gray('  总工时: ') + chalk.white(stats.totalHours + ' 小时'));
  console.log(chalk.gray('  已完成: ') + chalk.green(stats.completedTasks));
  console.log(chalk.gray('  文档数: ') + chalk.white(stats.documents));

  if (stats.totalTasks > 0) {
    const completionRate = ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1);
    console.log(chalk.gray('  完成率: ') + chalk.yellow(completionRate + '%'));
  }
}
