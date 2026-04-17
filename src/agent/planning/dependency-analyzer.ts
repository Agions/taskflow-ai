import { getLogger } from '../../utils/logger';
/**
 * 依赖分析器
 */

import { Task, Dependency } from '../types';
const logger = getLogger('agent/planning/dependency-analyzer');

export class DependencyAnalyzer {
  analyze(tasks: Task[]): Dependency[] {
    const dependencies: Dependency[] = [];

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const taskA = tasks[i];
        const taskB = tasks[j];

        if (taskB.dependencies.includes(taskA.id)) {
          dependencies.push({ from: taskA.id, to: taskB.id, type: 'blocks' });
        }

        if (this.hasImplicitDependency(taskA, taskB)) {
          dependencies.push({ from: taskA.id, to: taskB.id, type: 'depends-on' });
        }
      }
    }

    return dependencies;
  }

  private hasImplicitDependency(taskA: Task, taskB: Task): boolean {
    const keywords = ['setup', 'config', 'init', 'prepare'];
    const aTitle = taskA.title.toLowerCase();
    const bTitle = taskB.title.toLowerCase();

    if (keywords.some(k => aTitle.includes(k)) && !keywords.some(k => bTitle.includes(k))) {
      return true;
    }

    return false;
  }

  buildGraph(tasks: Task[], dependencies: Dependency[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const task of tasks) {
      graph.set(task.id, []);
    }

    for (const dep of dependencies) {
      const next = graph.get(dep.from) || [];
      next.push(dep.to);
      graph.set(dep.from, next);
    }

    return graph;
  }

  calculateCriticalPath(tasks: Task[], dependencies: Dependency[]): string[] {
    const graph = this.buildGraph(tasks, dependencies);
    const path: string[] = [];
    const visited = new Set<string>();

    const dfs = (taskId: string, currentPath: string[]) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      currentPath.push(taskId);

      const nextTasks = graph.get(taskId) || [];
      if (nextTasks.length === 0) {
        if (currentPath.length > path.length) {
          path.length = 0;
          path.push(...currentPath);
        }
      } else {
        for (const next of nextTasks) {
          dfs(next, [...currentPath]);
        }
      }
    };

    const inDegree = new Map<string, number>();
    for (const task of tasks) inDegree.set(task.id, 0);
    for (const dep of dependencies) {
      inDegree.set(dep.to, (inDegree.get(dep.to) || 0) + 1);
    }

    for (const [taskId, degree] of inDegree) {
      if (degree === 0) dfs(taskId, []);
    }

    return path;
  }
}
