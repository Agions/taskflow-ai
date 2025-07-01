#!/usr/bin/env node

/**
 * 测试init命令功能
 */

const fs = require('fs-extra');
const path = require('path');

// 模拟init命令的核心功能
async function testInit() {
  const targetDir = '/tmp/test-taskflow';
  
  console.log('🚀 开始测试TaskFlow AI初始化功能...');
  
  // 确保目录存在
  fs.ensureDirSync(targetDir);
  
  // 创建项目目录结构
  const dirs = ['tasks', 'tests', 'docs', '.vscode', '.cursor'];
  for (const dir of dirs) {
    const dirPath = path.join(targetDir, dir);
    fs.ensureDirSync(dirPath);
    console.log(`✅ 创建目录: ${dir}`);
  }
  
  // 生成Cursor配置
  await generateCursorConfig(targetDir);
  
  // 生成VSCode配置
  await generateVSCodeConfig(targetDir);
  
  // 生成开发配置
  await generateDevConfigs(targetDir);
  
  // 生成示例文件
  await generateExampleFiles(targetDir);
  
  console.log(`\n🎉 TaskFlow AI项目初始化完成！`);
  console.log(`📁 项目位置: ${targetDir}`);
  console.log(`\n📋 生成的文件:`);
  
  // 列出生成的文件
  const files = await listGeneratedFiles(targetDir);
  files.forEach(file => console.log(`   ${file}`));
}

async function generateCursorConfig(targetDir) {
  const cursorDir = path.join(targetDir, '.cursor');
  
  // Cursor Rules
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
  
  console.log('✅ 生成Cursor配置文件');
}

async function generateVSCodeConfig(targetDir) {
  const vscodeDir = path.join(targetDir, '.vscode');
  
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
    "prettier.semi": true
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
      "github.copilot",
      "github.copilot-chat"
    ]
  };
  
  fs.writeFileSync(
    path.join(vscodeDir, 'extensions.json'),
    JSON.stringify(extensions, null, 2)
  );
  
  console.log('✅ 生成VSCode配置文件');
}

async function generateDevConfigs(targetDir) {
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
      "prefer-const": "error",
      "no-var": "error"
    }
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
    "tabWidth": 2
  };
  
  fs.writeFileSync(
    path.join(targetDir, '.prettierrc.json'),
    JSON.stringify(prettierConfig, null, 2)
  );
  
  // Git ignore
  const gitignore = `# Dependencies
node_modules/

# Build outputs
dist/
build/

# Environment files
.env
.env.local

# Logs
*.log

# IDE files
.vscode/
.cursor/
.idea/

# OS files
.DS_Store
Thumbs.db
`;
  
  fs.writeFileSync(path.join(targetDir, '.gitignore'), gitignore);
  
  console.log('✅ 生成开发配置文件');
}

async function generateExampleFiles(targetDir) {
  // 示例PRD文档
  const examplePrd = `# TaskFlow AI 示例项目需求文档

## 1. 项目概述
本项目旨在开发一个智能任务管理系统，帮助团队更好地组织和跟踪项目进度。

## 2. 功能需求

### 2.1 用户管理模块
- **用户注册**: 用户可以通过邮箱和密码注册账号
- **用户登录**: 用户可以使用注册的账号登录系统
- **密码重置**: 用户可以通过邮箱重置密码

### 2.2 项目管理模块
- **创建项目**: 用户可以创建新的项目
- **项目设置**: 用户可以编辑项目信息和设置

### 2.3 任务管理模块
- **任务创建**: 用户可以创建和分配任务
- **任务跟踪**: 实时跟踪任务进度和状态

## 3. 非功能需求
- **性能**: 页面加载时间不超过3秒
- **安全**: 用户密码必须加密存储
- **兼容性**: 支持主流浏览器的最新版本
`;
  
  fs.writeFileSync(path.join(targetDir, 'docs', 'example.md'), examplePrd);
  
  // README文件
  const readme = `# TaskFlow AI 示例项目

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

## 功能特性

- 📄 **智能PRD解析**: 自动提取需求和任务
- 🎯 **任务管理**: 完整的任务生命周期管理
- 🤖 **AI助手**: 智能任务分析和建议
- 📊 **进度跟踪**: 实时项目进度监控

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
`;
  
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);
  
  // 配置文件
  const config = {
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
        }
      }
    }
  };
  
  fs.writeFileSync(
    path.join(targetDir, 'taskflow.config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log('✅ 生成示例文件');
}

async function listGeneratedFiles(targetDir) {
  const files = [];
  
  function walkDir(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(targetDir, fullPath);
      
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(`📁 ${prefix}${item}/`);
        walkDir(fullPath, prefix + '  ');
      } else {
        files.push(`📄 ${prefix}${item}`);
      }
    });
  }
  
  walkDir(targetDir);
  return files;
}

// 运行测试
testInit().catch(console.error);
