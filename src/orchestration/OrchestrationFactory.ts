/**
 * TaskFlow AI - 任务编排工厂类
 * 
 * 提供不同编排策略的工厂方法和预设配置
 * 
 * @author TaskFlow AI Team
 * @version 1.0.0
 */

import {
  TaskOrchestrationConfig,
  SchedulingStrategy,
  OptimizationGoal,
} from '../types/task.js';
import { TaskOrchestrationEngine } from './TaskOrchestrationEngine.js';

/**
 * 编排策略预设
 */
export enum OrchestrationPreset {
  AGILE_SPRINT = 'agile_sprint',           // 敏捷冲刺
  WATERFALL = 'waterfall',                 // 瀑布模型
  CRITICAL_CHAIN = 'critical_chain',       // 关键链
  LEAN_STARTUP = 'lean_startup',           // 精益创业
  RAPID_PROTOTYPE = 'rapid_prototype',     // 快速原型
  ENTERPRISE = 'enterprise',               // 企业级
  RESEARCH = 'research',                   // 研究项目
  MAINTENANCE = 'maintenance',             // 维护项目
}

/**
 * 任务编排工厂类
 */
export class OrchestrationFactory {
  /**
   * 创建编排引擎
   */
  public static createEngine(
    preset?: OrchestrationPreset,
    customConfig?: Partial<TaskOrchestrationConfig>
  ): TaskOrchestrationEngine {
    const baseConfig = preset ? this.getPresetConfig(preset) : this.getDefaultConfig();
    const finalConfig = { ...baseConfig, ...customConfig };
    
    return new TaskOrchestrationEngine(finalConfig);
  }

  /**
   * 获取预设配置
   */
  public static getPresetConfig(preset: OrchestrationPreset): TaskOrchestrationConfig {
    switch (preset) {
      case OrchestrationPreset.AGILE_SPRINT:
        return this.getAgileSprintConfig();
      
      case OrchestrationPreset.WATERFALL:
        return this.getWaterfallConfig();
      
      case OrchestrationPreset.CRITICAL_CHAIN:
        return this.getCriticalChainConfig();
      
      case OrchestrationPreset.LEAN_STARTUP:
        return this.getLeanStartupConfig();
      
      case OrchestrationPreset.RAPID_PROTOTYPE:
        return this.getRapidPrototypeConfig();
      
      case OrchestrationPreset.ENTERPRISE:
        return this.getEnterpriseConfig();
      
      case OrchestrationPreset.RESEARCH:
        return this.getResearchConfig();
      
      case OrchestrationPreset.MAINTENANCE:
        return this.getMaintenanceConfig();
      
      default:
        return this.getDefaultConfig();
    }
  }

  /**
   * 默认配置
   */
  private static getDefaultConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: true,
      enableParallelOptimization: true,
      enableResourceLeveling: false,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
      optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
      maxParallelTasks: 5,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.1,
    };
  }

  /**
   * 敏捷冲刺配置
   */
  private static getAgileSprintConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: true,
      enableParallelOptimization: true,
      enableResourceLeveling: true,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.PRIORITY_FIRST,
      optimizationGoal: OptimizationGoal.MAXIMIZE_QUALITY,
      maxParallelTasks: 8,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.15, // 敏捷项目需要更多缓冲
    };
  }

  /**
   * 瀑布模型配置
   */
  private static getWaterfallConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: true,
      enableParallelOptimization: false, // 瀑布模型强调顺序执行
      enableResourceLeveling: true,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
      optimizationGoal: OptimizationGoal.MINIMIZE_RISK,
      maxParallelTasks: 3,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.2, // 瀑布模型需要更多缓冲时间
    };
  }

  /**
   * 关键链配置
   */
  private static getCriticalChainConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: true,
      enableParallelOptimization: true,
      enableResourceLeveling: true,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.CRITICAL_PATH,
      optimizationGoal: OptimizationGoal.BALANCE_RESOURCES,
      maxParallelTasks: 6,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.25, // 关键链方法使用缓冲区管理
    };
  }

  /**
   * 精益创业配置
   */
  private static getLeanStartupConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: false, // 精益创业更注重快速迭代
      enableParallelOptimization: true,
      enableResourceLeveling: false,
      enableRiskAnalysis: false, // 快速试错，不过度分析风险
      schedulingStrategy: SchedulingStrategy.SHORTEST_FIRST,
      optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
      maxParallelTasks: 10,
      workingHoursPerDay: 10, // 创业团队工作时间更长
      workingDaysPerWeek: 6,
      bufferPercentage: 0.05, // 最小缓冲，快速迭代
    };
  }

  /**
   * 快速原型配置
   */
  private static getRapidPrototypeConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: false,
      enableParallelOptimization: true,
      enableResourceLeveling: false,
      enableRiskAnalysis: false,
      schedulingStrategy: SchedulingStrategy.SHORTEST_FIRST,
      optimizationGoal: OptimizationGoal.MINIMIZE_DURATION,
      maxParallelTasks: 12,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.05,
    };
  }

  /**
   * 企业级配置
   */
  private static getEnterpriseConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: true,
      enableParallelOptimization: true,
      enableResourceLeveling: true,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.RESOURCE_LEVELING,
      optimizationGoal: OptimizationGoal.BALANCE_RESOURCES,
      maxParallelTasks: 15,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.2,
    };
  }

  /**
   * 研究项目配置
   */
  private static getResearchConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: false, // 研究项目路径不确定
      enableParallelOptimization: false, // 研究任务通常需要顺序进行
      enableResourceLeveling: false,
      enableRiskAnalysis: true,
      schedulingStrategy: SchedulingStrategy.LONGEST_FIRST, // 先做复杂的研究
      optimizationGoal: OptimizationGoal.MAXIMIZE_QUALITY,
      maxParallelTasks: 3,
      workingHoursPerDay: 6, // 研究需要深度思考时间
      workingDaysPerWeek: 5,
      bufferPercentage: 0.3, // 研究项目不确定性高
    };
  }

  /**
   * 维护项目配置
   */
  private static getMaintenanceConfig(): TaskOrchestrationConfig {
    return {
      enableCriticalPath: false,
      enableParallelOptimization: true,
      enableResourceLeveling: true,
      enableRiskAnalysis: false, // 维护任务风险相对较低
      schedulingStrategy: SchedulingStrategy.PRIORITY_FIRST,
      optimizationGoal: OptimizationGoal.MINIMIZE_COST,
      maxParallelTasks: 6,
      workingHoursPerDay: 8,
      workingDaysPerWeek: 5,
      bufferPercentage: 0.1,
    };
  }

  /**
   * 获取所有可用预设
   */
  public static getAvailablePresets(): Array<{
    preset: OrchestrationPreset;
    name: string;
    description: string;
    suitableFor: string[];
  }> {
    return [
      {
        preset: OrchestrationPreset.AGILE_SPRINT,
        name: '敏捷冲刺',
        description: '适用于敏捷开发的迭代式项目管理',
        suitableFor: ['敏捷开发', 'Scrum', '迭代开发', '快速交付'],
      },
      {
        preset: OrchestrationPreset.WATERFALL,
        name: '瀑布模型',
        description: '传统的顺序式项目管理方法',
        suitableFor: ['传统项目', '需求明确', '风险控制', '合规要求'],
      },
      {
        preset: OrchestrationPreset.CRITICAL_CHAIN,
        name: '关键链',
        description: '基于约束理论的项目管理方法',
        suitableFor: ['资源约束', '多项目管理', '缓冲区管理'],
      },
      {
        preset: OrchestrationPreset.LEAN_STARTUP,
        name: '精益创业',
        description: '快速迭代和验证的创业项目管理',
        suitableFor: ['创业项目', '快速验证', 'MVP开发', '市场试错'],
      },
      {
        preset: OrchestrationPreset.RAPID_PROTOTYPE,
        name: '快速原型',
        description: '专注于快速构建原型的项目管理',
        suitableFor: ['原型开发', '概念验证', '快速演示'],
      },
      {
        preset: OrchestrationPreset.ENTERPRISE,
        name: '企业级',
        description: '适用于大型企业的复杂项目管理',
        suitableFor: ['大型项目', '多团队协作', '企业治理', '合规管理'],
      },
      {
        preset: OrchestrationPreset.RESEARCH,
        name: '研究项目',
        description: '适用于研究和探索性项目',
        suitableFor: ['科研项目', '技术探索', '不确定性高', '创新研发'],
      },
      {
        preset: OrchestrationPreset.MAINTENANCE,
        name: '维护项目',
        description: '适用于系统维护和运营项目',
        suitableFor: ['系统维护', '运营支持', '缺陷修复', '性能优化'],
      },
    ];
  }

  /**
   * 根据项目特征推荐预设
   */
  public static recommendPreset(projectCharacteristics: {
    teamSize?: number;
    projectDuration?: number; // 天数
    uncertaintyLevel?: number; // 1-10
    qualityRequirement?: number; // 1-10
    timeConstraint?: number; // 1-10
    budgetConstraint?: number; // 1-10
    isAgile?: boolean;
    isResearch?: boolean;
    isEnterprise?: boolean;
  }): OrchestrationPreset {
    const {
      teamSize = 5,
      projectDuration = 30,
      uncertaintyLevel = 5,
      qualityRequirement = 7,
      timeConstraint = 5,
      budgetConstraint = 5,
      isAgile = false,
      isResearch = false,
      isEnterprise = false,
    } = projectCharacteristics;

    // 企业级项目
    if (isEnterprise || teamSize > 20) {
      return OrchestrationPreset.ENTERPRISE;
    }

    // 研究项目
    if (isResearch || uncertaintyLevel > 8) {
      return OrchestrationPreset.RESEARCH;
    }

    // 敏捷项目
    if (isAgile || (timeConstraint > 7 && projectDuration < 90)) {
      return OrchestrationPreset.AGILE_SPRINT;
    }

    // 快速原型
    if (projectDuration < 14 && timeConstraint > 8) {
      return OrchestrationPreset.RAPID_PROTOTYPE;
    }

    // 精益创业
    if (uncertaintyLevel > 6 && timeConstraint > 6 && teamSize < 10) {
      return OrchestrationPreset.LEAN_STARTUP;
    }

    // 维护项目
    if (qualityRequirement < 6 && uncertaintyLevel < 4) {
      return OrchestrationPreset.MAINTENANCE;
    }

    // 瀑布模型
    if (uncertaintyLevel < 4 && qualityRequirement > 8) {
      return OrchestrationPreset.WATERFALL;
    }

    // 关键链
    if (budgetConstraint > 7 || teamSize > 10) {
      return OrchestrationPreset.CRITICAL_CHAIN;
    }

    // 默认敏捷冲刺
    return OrchestrationPreset.AGILE_SPRINT;
  }
}
