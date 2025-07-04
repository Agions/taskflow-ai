#!/bin/bash

# TaskFlow AI 快速发布脚本
# 专注于核心功能发布，跳过非关键的代码质量检查

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

# 检查基本依赖
check_basic_dependencies() {
    log_info "检查基本依赖..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    log_success "基本依赖检查通过"
}

# 检查Git状态
check_git_status() {
    log_info "检查Git状态..."
    
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "工作目录有未提交的更改"
        git status --short
        read -p "是否继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Git状态检查通过"
}

# 核心功能测试
test_core_functionality() {
    log_info "测试核心功能..."
    
    # TypeScript编译检查
    log_info "TypeScript编译检查..."
    if ! npx tsc --noEmit; then
        log_error "TypeScript编译失败"
        exit 1
    fi
    
    # 构建检查
    log_info "构建检查..."
    if ! npm run build; then
        log_error "构建失败"
        exit 1
    fi
    
    # CLI基本功能测试
    log_info "CLI功能测试..."
    if ! node bin/index.js --help > /dev/null; then
        log_error "CLI帮助命令失败"
        exit 1
    fi
    
    if ! node bin/index.js --version > /dev/null; then
        log_error "CLI版本命令失败"
        exit 1
    fi
    
    log_success "核心功能测试通过"
}

# 更新版本
update_version() {
    local version_type=${1:-patch}
    
    log_info "更新版本 ($version_type)..."
    
    # 使用npm version更新版本号
    new_version=$(npm version $version_type --no-git-tag-version)
    
    log_success "版本已更新到 $new_version"
    echo $new_version
}

# 提交更改
commit_and_tag() {
    local version=$1
    
    log_info "提交更改并创建标签..."
    
    # 提交package.json更改
    git add package.json package-lock.json
    git commit -m "chore: bump version to $version"
    
    # 创建标签
    git tag -a "$version" -m "Release $version"
    
    log_success "已提交更改并创建标签 $version"
}

# 推送到远程
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
        log_warning "未登录npm，请先运行: npm login"
        read -p "是否跳过npm发布? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_warning "跳过npm发布"
            return 0
        else
            exit 1
        fi
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
    
    log_info "🚀 开始TaskFlow AI快速发布..."
    log_info "版本类型: $version_type"
    
    # 检查基本依赖
    check_basic_dependencies
    
    # 检查Git状态
    check_git_status
    
    # 测试核心功能
    test_core_functionality
    
    # 更新版本
    new_version=$(update_version $version_type)
    
    # 确认发布
    echo
    log_warning "即将发布版本: $new_version"
    log_info "包含的更改:"
    echo "- 完善CLI命令文档"
    echo "- 修复TypeScript类型问题"
    echo "- 更新MCP配置生成"
    echo "- 增强多模型支持"
    echo
    read -p "确认继续发布? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "发布已取消"
        # 回滚版本更改
        git checkout package.json package-lock.json
        exit 0
    fi
    
    # 提交更改并创建标签
    commit_and_tag $new_version
    
    # 推送到远程
    push_to_remote $new_version
    
    # 发布到npm
    publish_to_npm
    
    log_success "🎉 TaskFlow AI $new_version 发布成功!"
    echo
    log_info "📦 npm包: https://www.npmjs.com/package/taskflow-ai"
    log_info "🐙 GitHub: https://github.com/Agions/taskflow-ai/releases/tag/$new_version"
    log_info "📖 文档: https://agions.github.io/taskflow-ai/"
    echo
    log_info "安装命令: npm install -g taskflow-ai@$new_version"
}

# 显示帮助信息
show_help() {
    echo "TaskFlow AI 快速发布脚本"
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
