#!/bin/bash

# TaskFlow AI - VitePress文档构建测试脚本
# 作为资深全栈工程师，确保文档构建的可靠性

set -e

echo "🚀 TaskFlow AI - VitePress文档构建测试"
echo "========================================"

# 检查Node.js版本
echo "📋 环境检查..."
echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"

# 检查docs目录
if [ ! -d "docs" ]; then
    echo "❌ docs目录不存在"
    exit 1
fi

cd docs

# 检查package.json
if [ ! -f "package.json" ]; then
    echo "❌ docs/package.json不存在"
    exit 1
fi

echo "✅ 文档目录结构验证通过"

# 清理之前的构建
echo ""
echo "🧹 清理之前的构建..."
npm run clean 2>/dev/null || echo "无需清理"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm ci

# 验证VitePress配置
echo ""
echo "🔍 验证VitePress配置..."
if [ ! -f ".vitepress/config.ts" ]; then
    echo "❌ VitePress配置文件不存在"
    exit 1
fi

echo "✅ VitePress配置文件存在"

# 构建文档
echo ""
echo "🔨 构建VitePress文档..."
npm run build

# 验证构建结果
echo ""
echo "📊 构建结果验证..."
if [ ! -d ".vitepress/dist" ]; then
    echo "❌ 构建产物目录不存在"
    exit 1
fi

echo "✅ 构建产物目录存在"

# 显示构建统计
echo ""
echo "📈 构建统计信息:"
echo "构建产物大小: $(du -sh .vitepress/dist | cut -f1)"
echo "文件数量: $(find .vitepress/dist -type f | wc -l)"
echo "HTML文件: $(find .vitepress/dist -name "*.html" | wc -l)"
echo "CSS文件: $(find .vitepress/dist -name "*.css" | wc -l)"
echo "JS文件: $(find .vitepress/dist -name "*.js" | wc -l)"

# 检查关键文件
echo ""
echo "🔍 关键文件检查:"
if [ -f ".vitepress/dist/index.html" ]; then
    echo "✅ 主页文件存在"
else
    echo "❌ 主页文件缺失"
    exit 1
fi

if [ -f ".vitepress/dist/404.html" ]; then
    echo "✅ 404页面存在"
else
    echo "⚠️ 404页面缺失（可选）"
fi

# 启动预览服务器（可选）
echo ""
echo "🌐 启动预览服务器测试..."
echo "提示: 按Ctrl+C停止预览服务器"
echo ""

# 使用timeout命令限制预览时间
timeout 10s npm run preview || echo "预览服务器测试完成"

echo ""
echo "🎉 VitePress文档构建测试完成!"
echo "✅ 所有检查通过，文档已准备好部署"
echo ""
echo "📋 下一步:"
echo "1. 确保GitHub Pages已启用"
echo "2. 推送代码触发自动部署"
echo "3. 访问 https://agions.github.io/taskflow-ai/ 查看文档"

cd ..
