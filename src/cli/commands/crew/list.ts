/**
 * taskflow crew list - 列出所有 Workflow 模板
 */

import { workflowEngine } from '../../../core/crew';
import { Logger } from '../../../utils/logger';

const logger = Logger.getInstance('crew:list');

export async function executeList(options: { verbose?: boolean }): Promise<void> {
  const templates = workflowEngine.getTemplates();

  console.log('\n📋 可用的 Workflow 模板:\n');

  for (const template of templates) {
    console.log(`  ┌─ ${template.name}`);
    console.log(`  │  描述: ${template.description}`);
    console.log(`  │  分类: ${template.category}`);
    console.log(`  │  Stages: ${template.stages.length}`);

    if (options.verbose) {
      console.log(`  │`);
      for (const stage of template.stages) {
        console.log(`  │    → ${stage.name} (${stage.agent.specialty})`);
      }
    }

    console.log(`  └─────────────────────────────────────`);
    console.log();
  }

  console.log(`共 ${templates.length} 个模板\n`);
  console.log('使用 "taskflow crew run <template>" 运行模板\n');
}
