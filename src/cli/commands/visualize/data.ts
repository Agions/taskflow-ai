import { getLogger } from '../../../utils/logger';
const logger = getLogger('cli/commands/visualize/data');

/**
 * 数据加载器
 */

import path = require('path');
import fs = require('fs-extra');
import { Task } from '../../../types/task';
import { VisualizationData } from './charts';

/** 项目元数据 */
export interface ProjectMetadata {
  name?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 项目数据文件结构 */
interface ProjectDataFile {
  tasks?: Task[];
  metadata?: ProjectMetadata;
}

export async function findDataFiles(cwd: string = process.cwd()): Promise<string[]> {
  const dataDir = path.join(cwd, '.taskflow', 'data');

  if (!(await fs.pathExists(dataDir))) {
    return [];
  }

  const files = await fs.readdir(dataDir);
  return files.filter(f => f.endsWith('.json')).map(f => path.join(dataDir, f));
}

export async function loadProjectData(files: string[]): Promise<VisualizationData> {
  const allData: VisualizationData = {
    tasks: [],
  };

  for (const file of files) {
    try {
      const data: ProjectDataFile = await fs.readJson(file);
      if (data.tasks) {
        allData.tasks.push(...data.tasks);
      }
    } catch (error) {
      logger.warn(`Failed to load data file: ${file}`);
    }
  }

  return allData;
}

export function showVisualizationStats(data: VisualizationData): void {
  const stats = {
    totalTasks: data.tasks.length,
    byType: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    totalHours: 0,
  };

  for (const task of data.tasks) {
    const type = task.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    stats.totalHours += task.estimatedHours || 0;
  }

  console.log('\n📈 数据统计:');
  console.log(`  总任务数: ${stats.totalTasks}`);
  console.log(`  预估工时: ${stats.totalHours} 小时`);
}
