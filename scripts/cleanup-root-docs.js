#!/usr/bin/env node

/**
 * TaskFlow AI 根目录文档清理脚本
 * 作为资深全栈工程师，确保项目结构专业、整洁、易于维护
 */

const fs = require('fs');
const path = require('path');

// 需要保留的根目录文件
const KEEP_FILES = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'LICENSE'
];

// 需要删除的根目录文档文件
const REMOVE_FILES = [
  'API_KEY_VALIDATION_REPORT.md',
  'DEPLOY.md',
  'DEPLOYMENT_REPORT_v1.3.0.md',
  'DEPLOYMENT_SUMMARY.md',
  'ESLINT_FIXES_SUMMARY.md',
  'GITHUB_PAGES_SETUP_GUIDE.md',
  'MCP_INTEGRATION_SUMMARY.md',
  'PROJECT_STATUS.md',
  'RELEASE_CHECKLIST.md'
];

// 需要移动到docs目录的文件
const MOVE_TO_DOCS = {
  // 暂时没有需要移动的文件
};

function cleanupRootDocs() {
  console.log('🧹 开始清理根目录文档...');
  
  let removedCount = 0;
  let movedCount = 0;
  
  // 删除指定的文档文件
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
  
  // 移动文件到docs目录
  Object.entries(MOVE_TO_DOCS).forEach(([source, target]) => {
    const sourcePath = path.join(process.cwd(), source);
    const targetPath = path.join(process.cwd(), 'docs', target);
    
    if (fs.existsSync(sourcePath)) {
      try {
        // 确保目标目录存在
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 移动文件
        fs.renameSync(sourcePath, targetPath);
        console.log(`📁 移动: ${source} → docs/${target}`);
        movedCount++;
      } catch (error) {
        console.error(`❌ 移动失败: ${source} - ${error.message}`);
      }
    } else {
      console.log(`⚠️ 源文件不存在: ${source}`);
    }
  });
  
  // 验证保留的文件
  console.log('\n📋 验证保留的核心文件:');
  KEEP_FILES.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ 保留: ${file}`);
    } else {
      console.log(`⚠️ 缺失: ${file} (需要创建)`);
    }
  });
  
  // 生成清理报告
  console.log('\n📊 清理报告:');
  console.log(`- 删除文件: ${removedCount} 个`);
  console.log(`- 移动文件: ${movedCount} 个`);
  console.log(`- 保留文件: ${KEEP_FILES.length} 个`);
  
  // 检查剩余的.md文件
  console.log('\n🔍 检查剩余的Markdown文件:');
  const rootFiles = fs.readdirSync(process.cwd());
  const remainingMdFiles = rootFiles.filter(file => 
    file.endsWith('.md') && 
    !KEEP_FILES.includes(file)
  );
  
  if (remainingMdFiles.length > 0) {
    console.log('⚠️ 发现其他Markdown文件:');
    remainingMdFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
    console.log('请手动检查这些文件是否需要保留或移动。');
  } else {
    console.log('✅ 根目录Markdown文件已清理完成');
  }
  
  console.log('\n🎉 根目录清理完成！');
  console.log('项目结构现在更加专业和整洁。');
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupRootDocs();
}

module.exports = { cleanupRootDocs };
