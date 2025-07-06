#!/usr/bin/env node

/**
 * TaskFlow AI - 智能任务编排引擎测试脚本
 * 
 * 测试编排引擎的核心功能
 */

const { TaskOrchestrationEngine, OrchestrationFactory, OrchestrationPreset } = require('./dist/index.js');

// 创建测试任务
function createTestTasks() {
  return [
    {
      id: 'task-1',
      name: '项目初始化',
      title: '项目初始化',
      description: '创建项目结构，配置开发环境',
      status: 'not_started',
      priority: 'high',
      type: 'setup',
      dependencies: [],
      estimatedHours: 4,
      tags: ['setup', 'infrastructure'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-2',
      name: '数据库设计',
      title: '数据库设计',
      description: '设计数据库结构和关系',
      status: 'not_started',
      priority: 'high',
      type: 'design',
      dependencies: ['task-1'],
      estimatedHours: 8,
      tags: ['database', 'design'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-3',
      name: '用户认证API',
      title: '用户认证API',
      description: '实现用户注册、登录API',
      status: 'not_started',
      priority: 'high',
      type: 'feature',
      dependencies: ['task-2'],
      estimatedHours: 12,
      tags: ['api', 'authentication'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-4',
      name: '用户界面设计',
      title: '用户界面设计',
      description: '设计用户界面和交互',
      status: 'not_started',
      priority: 'medium',
      type: 'design',
      dependencies: ['task-1'],
      estimatedHours: 16,
      tags: ['ui', 'design'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-5',
      name: '前端开发',
      title: '前端开发',
      description: '实现前端用户界面',
      status: 'not_started',
      priority: 'medium',
      type: 'feature',
      dependencies: ['task-3', 'task-4'],
      estimatedHours: 20,
      tags: ['frontend', 'ui'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-6',
      name: '测试编写',
      title: '测试编写',
      description: '编写单元测试和集成测试',
      status: 'not_started',
      priority: 'medium',
      type: 'testing',
      dependencies: ['task-5'],
      estimatedHours: 10,
      tags: ['testing', 'quality'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task-7',
      name: '部署配置',
      title: '部署配置',
      description: '配置生产环境部署',
      status: 'not_started',
      priority: 'low',
      type: 'deployment',
      dependencies: ['task-6'],
      estimatedHours: 6,
      tags: ['deployment', 'devops'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// 显示编排结果
function displayResult(result) {
  console.log('\n🎯 智能任务编排结果');
  console.log('═'.repeat(50));
  
  console.log(`\n📊 项目概览:`);
  console.log(`   总任务数: ${result.tasks.length}`);
  console.log(`   总持续时间: ${result.totalDuration} 小时`);
  console.log(`   关键任务数: ${result.criticalPath.length}`);
  console.log(`   并行组数: ${result.parallelGroups.length}`);
  
  console.log(`\n🎯 关键路径:`);
  if (result.criticalPath.length > 0) {
    result.criticalPath.forEach((taskId, index) => {
      const task = result.tasks.find(t => t.id === taskId);
      console.log(`   ${index + 1}. ${task?.name || taskId} (${task?.estimatedHours || 0}h)`);
    });
  } else {
    console.log('   无关键路径');
  }
  
  console.log(`\n⚡ 并行任务组:`);
  if (result.parallelGroups.length > 0) {
    result.parallelGroups.forEach((group, index) => {
      console.log(`   组 ${index + 1}: ${group.map(taskId => {
        const task = result.tasks.find(t => t.id === taskId);
        return task?.name || taskId;
      }).join(', ')}`);
    });
  } else {
    console.log('   无并行任务组');
  }
  
  console.log(`\n📋 任务排序:`);
  result.tasks.forEach((task, index) => {
    const isCritical = result.criticalPath.includes(task.id);
    const criticalMark = isCritical ? '🔴' : '⚪';
    console.log(`   ${index + 1}. ${criticalMark} ${task.name} (${task.estimatedHours}h)`);
  });
  
  console.log(`\n⚠️ 风险评估:`);
  console.log(`   总体风险等级: ${result.riskAssessment.overallRiskLevel}`);
  if (result.riskAssessment.riskFactors.length > 0) {
    result.riskAssessment.riskFactors.forEach(risk => {
      console.log(`   - ${risk.name}: ${risk.riskScore.toFixed(1)} (${risk.description})`);
    });
  }
  
  console.log(`\n💡 优化建议:`);
  result.recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  
  console.log(`\n📈 编排元数据:`);
  console.log(`   策略: ${result.metadata.strategy}`);
  console.log(`   目标: ${result.metadata.goal}`);
  console.log(`   版本: ${result.metadata.version}`);
  console.log(`   时间: ${result.metadata.orchestrationTime.toLocaleString()}`);
}

// 测试不同的编排策略
async function testOrchestrationStrategies() {
  const tasks = createTestTasks();
  
  console.log('🚀 TaskFlow AI - 智能任务编排引擎测试');
  console.log('═'.repeat(50));
  
  // 测试1: 默认配置
  console.log('\n📋 测试1: 默认配置 (关键路径策略)');
  console.log('-'.repeat(30));
  const engine1 = new TaskOrchestrationEngine();
  const result1 = await engine1.orchestrate(tasks);
  displayResult(result1);
  
  // 测试2: 敏捷冲刺预设
  console.log('\n📋 测试2: 敏捷冲刺预设');
  console.log('-'.repeat(30));
  const engine2 = OrchestrationFactory.createEngine(OrchestrationPreset.AGILE_SPRINT);
  const result2 = await engine2.orchestrate(tasks);
  displayResult(result2);
  
  // 测试3: 企业级预设
  console.log('\n📋 测试3: 企业级预设');
  console.log('-'.repeat(30));
  const engine3 = OrchestrationFactory.createEngine(OrchestrationPreset.ENTERPRISE);
  const result3 = await engine3.orchestrate(tasks);
  displayResult(result3);
  
  console.log('\n✅ 所有测试完成！');
}

// 运行测试
if (require.main === module) {
  testOrchestrationStrategies().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
}
