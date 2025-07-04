#!/bin/bash

# TaskFlow AI 文档部署脚本
# 用于本地构建和部署VitePress文档站点

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

# 检查Node.js版本
check_node_version() {
    log_info "检查Node.js版本..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 版本过低，需要 18+，当前版本: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $(node -v)"
}

# 安装依赖
install_dependencies() {
    log_info "安装文档依赖..."

    cd docs

    if [ ! -f "package-lock.json" ]; then
        log_warning "package-lock.json 不存在，将使用 npm install 生成锁定文件"
        npm install
    else
        npm ci
    fi

    log_success "依赖安装完成"

    cd ..
}

# 构建文档
build_docs() {
    log_info "构建VitePress文档..."
    
    cd docs
    
    # 清理之前的构建
    if [ -d ".vitepress/dist" ]; then
        rm -rf .vitepress/dist
        log_info "清理旧的构建文件"
    fi
    
    # 构建文档
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "文档构建完成"
    else
        log_error "文档构建失败"
        exit 1
    fi
    
    cd ..
}

# 本地预览
preview_docs() {
    log_info "启动本地预览服务器..."
    
    cd docs
    
    log_info "文档预览地址: http://localhost:4173"
    log_info "按 Ctrl+C 停止预览服务器"
    
    npm run preview
    
    cd ..
}

# 开发模式
dev_docs() {
    log_info "启动开发服务器..."
    
    cd docs
    
    log_info "开发服务器地址: http://localhost:5173"
    log_info "按 Ctrl+C 停止开发服务器"
    
    npm run dev
    
    cd ..
}

# 部署到GitHub Pages（手动）
deploy_to_github() {
    log_info "准备部署到GitHub Pages..."
    
    # 检查是否在git仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是git仓库"
        exit 1
    fi
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        log_warning "检测到未提交的更改，建议先提交所有更改"
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    # 构建文档
    build_docs
    
    # 推送到main分支触发GitHub Actions
    log_info "推送更改到GitHub..."
    git add .
    git commit -m "docs: 更新文档内容" || log_warning "没有新的更改需要提交"
    git push origin main
    
    log_success "更改已推送到GitHub，GitHub Actions将自动部署文档"
    log_info "部署状态: https://github.com/agions/taskflow-ai/actions"
    log_info "文档地址: https://agions.github.io/taskflow-ai/"
}

# 显示帮助信息
show_help() {
    echo "TaskFlow AI 文档部署脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  install     安装文档依赖"
    echo "  build       构建文档"
    echo "  dev         启动开发服务器"
    echo "  preview     预览构建后的文档"
    echo "  deploy      部署到GitHub Pages"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 install   # 安装依赖"
    echo "  $0 dev       # 开发模式"
    echo "  $0 build     # 构建文档"
    echo "  $0 deploy    # 部署到GitHub Pages"
}

# 主函数
main() {
    case "${1:-help}" in
        "install")
            check_node_version
            install_dependencies
            ;;
        "build")
            check_node_version
            build_docs
            ;;
        "dev")
            check_node_version
            install_dependencies
            dev_docs
            ;;
        "preview")
            check_node_version
            build_docs
            preview_docs
            ;;
        "deploy")
            check_node_version
            install_dependencies
            deploy_to_github
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
