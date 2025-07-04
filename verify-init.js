#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

console.log('🧪 验证TaskFlow AI新功能...\n');

// 检查新的模板文件是否存在
const templatesDir = path.join(__dirname, 'templates');
console.log('📁 检查模板目录:', templatesDir);

if (fs.existsSync(templatesDir)) {
  console.log('✅ 模板目录存在');

  // 检查编辑器模板
  const editorsDir = path.join(templatesDir, 'editors');
  if (fs.existsSync(editorsDir)) {
    console.log('✅ 编辑器模板目录存在');

    const editors = ['cursor', 'vscode', 'vim', 'zed'];
    editors.forEach(editor => {
      const editorDir = path.join(editorsDir, editor);
      if (fs.existsSync(editorDir)) {
        console.log(`  ✅ ${editor} 模板存在`);
      } else {
        console.log(`  ❌ ${editor} 模板缺失`);
      }
    });
  } else {
    console.log('❌ 编辑器模板目录不存在');
  }

  // 检查项目模板
  const projectsDir = path.join(templatesDir, 'projects');
  if (fs.existsSync(projectsDir)) {
    console.log('✅ 项目模板目录存在');

    const projects = ['web-app', 'api'];
    projects.forEach(project => {
      const projectDir = path.join(projectsDir, project);
      if (fs.existsSync(projectDir)) {
        console.log(`  ✅ ${project} 项目模板存在`);
      } else {
        console.log(`  ❌ ${project} 项目模板缺失`);
      }
    });
  } else {
    console.log('❌ 项目模板目录不存在');
  }
} else {
  console.log('❌ 模板目录不存在');
}

// 检查新的源代码文件
const srcDir = path.join(__dirname, 'src', 'core', 'templates');
console.log('\n📁 检查源代码目录:', srcDir);

if (fs.existsSync(srcDir)) {
  console.log('✅ 模板源代码目录存在');

  const files = ['project-template-manager.ts', 'editor-config-generator.ts'];
  files.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file} 存在`);
    } else {
      console.log(`  ❌ ${file} 缺失`);
    }
  });
} else {
  console.log('❌ 模板源代码目录不存在');
}

// 检查构建输出
const distDir = path.join(__dirname, 'dist');
console.log('\n📁 检查构建输出:', distDir);

if (fs.existsSync(distDir)) {
  console.log('✅ 构建输出目录存在');

  const distFiles = fs.readdirSync(distDir);
  console.log('📄 构建文件:', distFiles);
} else {
  console.log('❌ 构建输出目录不存在');
}

console.log('\n🎉 验证完成！');
console.log('\n💡 新功能包括:');
console.log('  - AI编辑器配置自动生成 (Cursor, VSCode, Vim, Zed)');
console.log('  - 项目模板系统 (web-app, api, mobile, ai-ml)');
console.log('  - 专业的代码规范和AI助手规则');
console.log('  - 多模型AI支持和智能编排');
console.log('  - 增强的CLI命令和配置管理');
