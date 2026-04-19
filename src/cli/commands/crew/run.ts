/**
 * taskflow crew run - 运行 Workflow
 */

import { workflowEngine, Stage, StageExecutionResult } from '../../../core/crew';
import { Logger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = Logger.getInstance('crew:run');

export async function executeRun(
  template: string,
  options: {
    input?: string;
    prd?: string;
    verbose?: boolean;
  }
): Promise<void> {
  console.log(`\n🚀 启动 Workflow: ${template}\n`);

  // 1. 获取或创建 Workflow
  const workflow = workflowEngine.fromTemplate(template);
  if (!workflow) {
    console.error(`❌ 模板不存在: ${template}`);
    console.log(`   可用模板: prd-to-code, code-review`);
    return;
  }

  // 2. 构建初始上下文
  const initialContext: Record<string, unknown> = {};

  // 如果指定了 PRD 文件，读取内容
  if (options.prd) {
    try {
      const prdContent = fs.readFileSync(options.prd, 'utf-8');
      initialContext.prd = {
        raw: prdContent,
        requirements: [],
      };
      console.log(`📄 PRD 文件已加载: ${options.prd}`);
      console.log(`   字符数: ${prdContent.length}\n`);
    } catch (error) {
      console.error(`❌ 无法读取 PRD 文件: ${options.prd}`);
      return;
    }
  }

  // 如果指定了 input JSON
  if (options.input) {
    try {
      const inputJson = JSON.parse(options.input);
      Object.assign(initialContext, inputJson);
      console.log(`📥 输入上下文已加载`);
    } catch {
      console.error(`❌ 无效的 JSON 格式: ${options.input}`);
      return;
    }
  }

  // 3. 验证 Workflow
  const validation = workflowEngine.validate(workflow);
  if (!validation.valid) {
    console.error(`❌ Workflow 验证失败:`);
    for (const error of validation.errors) {
      console.error(`   - ${error}`);
    }
    return;
  }

  // 4. 显示执行计划
  console.log(`📋 执行计划:`);
  for (const stage of workflow.stages) {
    const agent = stage.agent;
    console.log(`   ${workflow.stages.indexOf(stage) + 1}. ${stage.name}`);
    console.log(`      Agent: ${agent.name} (${agent.specialty})`);
    console.log(`      Tools: ${agent.tools.join(', ') || '无'}`);
    console.log();
  }

  // 5. 确认执行
  console.log(`⏳ 开始执行...\n`);

  // 6. 执行 Workflow
  const startTime = Date.now();

  const result = await workflowEngine.execute(workflow, initialContext, {
    verbose: options.verbose,
    onStageStart: (stage: Stage) => {
      console.log(`\n▶ Stage: ${stage.name}`);
    },
    onStageComplete: (stageResult: StageExecutionResult) => {
      const icon =
        stageResult.status === 'completed' ? '✅' : stageResult.status === 'skipped' ? '⏭️' : '❌';
      console.log(`   ${icon} 完成 (${stageResult.duration}ms)`);
      if (options.verbose && stageResult.output) {
        console.log(
          `   输出:`,
          JSON.stringify(stageResult.output, null, 2).split('\n').slice(0, 5).join('\n')
        );
      }
    },
  });

  // 7. 显示结果
  console.log(`\n${'='.repeat(50)}`);
  console.log(`\n📊 执行结果:`);
  console.log(`   状态: ${result.status}`);
  console.log(`   总耗时: ${result.duration}ms`);
  console.log(
    `   完成 Stages: ${result.stageResults.filter((s: StageExecutionResult) => s.status === 'completed').length}/${result.stageResults.length}`
  );

  if (result.error) {
    console.log(`   错误: ${result.error}`);
  }

  // 8. 显示上下文内容
  console.log(`\n📦 上下文内容:`);
  const ctx = result.context;
  if (ctx.prd)
    console.log(
      `   - prd: { title: "${ctx.prd.title || 'N/A'}", requirements: ${ctx.prd.requirements?.length || 0} }`
    );
  if (ctx.plan) console.log(`   - plan: { tasks: ${ctx.plan.tasks?.length || 0} }`);
  if (ctx.code) console.log(`   - code: { files: ${ctx.code.files?.length || 0} }`);
  if (ctx.review)
    console.log(
      `   - review: { score: ${ctx.review.score}, issues: ${ctx.review.issues?.length || 0} }`
    );

  console.log(`\n✨ 执行完成\n`);
}
