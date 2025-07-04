#!/bin/bash

# TaskFlow AI 发布脚本
# 用于自动化发布流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 检查工作目录状态
check_git_status() {
    log_info "检查Git状态..."
    
    if [[ -n $(git status --porcelain) ]]; then
        log_error "工作目录有未提交的更改，请先提交或暂存"
        git status --short
        exit 1
    fi
    
    # 检查是否在main分支
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        log_warning "当前不在main分支 (当前: $current_branch)"
        read -p "是否继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Git状态检查通过"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # TypeScript类型检查
    log_info "TypeScript类型检查..."
    if ! npx tsc --noEmit; then
        log_error "TypeScript类型检查失败"
        exit 1
    fi
    
    # 构建检查
    log_info "构建检查..."
    if ! npm run build; then
        log_error "构建失败"
        exit 1
    fi
    
    # 运行单元测试
    log_info "运行单元测试..."
    if ! npm test; then
        log_error "测试失败"
        exit 1
    fi
    
    log_success "所有测试通过"
}

# 更新版本
update_version() {
    local version_type=$1
    
    if [[ -z "$version_type" ]]; then
        log_error "请指定版本类型: patch, minor, major"
        exit 1
    fi
    
    log_info "更新版本 ($version_type)..."
    
    # 使用npm version更新版本号
    new_version=$(npm version $version_type --no-git-tag-version)
    
    log_success "版本已更新到 $new_version"
    echo $new_version
}

# 生成变更日志
generate_changelog() {
    local version=$1
    
    log_info "生成变更日志..."
    
    # 获取上一个版本标签
    last_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
    
    if [[ -n "$last_tag" ]]; then
        log_info "从 $last_tag 到 $version 的变更:"
        git log --oneline --pretty=format:"- %s" $last_tag..HEAD
    else
        log_info "首次发布，生成完整变更日志"
        git log --oneline --pretty=format:"- %s"
    fi
}

# 提交更改
commit_changes() {
    local version=$1
    
    log_info "提交版本更改..."
    
    git add package.json package-lock.json
    git commit -m "chore: bump version to $version"
    
    log_success "版本更改已提交"
}

# 创建Git标签
create_tag() {
    local version=$1
    
    log_info "创建Git标签 $version..."
    
    git tag -a "$version" -m "Release $version"
    
    log_success "标签 $version 已创建"
}

# 推送到远程仓库
push_to_remote() {
    local version=$1
    
    log_info "推送到远程仓库..."
    
    git push origin main
    git push origin "$version"
    
    log_success "已推送到远程仓库"
}

# 发布到npm
publish_to_npm() {
    log_info "发布到npm..."
    
    # 检查npm登录状态
    if ! npm whoami &> /dev/null; then
        log_error "请先登录npm: npm login"
        exit 1
    fi
    
    # 发布
    if npm publish; then
        log_success "已发布到npm"
    else
        log_error "npm发布失败"
        exit 1
    fi
}

# 主函数
main() {
    local version_type=${1:-patch}
    
    log_info "开始TaskFlow AI发布流程..."
    log_info "版本类型: $version_type"
    
    # 检查依赖
    check_dependencies
    
    # 检查Git状态
    check_git_status
    
    # 运行测试
    run_tests
    
    # 更新版本
    new_version=$(update_version $version_type)
    
    # 生成变更日志
    generate_changelog $new_version
    
    # 确认发布
    echo
    log_warning "即将发布版本: $new_version"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "发布已取消"
        exit 0
    fi
    
    # 提交更改
    commit_changes $new_version
    
    # 创建标签
    create_tag $new_version
    
    # 推送到远程
    push_to_remote $new_version
    
    # 发布到npm
    publish_to_npm
    
    log_success "🎉 TaskFlow AI $new_version 发布成功!"
    log_info "📦 npm: https://www.npmjs.com/package/taskflow-ai"
    log_info "🐙 GitHub: https://github.com/Agions/taskflow-ai/releases/tag/$new_version"
}

# 显示帮助信息
show_help() {
    echo "TaskFlow AI 发布脚本"
    echo
    echo "用法: $0 [版本类型]"
    echo
    echo "版本类型:"
    echo "  patch   补丁版本 (默认) - 1.2.0 -> 1.2.1"
    echo "  minor   次要版本        - 1.2.0 -> 1.3.0"
    echo "  major   主要版本        - 1.2.0 -> 2.0.0"
    echo
    echo "示例:"
    echo "  $0 patch    # 发布补丁版本"
    echo "  $0 minor    # 发布次要版本"
    echo "  $0 major    # 发布主要版本"
}

# 处理命令行参数
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    patch|minor|major|"")
        main "${1:-patch}"
        ;;
    *)
        log_error "无效的版本类型: $1"
        show_help
        exit 1
        ;;
esac
