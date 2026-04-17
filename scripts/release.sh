#!/bin/bash

# TaskFlow AI Release Script
# 用于简化版本发布流程

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查是否在 main 分支
check_branch() {
    local branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$branch" != "main" ]; then
        log_error "必须在 main 分支上发布版本"
        log_info "当前分支: $branch"
        exit 1
    fi
    log_success "分支检查通过"
}

# 检查工作区是否干净
check_working_tree() {
    if [ -n "$(git status --porcelain)" ]; then
        log_error "工作区有未提交的更改"
        git status --short
        exit 1
    fi
    log_success "工作区检查通过"
}

# 检查是否与远程同步
check_remote_sync() {
    git fetch origin main
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/main)
    
    if [ "$local_commit" != "$remote_commit" ]; then
        log_error "本地分支与远程不同步"
        log_info "请先执行: git pull origin main"
        exit 1
    fi
    log_success "远程同步检查通过"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    npm run quality
    npm test
    log_success "测试通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    npm run build
    log_success "构建完成"
}

# 更新版本号
update_version() {
    local version_type=$1
    
    log_info "更新版本号 ($version_type)..."
    npm version $version_type --no-git-tag-version
    
    local new_version=$(node -p "require('./package.json').version")
    log_success "版本号已更新: v$new_version"
    
    echo $new_version
}

# 更新 CHANGELOG
update_changelog() {
    local version=$1
    local date=$(date +%Y-%m-%d)
    
    log_info "请更新 CHANGELOG.md 中的版本 $version 说明"
    log_warning "按 Enter 继续，或 Ctrl+C 取消..."
    read
}

# 提交更改
commit_changes() {
    local version=$1
    
    log_info "提交版本更改..."
    git add package.json package-lock.json CHANGELOG.md
    git commit -m "chore: release v$version"
    log_success "更改已提交"
}

# 创建标签
create_tag() {
    local version=$1
    
    log_info "创建 Git 标签..."
    git tag -a "v$version" -m "Release v$version"
    log_success "标签已创建: v$version"
}

# 推送到远程
push_to_remote() {
    local version=$1
    
    log_info "推送到远程仓库..."
    git push origin main
    git push origin "v$version"
    log_success "已推送到远程"
}

# 主函数
main() {
    local version_type=${1:-patch}
    
    # 验证版本类型
    if [[ ! "$version_type" =~ ^(patch|minor|major|prepatch|preminor|premajor|prerelease)$ ]]; then
        log_error "无效的版本类型: $version_type"
        log_info "有效类型: patch, minor, major, prepatch, preminor, premajor, prerelease"
        exit 1
    fi
    
    echo ""
    log_info "🚀 TaskFlow AI 发布流程"
    echo "================================"
    echo ""
    
    # 执行检查
    log_info "📋 执行预检查..."
    check_branch
    check_working_tree
    check_remote_sync
    echo ""
    
    # 运行测试和构建
    log_info "🧪 运行测试和构建..."
    run_tests
    build_project
    echo ""
    
    # 更新版本
    log_info "📦 更新版本..."
    local new_version=$(update_version $version_type)
    echo ""
    
    # 更新 CHANGELOG
    update_changelog $new_version
    echo ""
    
    # 确认发布
    log_warning "即将发布版本 v$new_version"
    log_warning "确认继续? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_error "发布已取消"
        exit 1
    fi
    echo ""
    
    # 提交和推送
    log_info "📤 提交和推送..."
    commit_changes $new_version
    create_tag $new_version
    push_to_remote $new_version
    echo ""
    
    # 完成
    log_success "🎉 发布完成！"
    echo ""
    log_info "接下来的步骤:"
    log_info "1. GitHub Actions 将自动创建 Release"
    log_info "2. 包将自动发布到 NPM"
    log_info "3. 文档将自动部署到 GitHub Pages"
    echo ""
    log_info "查看发布状态:"
    log_info "https://github.com/Agions/taskflow-ai/actions"
    echo ""
}

# 显示帮助
show_help() {
    cat << EOF
TaskFlow AI 发布脚本

用法:
  ./scripts/release.sh [version_type]

版本类型:
  patch      补丁版本 (2.1.0 -> 2.1.1)
  minor      次版本 (2.1.0 -> 2.2.0)
  major      主版本 (2.1.0 -> 3.0.0)
  prepatch   预发布补丁 (2.1.0 -> 2.1.1-0)
  preminor   预发布次版本 (2.1.0 -> 2.2.0-0)
  premajor   预发布主版本 (2.1.0 -> 3.0.0-0)
  prerelease 预发布版本 (2.1.0-0 -> 2.1.0-1)

示例:
  ./scripts/release.sh patch    # 发布补丁版本
  ./scripts/release.sh minor    # 发布次版本
  ./scripts/release.sh major    # 发布主版本

注意:
  - 必须在 main 分支上执行
  - 工作区必须干净（无未提交更改）
  - 必须与远程同步
  - 会自动运行测试和构建
EOF
}

# 处理命令行参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 运行主函数
main "$@"
