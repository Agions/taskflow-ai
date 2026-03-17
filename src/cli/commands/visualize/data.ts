/**
 * 数据加载器
 */

import path from 'path';
import fs from 'fs-extra';

export async function findDataFiles(cwd: string = process.cwd()): Promise<string[]> {
  const dataDir = path.join(cwd, '.taskflow', 'data');

  if (!(await fs.pathExists(dataDir))) {
    return [];
  }

  const files = await fs.readdir(dataDir);
  return files.filter(f => f.endsWith('.json')).map(f => path.join(dataDir, f));
}

export async function loadProjectData(files: string[]): Promise<any> {
  const allData: any = {
    tasks: [],
    metadata: {},
  };

  for (const file of files) {
    try {
      const data = await fs.readJson(file);
      if (data.tasks) {
        allData.tasks.push(...data.tasks);
      }
      Object.assign(allData.metadata, data.metadata);
    } catch (error) {
      console.warn(`Failed to load data file: ${file}`);
    }
  }

  return allData;
}

export function showVisualizationStats(data: any): void {
  const stats = {
    totalTasks: data.tasks.length,
    byType: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    totalHours: 0,
  };

  for (const task of data.tasks) {
    stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;
    stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    stats.totalHours += task.estimatedHours || 0;
  }

  console.log('\n📈 数据统计:');
  console.log(`  总任务数: ${stats.totalTasks}`);
  console.log(`  预估工时: ${stats.totalHours} 小时`);
}
