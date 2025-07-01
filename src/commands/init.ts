import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ConfigManager } from '../infra/config';

/**
 * 初始化项目命令
 * @param program Commander实例
 */
export default function initCommand(program: Command): void {
  program
    .command('init [directory]')
    .description('初始化一个新的TaskFlow AI项目')
    .option('-f, --force', '强制初始化，覆盖已存在的配置')
    .option('-t, --template <template>', '使用指定的模板初始化')
    .option('--editor <editor>', '指定AI编辑器类型 (cursor, vscode, all)', 'all')
    .option('--no-examples', '不创建示例文件')
    .action(async (directory = '.', options) => {
      try {
        const spinner = ora('正在初始化MCP项目...').start();

        // 确定目标目录的绝对路径
        const targetDir = path.resolve(process.cwd(), directory);

        // 检查目录是否存在，如果不存在则创建
        if (!fs.existsSync(targetDir)) {
          spinner.text = `目录 ${targetDir} 不存在，正在创建...`;
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 检查是否已经存在配置文件
        const configPath = path.join(targetDir, 'mcp.config.json');
        if (fs.existsSync(configPath) && !options.force) {
          spinner.stop();
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: '项目配置文件已存在，是否覆盖?',
              default: false,
            },
          ]);

          if (!overwrite) {
            console.log(chalk.yellow('初始化已取消'));
            return;
          }
          spinner.start('正在覆盖已有配置...');
        }

        // 创建配置管理器并初始化项目配置
        const configManager = new ConfigManager();
        configManager.initProjectConfig(targetDir);

        // 创建项目目录结构
        const dirs = ['tasks', 'tests', 'docs', '.vscode'];
        for (const dir of dirs) {
          const dirPath = path.join(targetDir, dir);
          fs.ensureDirSync(dirPath);
        }

        // 生成AI编辑器配置文件
        await generateEditorConfigs(targetDir, options.editor, spinner);

        // 创建示例文档
        if (options.examples !== false) {
          if (options.template) {
            // 使用指定的模板初始化
            spinner.text = `正在使用模板 ${options.template} 初始化项目...`;
            await generateTemplateFiles(targetDir, options.template);
          } else {
            // 创建默认的示例文档
            await generateExampleFiles(targetDir);
          }
        }

        spinner.succeed(`TaskFlow AI项目初始化完成，位于 ${chalk.green(targetDir)}`);
        console.log(`
${chalk.cyan('后续步骤:')}
1. ${chalk.yellow(`cd ${directory}`)} (如果您初始化到了新目录)
2. ${chalk.yellow('taskflow config')} 配置您的模型API密钥
3. ${chalk.yellow('taskflow parse ./docs/example.md')} 解析示例PRD文档
4. ${chalk.yellow('taskflow plan')} 生成任务计划
5. ${chalk.yellow('taskflow interactive')} 启动交互式模式

${chalk.cyan('AI编辑器配置:')}
- Cursor: 已生成 .cursor/ 配置文件
- VSCode: 已生成 .vscode/ 配置文件
- 代码规范: 已配置 ESLint 和 Prettier
        `);
      } catch (error) {
        ora().fail(`初始化失败: ${(error as Error).message}`);
        if (program.opts().debug) {
          console.error(error);
        }
      }
    });
}

/**
 * 生成AI编辑器配置文件
 */
async function generateEditorConfigs(targetDir: string, editorType: string, spinner: any): Promise<void> {
  spinner.text = '正在生成AI编辑器配置文件...';

  // 生成 Cursor 配置
  if (editorType === 'cursor' || editorType === 'all') {
    await generateCursorConfig(targetDir);
  }

  // 生成 VSCode 配置
  if (editorType === 'vscode' || editorType === 'all') {
    await generateVSCodeConfig(targetDir);
  }

  // 生成通用开发配置
  await generateDevConfigs(targetDir);
}

/**
 * 生成 Cursor 编辑器配置
 */
async function generateCursorConfig(targetDir: string): Promise<void> {
  const cursorDir = path.join(targetDir, '.cursor');
  fs.ensureDirSync(cursorDir);

  // Cursor Rules 配置
  const cursorRules = `# Cursor AI 编程助手规则

## 项目概述
这是一个 TaskFlow AI 项目，专注于PRD文档解析和任务管理的AI助手。

## 编程规范
1. 使用 TypeScript 进行开发
2. 遵循 ESLint 和 Prettier 配置
3. 优先使用函数式编程风格
4. 确保类型安全，避免使用 any
5. 编写清晰的注释和文档

## 架构原则
1. 模块化设计，职责分离
2. 依赖注入，便于测试
3. 错误处理要完善
4. 日志记录要详细

## AI 助手指导
1. 在修改代码时，请先理解现有架构
2. 保持代码风格一致性
3. 添加适当的类型注解
4. 考虑性能和可维护性
5. 遵循现有的设计模式

## 测试要求
1. 为新功能编写单元测试
2. 确保测试覆盖率
3. 使用 Jest 作为测试框架
4. 模拟外部依赖

## 文档要求
1. 为公共API编写JSDoc注释
2. 更新README文档
3. 记录重要的设计决策
`;

  fs.writeFileSync(path.join(cursorDir, 'rules.md'), cursorRules);

  // Cursor 设置
  const cursorSettings = {
    "cursor.general.enableCodeActions": true,
    "cursor.general.enableInlineCompletion": true,
    "cursor.chat.enableCodeContext": true,
    "cursor.chat.enableProjectContext": true,
    "cursor.ai.model": "claude-3.5-sonnet",
    "cursor.ai.enableAutoComplete": true,
    "cursor.ai.enableInlineEdit": true
  };

  fs.writeFileSync(
    path.join(cursorDir, 'settings.json'),
    JSON.stringify(cursorSettings, null, 2)
  );
}

/**
 * 生成 VSCode 编辑器配置
 */
async function generateVSCodeConfig(targetDir: string): Promise<void> {
  const vscodeDir = path.join(targetDir, '.vscode');
  fs.ensureDirSync(vscodeDir);

  // VSCode 设置
  const vscodeSettings = {
    "typescript.preferences.noSemicolons": "off",
    "typescript.preferences.quoteStyle": "single",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true,
      "source.organizeImports": true
    },
    "eslint.validate": ["typescript", "javascript"],
    "prettier.singleQuote": true,
    "prettier.trailingComma": "es5",
    "prettier.semi": true,
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.git": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true
    }
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(vscodeSettings, null, 2)
  );

  // VSCode 扩展推荐
  const extensions = {
    "recommendations": [
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "dbaeumer.vscode-eslint",
      "bradlc.vscode-tailwindcss",
      "ms-vscode.vscode-json",
      "redhat.vscode-yaml",
      "ms-vscode.test-adapter-converter",
      "hbenl.vscode-test-explorer",
      "github.copilot",
      "github.copilot-chat",
      "ms-vscode.vscode-ai"
    ]
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'extensions.json'),
    JSON.stringify(extensions, null, 2)
  );

  // VSCode 任务配置
  const tasks = {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "build",
        "type": "npm",
        "script": "build",
        "group": "build",
        "presentation": {
          "echo": true,
          "reveal": "silent",
          "focus": false,
          "panel": "shared"
        }
      },
      {
        "label": "test",
        "type": "npm",
        "script": "test",
        "group": "test",
        "presentation": {
          "echo": true,
          "reveal": "always",
          "focus": false,
          "panel": "shared"
        }
      },
      {
        "label": "lint",
        "type": "npm",
        "script": "lint",
        "group": "build",
        "presentation": {
          "echo": true,
          "reveal": "silent",
          "focus": false,
          "panel": "shared"
        }
      }
    ]
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'tasks.json'),
    JSON.stringify(tasks, null, 2)
  );

  // VSCode 启动配置
  const launch = {
    "version": "0.2.0",
    "configurations": [
      {
        "name": "Debug TaskFlow",
        "type": "node",
        "request": "launch",
        "program": "${workspaceFolder}/dist/index.js",
        "outFiles": ["${workspaceFolder}/dist/**/*.js"],
        "env": {
          "NODE_ENV": "development"
        },
        "console": "integratedTerminal",
        "internalConsoleOptions": "neverOpen"
      },
      {
        "name": "Debug Tests",
        "type": "node",
        "request": "launch",
        "program": "${workspaceFolder}/node_modules/.bin/jest",
        "args": ["--runInBand"],
        "console": "integratedTerminal",
        "internalConsoleOptions": "neverOpen"
      }
    ]
  };

  fs.writeFileSync(
    path.join(vscodeDir, 'launch.json'),
    JSON.stringify(launch, null, 2)
  );
}

/**
 * 生成通用开发配置文件
 */
async function generateDevConfigs(targetDir: string): Promise<void> {
  // ESLint 配置
  const eslintConfig = {
    "env": {
      "node": true,
      "es2021": true,
      "jest": true
    },
    "extends": [
      "eslint:recommended",
      "@typescript-eslint/recommended",
      "prettier"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
      "ecmaVersion": 12,
      "sourceType": "module",
      "project": "./tsconfig.json"
    },
    "plugins": ["@typescript-eslint"],
    "rules": {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "prefer-const": "error",
      "no-var": "error"
    },
    "ignorePatterns": ["dist/", "node_modules/", "*.js"]
  };

  fs.writeFileSync(
    path.join(targetDir, '.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  );

  // Prettier 配置
  const prettierConfig = {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false,
    "bracketSpacing": true,
    "arrowParens": "avoid"
  };

  fs.writeFileSync(
    path.join(targetDir, '.prettierrc.json'),
    JSON.stringify(prettierConfig, null, 2)
  );

  // Prettier ignore 文件
  const prettierIgnore = `# Dependencies
node_modules/

# Build outputs
dist/
build/

# Logs
*.log

# Environment files
.env
.env.local
.env.production

# IDE files
.vscode/
.cursor/

# OS files
.DS_Store
Thumbs.db
`;

  fs.writeFileSync(path.join(targetDir, '.prettierignore'), prettierIgnore);

  // Git ignore 文件
  const gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# IDE files
.vscode/
.cursor/
.idea/
*.swp
*.swo

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp

# Config files with sensitive data
config/local.json
config/production.json
`;

  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignore);

  // EditorConfig 文件
  const editorConfig = `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[*.json]
indent_size = 2
`;

  fs.writeFileSync(path.join(targetDir, '.editorconfig'), editorConfig);
}

/**
 * 生成示例文件
 */
async function generateExampleFiles(targetDir: string): Promise<void> {
  // 示例PRD文档
  const examplePrdContent = `# TaskFlow AI 示例项目需求文档

## 1. 项目概述

### 1.1 项目背景
本项目旨在开发一个智能任务管理系统，帮助团队更好地组织和跟踪项目进度。

### 1.2 项目目标
- 提供直观的任务管理界面
- 支持多人协作
- 智能任务分配和优先级排序
- 实时进度跟踪和报告

## 2. 功能需求

### 2.1 用户管理模块

#### 2.1.1 用户注册
- **功能描述**: 用户可以通过邮箱和密码注册账号
- **验收标准**:
  - 邮箱格式验证
  - 密码强度检查
  - 邮箱验证流程
- **优先级**: 高
- **预估工时**: 8小时

#### 2.1.2 用户登录
- **功能描述**: 用户可以使用注册的账号登录系统
- **验收标准**:
  - 支持邮箱/用户名登录
  - 记住登录状态
  - 登录失败提示
- **优先级**: 高
- **预估工时**: 4小时

#### 2.1.3 密码重置
- **功能描述**: 用户可以通过邮箱重置密码
- **验收标准**:
  - 邮箱验证
  - 安全的重置链接
  - 密码更新确认
- **优先级**: 中
- **预估工时**: 6小时

### 2.2 项目管理模块

#### 2.2.1 创建项目
- **功能描述**: 用户可以创建新的项目
- **验收标准**:
  - 项目基本信息填写
  - 项目成员邀请
  - 项目模板选择
- **优先级**: 高
- **预估工时**: 12小时

#### 2.2.2 项目设置
- **功能描述**: 用户可以编辑项目信息和设置
- **验收标准**:
  - 项目信息修改
  - 成员权限管理
  - 项目归档/删除
- **优先级**: 中
- **预估工时**: 8小时

### 2.3 任务管理模块

#### 2.3.1 任务创建
- **功能描述**: 用户可以创建和分配任务
- **验收标准**:
  - 任务详情填写
  - 任务分配给成员
  - 设置截止日期
  - 任务优先级设置
- **优先级**: 高
- **预估工时**: 10小时

#### 2.3.2 任务跟踪
- **功能描述**: 实时跟踪任务进度和状态
- **验收标准**:
  - 任务状态更新
  - 进度百分比显示
  - 任务评论和附件
- **优先级**: 高
- **预估工时**: 8小时

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间不超过3秒
- 支持1000+并发用户
- 数据库查询响应时间<500ms

### 3.2 安全要求
- 用户密码必须加密存储
- 支持HTTPS协议
- 实现RBAC权限控制
- 数据备份和恢复机制

### 3.3 兼容性要求
- 支持主流浏览器的最新版本
- 响应式设计，支持移动端
- 支持多语言国际化

## 4. 技术架构

### 4.1 前端技术栈
- React 18
- TypeScript
- Tailwind CSS
- React Query

### 4.2 后端技术栈
- Node.js
- Express
- TypeScript
- PostgreSQL
- Redis

### 4.3 部署架构
- Docker容器化
- Kubernetes编排
- CI/CD自动化部署
`;

  fs.writeFileSync(path.join(targetDir, 'docs', 'example.md'), examplePrdContent);

  // 示例配置文件
  const exampleConfig = {
    "project": {
      "name": "TaskFlow AI 示例项目",
      "version": "1.0.0",
      "description": "智能任务管理系统示例项目"
    },
    "ai": {
      "defaultProvider": "deepseek",
      "providers": {
        "deepseek": {
          "enabled": false,
          "apiKey": "your-deepseek-api-key"
        },
        "zhipu": {
          "enabled": false,
          "apiKey": "your-zhipu-api-key"
        }
      }
    },
    "features": {
      "autoTaskGeneration": true,
      "smartPrioritization": true,
      "progressTracking": true
    }
  };

  fs.writeFileSync(
    path.join(targetDir, 'taskflow.config.json'),
    JSON.stringify(exampleConfig, null, 2)
  );

  // README 文件
  const readmeContent = `# TaskFlow AI 示例项目

这是一个使用 TaskFlow AI 创建的示例项目，展示了如何从PRD文档自动生成任务计划。

## 快速开始

1. **配置API密钥**
   \`\`\`bash
   taskflow config
   \`\`\`

2. **解析PRD文档**
   \`\`\`bash
   taskflow parse ./docs/example.md
   \`\`\`

3. **生成任务计划**
   \`\`\`bash
   taskflow plan
   \`\`\`

4. **启动交互模式**
   \`\`\`bash
   taskflow interactive
   \`\`\`

## 项目结构

\`\`\`
├── docs/              # 文档目录
│   └── example.md     # 示例PRD文档
├── tasks/             # 任务文件目录
├── tests/             # 测试文件目录
├── .cursor/           # Cursor AI 配置
├── .vscode/           # VSCode 配置
└── taskflow.config.json # TaskFlow 配置文件
\`\`\`

## 功能特性

- 📄 **智能PRD解析**: 自动提取需求和任务
- 🎯 **任务管理**: 完整的任务生命周期管理
- 🤖 **AI助手**: 智能任务分析和建议
- 📊 **进度跟踪**: 实时项目进度监控
- 🔄 **任务编排**: 智能依赖分析和排序

## 开发指南

### 环境要求
- Node.js 16+
- TypeScript 4.5+

### 开发命令
\`\`\`bash
npm run dev      # 开发模式
npm run build    # 构建项目
npm run test     # 运行测试
npm run lint     # 代码检查
\`\`\`

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
`;

  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent);
}

/**
 * 生成模板文件
 */
async function generateTemplateFiles(targetDir: string, template: string): Promise<void> {
  // TODO: 实现不同模板的生成逻辑
  // 目前先使用默认示例
  await generateExampleFiles(targetDir);
}