/**
 * 交互式提示
 */

import inquirer from 'inquirer';

export async function getVisualizationOptions(baseOptions: unknown): Promise<any> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: '选择图表类型:',
      choices: [
        { name: '甘特图 - 显示任务时间线和依赖关系', value: 'gantt' },
        { name: '饼图 - 显示任务类型分布', value: 'pie' },
        { name: '柱状图 - 显示工时统计', value: 'bar' },
        { name: '时间线 - 显示项目里程碑', value: 'timeline' },
        { name: '看板 - 显示任务状态分布', value: 'kanban' },
        { name: '组合 - 生成多种图表', value: 'combined' },
      ],
      default: baseOptions.type,
    },
    {
      type: 'list',
      name: 'format',
      message: '选择输出格式:',
      choices: [
        { name: 'HTML - 交互式网页', value: 'html' },
        { name: 'SVG - 矢量图形', value: 'svg' },
      ],
      default: baseOptions.format,
    },
    {
      type: 'input',
      name: 'output',
      message: '输出目录:',
      default: baseOptions.output,
    },
  ]);

  return { ...baseOptions, ...answers };
}
