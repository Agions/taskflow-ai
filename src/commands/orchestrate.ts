/**
 * TaskFlow AI - 任务编排命令
 * 
 * 提供智能任务编排功能的CLI命令
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { TaskManager, Task as TaskManagerTask } from '../core/tasks/task-manager.js';
import { TaskOrchestrationEngine } from '../orchestration/TaskOrchestrationEngine.js';
import { OrchestrationFactory, OrchestrationPreset } from '../orchestration/OrchestrationFactory.js';
import {
  Task,
  TaskOrchestrationConfig,
  SchedulingStrategy,
  OptimizationGoal,
} from '../types/task.js';
import { displayTable, displayTaskList, displayGanttChart } from '../utils/display.js';

/**
 * 转换TaskManager的Task为编排引擎的Task
 */
function convertToOrchestrationTask(tmTask: TaskManagerTask): Task {
  return {
    id: tmTask.id,
    name: tmTask.title,
    title: tmTask.title,
    description: tmTask.description,
    status: convertStatus(tmTask.status),
    priority: convertPriority(tmTask.priority),
    type: 'feature' as any, // 默认类型
    dependencies: tmTask.dependencies,
    estimatedHours: tmTask.estimatedHours,
    actualHours: tmTask.actualHours,
    createdAt: tmTask.createdAt,
    updatedAt: tmTask.updatedAt,
    startedAt: tmTask.startedAt,
    completedAt: tmTask.completedAt,
    dueDate: tmTask.dueDate,
    assignee: tmTask.assignee,
    tags: tmTask.tags,
    progress: tmTask.progress,
    metadata: tmTask.metadata,
  };
}

/**
 * 转换状态
 */
function convertStatus(status: any): any {
  const statusMap: Record<string, string> = {
    'pending': 'not_started',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'blocked': 'blocked',
    'cancelled': 'cancelled'
  };
  return statusMap[status] || status;
}

/**
 * 转换优先级
 */
function convertPriority(priority: any): any {
  return priority; // 优先级枚举相同
}

/**
 * 创建编排命令
 */
export function createOrchestrateCommand(): Command {
  const command = new Command('orchestrate');
  
  command
    .description('智能任务编排和优化')
    .option('-p, --preset <preset>', '使用预设编排策略')
    .option('-s, --strategy <strategy>', '调度策略')
    .option('-g, --goal <goal>', '优化目标')
    .option('--max-parallel <number>', '最大并行任务数', '10')
    .option('--buffer <percentage>', '缓冲时间百分比', '0.1')
    .option('--critical-path', '启用关键路径分析', true)
    .option('--no-critical-path', '禁用关键路径分析')
    .option('--parallel-optimization', '启用并行优化', true)
    .option('--no-parallel-optimization', '禁用并行优化')
    .option('--resource-leveling', '启用资源平衡')
    .option('--no-resource-leveling', '禁用资源平衡')
    .option('--risk-analysis', '启用风险分析', true)
    .option('--no-risk-analysis', '禁用风险分析')
    .option('--output <format>', '输出格式 (table|json|gantt)', 'table')
    .option('--save', '保存编排结果到项目')
    .option('--dry-run', '仅显示编排结果，不保存')
    .action(async (options) => {
      await handleOrchestrateCommand(options);
    });

  // 添加子命令
  command.addCommand(createPresetsCommand());
  command.addCommand(createAnalyzeCommand());
  command.addCommand(createOptimizeCommand());
  command.addCommand(createRecommendCommand());

  return command;
}

/**
 * 处理编排命令
 */
async function handleOrchestrateCommand(options: any): Promise<void> {
  const spinner = ora('正在加载任务数据...').start();
  
  try {
    // 加载任务管理器
    const taskManager = new TaskManager();
    const tmTasks = taskManager.getAllTasks();
    const tasks = tmTasks.map(convertToOrchestrationTask);
    
    if (tasks.length === 0) {
      spinner.fail('没有找到任务，请先创建任务');
      return;
    }
    
    spinner.text = '正在配置编排引擎...';
    
    // 构建编排配置
    const config = buildOrchestrationConfig(options);
    
    // 创建编排引擎
    const engine = options.preset 
      ? OrchestrationFactory.createEngine(options.preset as OrchestrationPreset, config)
      : new TaskOrchestrationEngine(config);
    
    spinner.text = `正在编排 ${tasks.length} 个任务...`;
    
    // 执行编排
    const result = await engine.orchestrate(tasks);
    
    spinner.succeed('任务编排完成');
    
    // 显示结果
    await displayOrchestrationResult(result, options.output);
    
    // 保存结果
    if (options.save && !options.dryRun) {
      const saveSpinner = ora('正在保存编排结果...').start();
      
      try {
        // 更新任务时间信息
        const updatedTasks = engine.updateTaskTimeInfo(result.tasks);

        // 保存到任务管理器
        for (const task of updatedTasks) {
          // 转换回TaskManager格式并更新
          const tmTaskUpdate = {
            title: task.name,
            description: task.description,
            estimatedHours: task.estimatedHours || 0,
            metadata: {
              ...task.metadata,
              timeInfo: task.timeInfo,
              orchestrationMetadata: task.orchestrationMetadata
            }
          };
          taskManager.updateTask(task.id, tmTaskUpdate);
        }
        
        saveSpinner.succeed('编排结果已保存');
      } catch (error) {
        saveSpinner.fail(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
  } catch (error) {
    spinner.fail(`编排失败: ${error instanceof Error ? error.message : '未知错误'}`);
    process.exit(1);
  }
}

/**
 * 构建编排配置
 */
function buildOrchestrationConfig(options: any): Partial<TaskOrchestrationConfig> {
  const config: Partial<TaskOrchestrationConfig> = {};
  
  if (options.strategy) {
    config.schedulingStrategy = options.strategy as SchedulingStrategy;
  }
  
  if (options.goal) {
    config.optimizationGoal = options.goal as OptimizationGoal;
  }
  
  if (options.maxParallel) {
    config.maxParallelTasks = parseInt(options.maxParallel);
  }
  
  if (options.buffer) {
    config.bufferPercentage = parseFloat(options.buffer);
  }
  
  config.enableCriticalPath = options.criticalPath;
  config.enableParallelOptimization = options.parallelOptimization;
  config.enableResourceLeveling = options.resourceLeveling;
  config.enableRiskAnalysis = options.riskAnalysis;
  
  return config;
}

/**
 * 显示编排结果
 */
async function displayOrchestrationResult(result: any, format: string): Promise<void> {
  console.log('\n' + chalk.bold.blue('📊 任务编排结果'));
  console.log('═'.repeat(60));
  
  // 显示基本统计
  console.log(chalk.green(`✅ 总任务数: ${result.tasks.length}`));
  console.log(chalk.yellow(`⏱️  项目持续时间: ${result.totalDuration} 小时`));
  console.log(chalk.red(`🎯 关键路径任务: ${result.criticalPath.length}`));
  console.log(chalk.blue(`🔄 并行任务组: ${result.parallelGroups.length}`));
  console.log(chalk.magenta(`⚠️  整体风险等级: ${result.riskAssessment.overallRiskLevel.toFixed(1)}/10`));
  
  console.log('\n' + chalk.bold('📋 编排策略'));
  console.log(`策略: ${result.metadata.strategy}`);
  console.log(`目标: ${result.metadata.goal}`);
  console.log(`编排时间: ${result.metadata.orchestrationTime.toLocaleString()}`);
  
  // 根据格式显示详细结果
  switch (format) {
    case 'json':
      console.log('\n' + chalk.bold('📄 详细结果 (JSON)'));
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'gantt':
      console.log('\n' + chalk.bold('📊 甘特图'));
      displayGanttChart(result.tasks);
      break;
      
    case 'table':
    default:
      await displayTableResult(result);
      break;
  }
  
  // 显示关键路径
  if (result.criticalPath.length > 0) {
    console.log('\n' + chalk.bold.red('🎯 关键路径'));
    const criticalTasks = result.tasks.filter((task: any) => result.criticalPath.includes(task.id));
    displayTaskList(criticalTasks, { showTimeInfo: true });
  }
  
  // 显示并行任务组
  if (result.parallelGroups.length > 0) {
    console.log('\n' + chalk.bold.blue('🔄 并行任务组'));
    result.parallelGroups.forEach((group: string[], index: number) => {
      console.log(chalk.cyan(`组 ${index + 1}: ${group.join(', ')}`));
    });
  }
  
  // 显示优化建议
  if (result.recommendations.length > 0) {
    console.log('\n' + chalk.bold.green('💡 优化建议'));
    result.recommendations.forEach((recommendation: string, index: number) => {
      console.log(chalk.green(`${index + 1}. ${recommendation}`));
    });
  }
  
  // 显示风险评估
  if (result.riskAssessment.riskFactors.length > 0) {
    console.log('\n' + chalk.bold.yellow('⚠️  风险评估'));
    result.riskAssessment.riskFactors.forEach((risk: any) => {
      console.log(chalk.yellow(`• ${risk.name}: ${risk.riskScore.toFixed(1)} (${risk.category})`));
    });
  }
}

/**
 * 显示表格结果
 */
async function displayTableResult(result: any): Promise<void> {
  console.log('\n' + chalk.bold('📋 任务详情'));
  
  const tableData = result.tasks.map((task: any) => {
    const timeInfo = task.timeInfo || {};
    return {
      'ID': task.id.substring(0, 8),
      '任务名称': task.name,
      '状态': task.status,
      '优先级': task.priority,
      '预计时长': `${task.estimatedHours || 0}h`,
      '最早开始': timeInfo.earliestStart ? new Date(timeInfo.earliestStart).toLocaleDateString() : '-',
      '最晚开始': timeInfo.latestStart ? new Date(timeInfo.latestStart).toLocaleDateString() : '-',
      '浮动时间': timeInfo.totalFloat ? `${timeInfo.totalFloat.toFixed(1)}h` : '-',
      '关键任务': timeInfo.isCritical ? '✅' : '❌',
    };
  });
  
  displayTable(tableData);
}

/**
 * 创建预设命令
 */
function createPresetsCommand(): Command {
  const command = new Command('presets');
  
  command
    .description('查看可用的编排预设')
    .action(() => {
      console.log('\n' + chalk.bold.blue('📋 可用编排预设'));
      console.log('═'.repeat(60));
      
      const presets = OrchestrationFactory.getAvailablePresets();
      
      presets.forEach(preset => {
        console.log(chalk.bold.green(`\n${preset.name} (${preset.preset})`));
        console.log(chalk.gray(preset.description));
        console.log(chalk.blue('适用场景: ') + preset.suitableFor.join(', '));
      });
      
      console.log('\n' + chalk.yellow('使用方法:'));
      console.log(chalk.cyan('taskflow orchestrate --preset agile_sprint'));
    });
  
  return command;
}

/**
 * 创建分析命令
 */
function createAnalyzeCommand(): Command {
  const command = new Command('analyze');
  
  command
    .description('分析当前任务结构')
    .action(async () => {
      const spinner = ora('正在分析任务结构...').start();
      
      try {
        const taskManager = new TaskManager();
        const tasks = taskManager.getAllTasks();
        
        if (tasks.length === 0) {
          spinner.fail('没有找到任务');
          return;
        }
        
        const engine = new TaskOrchestrationEngine();
        const stats = engine.getOrchestrationStats();
        
        spinner.succeed('任务分析完成');
        
        console.log('\n' + chalk.bold.blue('📊 任务结构分析'));
        console.log('═'.repeat(40));
        console.log(chalk.green(`总任务数: ${stats.totalTasks}`));
        console.log(chalk.red(`关键任务数: ${stats.criticalTasks}`));
        console.log(chalk.blue(`并行任务组: ${stats.parallelGroups}`));
        console.log(chalk.yellow(`平均浮动时间: ${stats.averageFloat.toFixed(1)}h`));
        console.log(chalk.magenta(`最长路径: ${stats.longestPath.toFixed(1)}h`));
        
      } catch (error) {
        spinner.fail(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    });
  
  return command;
}

/**
 * 创建优化命令
 */
function createOptimizeCommand(): Command {
  const command = new Command('optimize');
  
  command
    .description('优化任务安排')
    .option('--goal <goal>', '优化目标', 'minimize_duration')
    .action(async (options) => {
      console.log(chalk.blue('🔧 任务优化功能开发中...'));
      console.log(chalk.gray('将在下个版本中提供更多优化选项'));
    });
  
  return command;
}

/**
 * 创建推荐命令
 */
function createRecommendCommand(): Command {
  const command = new Command('recommend');
  
  command
    .description('推荐编排策略')
    .option('--team-size <number>', '团队规模', '5')
    .option('--duration <days>', '项目持续时间（天）', '30')
    .option('--uncertainty <level>', '不确定性等级 (1-10)', '5')
    .option('--quality <level>', '质量要求 (1-10)', '7')
    .option('--time-constraint <level>', '时间约束 (1-10)', '5')
    .option('--budget-constraint <level>', '预算约束 (1-10)', '5')
    .option('--agile', '敏捷项目')
    .option('--research', '研究项目')
    .option('--enterprise', '企业级项目')
    .action((options) => {
      const characteristics = {
        teamSize: parseInt(options.teamSize),
        projectDuration: parseInt(options.duration),
        uncertaintyLevel: parseInt(options.uncertainty),
        qualityRequirement: parseInt(options.quality),
        timeConstraint: parseInt(options.timeConstraint),
        budgetConstraint: parseInt(options.budgetConstraint),
        isAgile: options.agile,
        isResearch: options.research,
        isEnterprise: options.enterprise,
      };
      
      const recommendedPreset = OrchestrationFactory.recommendPreset(characteristics);
      const presets = OrchestrationFactory.getAvailablePresets();
      const presetInfo = presets.find(p => p.preset === recommendedPreset);
      
      console.log('\n' + chalk.bold.blue('🎯 推荐编排策略'));
      console.log('═'.repeat(40));
      
      if (presetInfo) {
        console.log(chalk.bold.green(`推荐策略: ${presetInfo.name}`));
        console.log(chalk.gray(presetInfo.description));
        console.log(chalk.blue('适用场景: ') + presetInfo.suitableFor.join(', '));
        
        console.log('\n' + chalk.yellow('使用方法:'));
        console.log(chalk.cyan(`taskflow orchestrate --preset ${recommendedPreset}`));
      }
    });
  
  return command;
}
