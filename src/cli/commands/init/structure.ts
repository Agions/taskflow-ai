/**
 * 项目结构创建
 */

import path from 'path';
import fs from 'fs-extra';
import { TaskFlowConfig } from '../../../types';
import { CONFIG_DIR, DEFAULT_CONFIG } from '../../../constants';

const DIRS = [
  CONFIG_DIR,
  path.join(CONFIG_DIR, 'cache'),
  path.join(CONFIG_DIR, 'logs'),
  path.join(CONFIG_DIR, 'templates'),
  path.join(CONFIG_DIR, 'plugins'),
  'docs',
  'output',
  'reports',
];

/**
 * 创建项目结构
 */
export async function createProjectStructure(_config: TaskFlowConfig): Promise<void> {
  const baseDir = process.cwd();

  for (const dir of DIRS) {
    await fs.ensureDir(path.join(baseDir, dir));
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config: TaskFlowConfig): Promise<void> {
  const configPath = path.join(process.cwd(), CONFIG_DIR, 'config.json');
  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * 创建示例文件
 */
export async function createExampleFiles(projectName: string = DEFAULT_CONFIG.projectName): Promise<void> {
  const examplePRD = `# 示例PRD文档

## 项目概述
这是一个示例的产品需求文档，用于演示TaskFlow AI的功能。

## 功能需求

### 1. 用户管理
- 用户注册
- 用户登录
- 用户信息管理

### 2. 数据管理
- 数据录入
- 数据查询
- 数据导出

## 验收标准
- [ ] 用户可以成功注册账号
- [ ] 用户可以使用正确的凭据登录
- [ ] 系统可以正确存储和检索用户数据
`;

  const examplePath = path.join(process.cwd(), 'docs', 'example-prd.md');
  await fs.writeFile(examplePath, examplePRD);

  const readme = `# ${projectName || 'TaskFlow Project'}

这个项目使用 TaskFlow AI 进行管理和开发。

## 快速开始

1. 解析PRD文档:
   \`\`\`bash
   taskflow parse docs/example-prd.md
   \`\`\`

2. 查看项目状态:
   \`\`\`bash
   taskflow status
   \`\`\`

3. 生成可视化报告:
   \`\`\`bash
   taskflow visualize
   \`\`\`

4. 启动MCP服务器:
   \`\`\`bash
   taskflow mcp start
   \`\`\`

## 更多信息

- [TaskFlow AI 文档](https://github.com/Agions/taskflow-ai)
- [配置文件](.taskflow/config.json)
`;

  await fs.writeFile(path.join(process.cwd(), 'README.md'), readme);
}
