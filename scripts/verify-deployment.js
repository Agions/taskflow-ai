#!/usr/bin/env node

/**
 * TaskFlow AI 部署验证脚本
 * 作为资深全栈工程师，确保部署后的文档样式和功能正确
 */

const https = require('https');
const fs = require('fs');

const SITE_URL = 'https://agions.github.io/taskflow-ai/';
const EXPECTED_FEATURES = [
  '指南',
  'API参考', 
  '用户手册',
  '技术参考',
  '更多'
];

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 开始验证TaskFlow AI文档部署...');
  console.log(`📍 验证URL: ${SITE_URL}`);
  
  try {
    // 获取首页内容
    const html = await fetchPage(SITE_URL);
    
    // 验证基本内容
    console.log('\n📋 验证基本内容:');
    if (html.includes('TaskFlow AI')) {
      console.log('✅ 网站标题正确');
    } else {
      console.log('❌ 网站标题缺失');
    }
    
    if (html.includes('智能PRD文档解析与任务管理助手')) {
      console.log('✅ 网站描述正确');
    } else {
      console.log('❌ 网站描述缺失');
    }
    
    // 验证导航功能
    console.log('\n🧭 验证导航功能:');
    let navigationScore = 0;
    EXPECTED_FEATURES.forEach(feature => {
      if (html.includes(feature)) {
        console.log(`✅ 导航项存在: ${feature}`);
        navigationScore++;
      } else {
        console.log(`❌ 导航项缺失: ${feature}`);
      }
    });
    
    // 验证专业样式
    console.log('\n🎨 验证专业样式:');
    if (html.includes('logo.svg')) {
      console.log('✅ Logo资源正确');
    } else {
      console.log('❌ Logo资源缺失');
    }
    
    if (html.includes('vitepress')) {
      console.log('✅ VitePress框架正确');
    } else {
      console.log('❌ VitePress框架问题');
    }
    
    // 验证响应式设计
    if (html.includes('viewport')) {
      console.log('✅ 响应式设计配置正确');
    } else {
      console.log('❌ 响应式设计配置缺失');
    }
    
    // 计算总体评分
    const totalFeatures = EXPECTED_FEATURES.length;
    const navigationPercentage = (navigationScore / totalFeatures) * 100;
    
    console.log('\n📊 部署验证结果:');
    console.log(`🧭 导航完整性: ${navigationScore}/${totalFeatures} (${navigationPercentage.toFixed(1)}%)`);
    
    if (navigationPercentage >= 80) {
      console.log('🎉 部署验证通过 - 专业样式正确');
      process.exit(0);
    } else if (navigationPercentage >= 60) {
      console.log('⚠️ 部署验证警告 - 部分功能缺失');
      process.exit(1);
    } else {
      console.log('❌ 部署验证失败 - 样式问题严重');
      process.exit(2);
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
    process.exit(3);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyDeployment();
}

module.exports = { verifyDeployment };
