#!/usr/bin/env bash
#
# TaskFlow AI 一键安装脚本
# 支持: Linux / macOS / Windows (WSL/bash)
# 版本: 2.2.1
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 版本信息
VERSION="2.2.1"
PACKAGE_NAME="taskflow-ai"
GITHUB_REPO="Agions/taskflow-ai"
NPM_PACKAGE="taskflow-ai"

# 打印函数
print_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║   🚀 TaskFlow AI v${VERSION} 一键安装脚本                    ║"
    echo "║   智能 PRD 文档解析与任务管理助手                           ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}➤${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
            echo "wsl"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 检测 CPU 架构
detect_arch() {
    local arch=$(uname -m)
    case $arch in
        x86_64|x64)
            echo "x64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l|armhf)
            echo "arm"
            ;;
        *)
            echo "x64"
            ;;
    esac
}

# 检测 Node.js
check_node() {
    print_step "检查 Node.js 环境..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        echo ""
        echo "请先安装 Node.js >= 18.0.0:"
        echo "  • Linux/macOS: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
        echo "  • macOS: brew install node@20"
        echo "  • Windows: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    
    if [[ "$NODE_VERSION" -lt 18 ]]; then
        print_error "Node.js 版本过低 (当前: $(node -v), 需要: >= 18.0.0)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) ✓"
}

# 检测包管理器
detect_package_manager() {
    if command -v pnpm &> /dev/null; then
        echo "pnpm"
    elif command -v yarn &> /dev/null; then
        echo "yarn"
    elif command -v npm &> /dev/null; then
        echo "npm"
    else
        echo "none"
    fi
}

# 安装函数
install_npm() {
    print_step "使用 npm 安装..."
    npm install -g "$NPM_PACKAGE" --registry https://registry.npmjs.org/
}

install_pnpm() {
    print_step "使用 pnpm 安装..."
    pnpm add -g "$NPM_PACKAGE"
}

install_yarn() {
    print_step "使用 yarn 安装..."
    yarn global add "$NPM_PACKAGE"
}

# 卸载函数
uninstall_package() {
    print_step "卸载旧版本..."
    npm uninstall -g "$NPM_PACKAGE" 2>/dev/null || true
    pnpm remove -g "$NPM_PACKAGE" 2>/dev/null || true
    yarn global remove "$NPM_PACKAGE" 2>/dev/null || true
}

# 验证安装
verify_installation() {
    print_step "验证安装..."
    
    if command -v taskflow &> /dev/null; then
        TASKFLOW_VERSION=$(taskflow --version 2>/dev/null || echo "unknown")
        print_success "TaskFlow AI v${TASKFLOW_VERSION} 安装成功！"
        return 0
    elif command -v taskflow-ai &> /dev/null; then
        TASKFLOW_VERSION=$(taskflow-ai --version 2>/dev/null || echo "unknown")
        print_success "TaskFlow AI v${TASKFLOW_VERSION} 安装成功！"
        return 0
    else
        print_warning "命令未找到，尝试刷新环境..."
        
        # 刷新 PATH
        if [[ "$OS" == "macos" ]] || [[ "$OS" == "linux" ]]; then
            export PATH="$HOME/.npm-global/bin:$PATH"
            
            if [[ -f "$HOME/.bashrc" ]]; then
                source "$HOME/.bashrc"
            fi
            if [[ -f "$HOME/.zshrc" ]]; then
                source "$HOME/.zshrc"
            fi
        fi
        
        if command -v taskflow &> /dev/null; then
            TASKFLOW_VERSION=$(taskflow --version 2>/dev/null || echo "unknown")
            print_success "TaskFlow AI v${TASKFLOW_VERSION} 安装成功！"
            return 0
        fi
        
        print_error "安装验证失败"
        return 1
    fi
}

# 初始化配置
init_config() {
    print_step "初始化配置..."
    
    if taskflow config init 2>/dev/null; then
        print_success "配置文件已创建"
    else
        print_warning "配置初始化跳过（可在后续手动执行: taskflow config init）"
    fi
}

# 打印使用提示
print_usage() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo "                    安装成功！开始使用 TaskFlow AI"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  快速开始:"
    echo "    taskflow init              # 初始化项目"
    echo "    taskflow --help            # 查看帮助"
    echo "    taskflow config set        # 配置 AI 模型"
    echo ""
    echo "  配置 AI 模型:"
    echo "    taskflow config set models.deepseek.apiKey \"your-key\""
    echo "    taskflow config set models.zhipu.apiKey \"your-key\""
    echo ""
    echo "  查看文档: https://agions.github.io/taskflow-ai/"
    echo ""
}

# 卸载函数
uninstall() {
    print_step "开始卸载 TaskFlow AI..."
    
    uninstall_package
    
    print_success "TaskFlow AI 已卸载"
    echo ""
    echo "如需彻底清理，删除配置文件:"
    echo "  rm -rf ~/.taskflow"
    echo "  rm -rf ~/.config/taskflow-ai"
}

# 帮助信息
show_help() {
    echo "TaskFlow AI 一键安装脚本 v${VERSION}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示帮助信息"
    echo "  -v, --version        显示版本信息"
    echo "  -u, --uninstall      卸载 TaskFlow AI"
    echo "  -c, --check          仅检查环境"
    echo "  --npm                强制使用 npm 安装"
    echo "  --pnpm               强制使用 pnpm 安装"
    echo "  --yarn               强制使用 yarn 安装"
    echo "  --skip-config        跳过配置初始化"
    echo ""
}

# 主函数
main() {
    local install_method=""
    local skip_config=false
    local just_check=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                echo "TaskFlow AI v${VERSION}"
                exit 0
                ;;
            -u|--uninstall)
                uninstall
                exit 0
                ;;
            -c|--check)
                just_check=true
                ;;
            --npm)
                install_method="npm"
                ;;
            --pnpm)
                install_method="pnpm"
                ;;
            --yarn)
                install_method="yarn"
                ;;
            --skip-config)
                skip_config=true
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done
    
    # 打印横幅
    print_banner
    
    # 检测环境
    local os=$(detect_os)
    local arch=$(detect_arch)
    print_success "检测到系统: $os | 架构: $arch"
    
    # 检查 Node.js
    check_node
    
    # 仅检查模式
    if [[ "$just_check" == true ]]; then
        print_success "环境检查通过！"
        exit 0
    fi
    
    # 检测包管理器
    if [[ -z "$install_method" ]]; then
        install_method=$(detect_package_manager)
    fi
    
    if [[ "$install_method" == "none" ]]; then
        print_error "未找到 npm/pnpm/yarn，请安装 Node.js 后重试"
        exit 1
    fi
    
    print_success "包管理器: $install_method"
    
    # 卸载旧版本
    uninstall_package
    
    # 安装
    echo ""
    case $install_method in
        npm)
            install_npm
            ;;
        pnpm)
            install_pnpm
            ;;
        yarn)
            install_yarn
            ;;
    esac
    
    # 验证安装
    echo ""
    if verify_installation; then
        # 初始化配置
        if [[ "$skip_config" == false ]]; then
            echo ""
            init_config
        fi
        
        # 打印使用提示
        print_usage
    else
        echo ""
        print_error "安装过程中出现问题，请查看上方错误信息"
        echo ""
        echo "或尝试手动安装:"
        echo "  npm install -g taskflow-ai"
        exit 1
    fi
}

# 运行
main "$@"
