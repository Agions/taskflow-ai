/**
 * 图表生成器
 */

export interface ChartData {
  type: string;
  title: string;
  data: unknown[];
  config: Record<string, any>;
}

export function generateGanttChart(data: any, options: any): ChartData {
  return {
    type: 'gantt',
    title: '项目甘特图',
    data: data.tasks.map((task: any) => ({
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

export function generatePieChart(data: any, options: any): ChartData {
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

export function generateBarChart(data: any, options: any): ChartData {
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

export function generateTimelineChart(data: any, options: any): ChartData {
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

export function generateKanbanChart(data: any, options: any): ChartData {
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

export function generateCharts(data: any, options: any): ChartData[] {
  const charts: ChartData[] = [];

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
