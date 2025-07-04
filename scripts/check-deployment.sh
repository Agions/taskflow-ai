#!/bin/bash

# TaskFlow AI 部署状态检查脚本

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

# 检查网站可访问性
check_website() {
    local url="$1"
    local name="$2"
    
    log_info "检查 $name: $url"
    
    if curl -s --head "$url" | head -n 1 | grep -q "200 OK"; then
        log_success "$name 可正常访问"
        return 0
    else
        log_error "$name 无法访问"
        return 1
    fi
}

# 检查页面内容
check_page_content() {
    local url="$1"
    local expected="$2"
    local name="$3"
    
    log_info "检查 $name 页面内容..."
    
    if curl -s "$url" | grep -q "$expected"; then
        log_success "$name 页面内容正确"
        return 0
    else
        log_error "$name 页面内容异常"
        return 1
    fi
}

# 检查GitHub Actions状态
check_github_actions() {
    log_info "检查GitHub Actions部署状态..."
    
    local repo_url="https://github.com/agions/taskflow-ai"
    local actions_url="$repo_url/actions"
    
    log_info "GitHub Actions: $actions_url"
    log_info "请手动检查最新的工作流运行状态"
}

# 检查构建产物
check_build_artifacts() {
    log_info "检查本地构建产物..."
    
    if [ -d "docs/.vitepress/dist" ]; then
        local file_count=$(find docs/.vitepress/dist -type f | wc -l)
        log_success "构建产物存在，包含 $file_count 个文件"
        
        # 检查关键文件
        local key_files=("index.html" "sitemap.xml" "robots.txt")
        for file in "${key_files[@]}"; do
            if [ -f "docs/.vitepress/dist/$file" ]; then
                log_success "关键文件存在: $file"
            else
                log_warning "关键文件缺失: $file"
            fi
        done
    else
        log_error "构建产物目录不存在"
        return 1
    fi
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件..."
    
    local config_files=(
        "docs/.vitepress/config.ts"
        "docs/package.json"
        ".github/workflows/deploy-docs.yml"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "配置文件存在: $file"
        else
            log_error "配置文件缺失: $file"
        fi
    done
}

# 主检查函数
main() {
    echo "TaskFlow AI 部署状态检查"
    echo "=========================="
    echo ""
    
    # 检查本地构建
    check_build_artifacts
    echo ""
    
    # 检查配置文件
    check_config_files
    echo ""
    
    # 检查GitHub Actions
    check_github_actions
    echo ""
    
    # 检查网站可访问性
    log_info "检查网站可访问性..."
    local base_url="https://agions.github.io/taskflow-ai"
    
    # 主要页面
    local pages=(
        "$base_url/" "首页"
        "$base_url/guide/getting-started.html" "快速开始"
        "$base_url/api/" "API文档"
        "$base_url/reference/cli.html" "CLI参考"
        "$base_url/troubleshooting/" "故障排除"
    )
    
    local success_count=0
    local total_count=$((${#pages[@]} / 2))
    
    for ((i=0; i<${#pages[@]}; i+=2)); do
        if check_website "${pages[i]}" "${pages[i+1]}"; then
            ((success_count++))
        fi
    done
    
    echo ""
    echo "网站检查结果: $success_count/$total_count 页面可访问"
    
    if [ $success_count -eq $total_count ]; then
        log_success "所有页面都可正常访问！"
    else
        log_warning "部分页面无法访问，可能需要等待部署完成"
    fi
    
    echo ""
    echo "部署信息:"
    echo "- 文档站点: $base_url"
    echo "- GitHub仓库: https://github.com/agions/taskflow-ai"
    echo "- 部署状态: https://github.com/agions/taskflow-ai/actions"
    echo ""
    
    # 检查页面内容
    if check_page_content "$base_url/" "TaskFlow AI" "首页"; then
        log_success "首页内容验证通过"
    fi
    
    echo ""
    log_info "检查完成！"
}

# 显示帮助信息
show_help() {
    echo "TaskFlow AI 部署状态检查脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h    显示此帮助信息"
    echo "  --quick, -q   快速检查（仅检查主要页面）"
    echo "  --local, -l   仅检查本地构建产物"
    echo ""
    echo "示例:"
    echo "  $0            # 完整检查"
    echo "  $0 --quick    # 快速检查"
    echo "  $0 --local    # 本地检查"
}

# 快速检查
quick_check() {
    log_info "快速检查模式"
    check_website "https://agions.github.io/taskflow-ai/" "TaskFlow AI 文档站点"
}

# 本地检查
local_check() {
    log_info "本地检查模式"
    check_build_artifacts
    check_config_files
}

# 处理命令行参数
case "${1:-}" in
    "--help"|"-h")
        show_help
        ;;
    "--quick"|"-q")
        quick_check
        ;;
    "--local"|"-l")
        local_check
        ;;
    "")
        main
        ;;
    *)
        log_error "未知选项: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
