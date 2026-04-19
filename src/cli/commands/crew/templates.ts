/**
 * taskflow crew templates - 显示所有内置模板详情
 */

import { workflowEngine } from '../../../core/crew';

export async function executeTemplates(): Promise<void> {
  const templates = workflowEngine.getTemplates();

  console.log('\n📚 TaskFlow AI 内置 Workflow 模板\n');
  console.log('='.repeat(60));

  for (const template of templates) {
    console.log(`\n📌 ${template.name}`);
    console.log(`   ${template.description}`);
    console.log(`\n   分类: ${template.category}`);
    console.log(`   Stages: ${template.stages.length}\n`);

    console.log('   执行流程:');
    for (let i = 0; i < template.stages.length; i++) {
      const stage = template.stages[i];
      const arrow = i === 0 ? '▶' : '→';
      console.log(`   ${arrow} [${i + 1}] ${stage.name} (${stage.agent.specialty})`);
      console.log(`       ${stage.agent.description || '无描述'}`);
      if (stage.agent.tools.length > 0) {
        console.log(`       工具: ${stage.agent.tools.join(', ')}`);
      }
    }

    console.log('\n' + '-'.repeat(60));
  }

  console.log('\n💡 使用示例:');
  console.log('   taskflow crew run prd-to-code --prd ./docs/prd.md');
  console.log('   taskflow crew create my-workflow --template prd-to-code');
  console.log('');
}
