/**
 * 任务拓扑排序器
 */

import { Task } from '../types';

export class TaskSorter {
  topologicalSort(tasks: Task[], dependencies: Map<string, string[]>): Task[] {
    const sorted: Task[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected: ${taskId}`);
      }

      visiting.add(taskId);

      const deps = dependencies.get(taskId) || [];
      for (const depId of deps) {
        visit(depId);
      }

      visiting.delete(taskId);
      visited.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task) {
        sorted.push(task);
      }
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return sorted;
  }
}
