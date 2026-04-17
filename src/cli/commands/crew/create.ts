/**
 * taskflow crew create - 从模板创建 Workflow
 */

import { workflowEngine } from '../../../core/crew';
import { Logger } from '../../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = Logger.getInstance('crew:create');

export async function executeCreate(
  name: string,
  options: {
    template?: string;
    output?: string;
  }
): Promise<void> {
  console.log(`\n🔧 创建 Workflow: ${name}\n`);

  // 1. 获取模板
  const templateName = options.template || 'prd-to-code';
  const workflow = workflowEngine.fromTemplate(templateName);

  if (!workflow) {
    console.error(`❌ 模板不存在: ${templateName}`);
    return;
  }

  // 2. 修改名称
  workflow.id = `workflow-${Date.now()}`;
  workflow.name = name;

  // 3. 生成 YAML
  const yaml = workflowEngine.toYAML(workflow);

  // 4. 输出
  if (options.output) {
    const outputPath = options.output;
    fs.writeFileSync(outputPath, yaml, 'utf-8');
    console.log(`✅ Workflow 已保存: ${outputPath}`);
  } else {
    console.log('📄 Workflow YAML:\n');
    console.log(yaml);
  }

  console.log('\n💡 使用 "taskflow crew run" 运行此工作流\n');
}
