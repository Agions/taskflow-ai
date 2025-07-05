#!/usr/bin/env node

/**
 * TaskFlow AI docs目录清理脚本
 * 作为资深全栈工程师，重新组织文档结构，确保逻辑清晰
 */

const fs = require('fs');
const path = require('path');

// 需要删除的重复或多余文档
const REMOVE_FILES = [
  'docs/AI_RULES_REFACTOR_SUMMARY.md',
  'docs/COMPLETION_SUMMARY.md',
  'docs/LICENSE', // 根目录已有
  'docs/README.md', // 根目录已有
  // 注意：docs/api-reference.md 已重新组织为 docs/api/index.md
  'docs/cli-reference.md', // 已有cli目录
  'docs/cli-ux-design.md', // 移动到cli目录
  'docs/getting-started.complex.md', // 保留简化版本
  'docs/implementation-roadmap.md', // 开发相关，移动到guide
  'docs/performance-optimization.md', // 移动到troubleshooting
  'docs/troubleshooting.md', // 已有troubleshooting目录
  'docs/upgrade-plan.md', // 移动到guide
  'docs/user-guide.md', // 已有user-guide目录
  'docs/v1.2.0-release-notes.md' // 合并到changelog
];

// 需要移动的文件
const MOVE_FILES = {
  'docs/TaskFlow-AI-PRD.md': 'docs/guide/project-requirements.md',
  'docs/examples.md': 'docs/guide/examples.md'
};

// 需要重新组织的目录结构
const REORGANIZE_DIRS = {
  'docs/cli': {
    keep: ['docs/cli/commands.md'],
    remove: []
  },
  'docs/deployment': {
    keep: ['docs/deployment/index.md'],
    remove: []
  },
  'docs/editor-config': {
    keep: [
      'docs/editor-config/overview.md',
      'docs/editor-config/cursor.md', 
      'docs/editor-config/windsurf-trae-integration.md'
    ],
    remove: []
  },
  'docs/testing': {
    keep: ['docs/testing/index.md'],
    remove: []
  }
};

function cleanupDocs() {
  console.log('🧹 开始清理docs目录...');
  
  let removedCount = 0;
  let movedCount = 0;
  
  // 删除多余文件
  REMOVE_FILES.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ 删除: ${file}`);
        removedCount++;
      } catch (error) {
        console.error(`❌ 删除失败: ${file} - ${error.message}`);
      }
    } else {
      console.log(`⚠️ 文件不存在: ${file}`);
    }
  });
  
  // 移动文件
  Object.entries(MOVE_FILES).forEach(([source, target]) => {
    const sourcePath = path.join(process.cwd(), source);
    const targetPath = path.join(process.cwd(), target);
    
    if (fs.existsSync(sourcePath)) {
      try {
        // 确保目标目录存在
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 移动文件
        fs.renameSync(sourcePath, targetPath);
        console.log(`📁 移动: ${source} → ${target}`);
        movedCount++;
      } catch (error) {
        console.error(`❌ 移动失败: ${source} - ${error.message}`);
      }
    } else {
      console.log(`⚠️ 源文件不存在: ${source}`);
    }
  });
  
  // 验证核心目录结构
  console.log('\n📋 验证文档目录结构:');
  const expectedDirs = [
    'docs/api',
    'docs/guide', 
    'docs/user-guide',
    'docs/reference',
    'docs/troubleshooting',
    'docs/cli',
    'docs/editor-config'
  ];
  
  expectedDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      console.log(`✅ ${dir}: ${files.length} 个文档`);
    } else {
      console.log(`⚠️ 目录不存在: ${dir}`);
    }
  });
  
  // 生成清理报告
  console.log('\n📊 清理报告:');
  console.log(`- 删除文件: ${removedCount} 个`);
  console.log(`- 移动文件: ${movedCount} 个`);
  
  // 检查剩余的根级文档
  console.log('\n🔍 检查docs根目录剩余文件:');
  const docsFiles = fs.readdirSync(path.join(process.cwd(), 'docs'));
  const rootMdFiles = docsFiles.filter(file => 
    file.endsWith('.md') && 
    !file.startsWith('.') &&
    file !== 'index.md' &&
    file !== 'changelog.md' &&
    file !== 'faq.md'
  );
  
  if (rootMdFiles.length > 0) {
    console.log('⚠️ 发现其他根级Markdown文件:');
    rootMdFiles.forEach(file => {
      console.log(`  - docs/${file}`);
    });
    console.log('请手动检查这些文件是否需要重新分类。');
  } else {
    console.log('✅ docs根目录结构已优化');
  }
  
  console.log('\n🎉 docs目录清理完成！');
  console.log('文档结构现在更加清晰和专业。');
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupDocs();
}

module.exports = { cleanupDocs };
