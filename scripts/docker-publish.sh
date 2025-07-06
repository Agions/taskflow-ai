#!/bin/bash

# TaskFlow AI - 本地Docker发布脚本
# 发布到Docker Hub和Docker MCP Registry

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_JSON="$PROJECT_ROOT/package.json"

# 从package.json读取信息
if [ -f "$PACKAGE_JSON" ]; then
    VERSION=$(node -p "require('$PACKAGE_JSON').version")
    NAME=$(node -p "require('$PACKAGE_JSON').name")
else
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

# Docker配置
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_NAMESPACE="${DOCKER_NAMESPACE:-agions}"
IMAGE_NAME="${NAME}"
FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${IMAGE_NAME}"

# 发布配置
PUBLISH_TARGETS="${PUBLISH_TARGETS:-dockerhub,mcp-registry}"
DRY_RUN="${DRY_RUN:-false}"
FORCE_PUBLISH="${FORCE_PUBLISH:-false}"

echo -e "${BLUE}🚀 TaskFlow AI Docker 发布脚本${NC}"
echo "=================================================="
echo -e "${CYAN}📦 项目: ${NAME}${NC}"
echo -e "${CYAN}🏷️  版本: ${VERSION}${NC}"
echo -e "${CYAN}🐳 镜像: ${FULL_IMAGE_NAME}${NC}"
echo -e "${CYAN}🎯 目标: ${PUBLISH_TARGETS}${NC}"
echo ""

# 函数定义
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 检查先决条件
check_prerequisites() {
    print_info "检查发布先决条件..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装或不在PATH中"
        exit 1
    fi
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        print_error "Docker守护进程未运行"
        exit 1
    fi
    
    # 检查镜像是否存在
    if ! docker image inspect "${FULL_IMAGE_NAME}:${VERSION}" &> /dev/null; then
        print_error "镜像不存在: ${FULL_IMAGE_NAME}:${VERSION}"
        print_info "请先运行构建脚本: ./scripts/docker-build.sh"
        exit 1
    fi
    
    # 检查Git状态（确保代码已提交）
    if [ "$FORCE_PUBLISH" != "true" ]; then
        if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
            print_warning "工作目录有未提交的更改"
            read -p "是否继续发布? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "发布已取消"
                exit 0
            fi
        fi
    fi
    
    print_status "先决条件检查完成"
}

# 检查Docker Hub登录状态
check_docker_login() {
    print_info "检查Docker Hub登录状态..."
    
    if ! docker info | grep -q "Username:"; then
        print_warning "未登录到Docker Hub"
        print_info "请运行: docker login"
        
        if [ "$DRY_RUN" != "true" ]; then
            read -p "现在登录? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker login
            else
                print_error "需要登录Docker Hub才能发布"
                exit 1
            fi
        fi
    else
        print_status "已登录到Docker Hub"
    fi
}

# 发布到Docker Hub
publish_to_dockerhub() {
    if [[ "$PUBLISH_TARGETS" == *"dockerhub"* ]]; then
        print_info "发布到Docker Hub..."
        
        if [ "$DRY_RUN" = "true" ]; then
            print_info "[DRY RUN] 将推送: ${FULL_IMAGE_NAME}:${VERSION}"
            print_info "[DRY RUN] 将推送: ${FULL_IMAGE_NAME}:latest"
        else
            # 推送版本标签
            print_info "推送版本标签: ${VERSION}"
            docker push "${FULL_IMAGE_NAME}:${VERSION}"
            
            # 推送latest标签
            print_info "推送latest标签"
            docker push "${FULL_IMAGE_NAME}:latest"
            
            print_status "成功发布到Docker Hub"
        fi
    fi
}

# 准备MCP Registry提交
prepare_mcp_registry_submission() {
    if [[ "$PUBLISH_TARGETS" == *"mcp-registry"* ]]; then
        print_info "准备Docker MCP Registry提交..."
        
        # 检查必要文件
        local required_files=(
            "mcp-server.json"
            "docker-mcp-registry.yaml"
            "MCP-README.md"
            "Dockerfile.mcp"
        )
        
        for file in "${required_files[@]}"; do
            if [ ! -f "$PROJECT_ROOT/$file" ]; then
                print_error "MCP Registry提交文件缺失: $file"
                exit 1
            fi
        done
        
        # 验证mcp-server.json
        if ! jq empty "$PROJECT_ROOT/mcp-server.json" 2>/dev/null; then
            print_error "mcp-server.json格式无效"
            exit 1
        fi
        
        # 更新镜像引用
        local temp_file=$(mktemp)
        jq --arg image "${FULL_IMAGE_NAME}:${VERSION}" \
           '.installation.docker.image = $image' \
           "$PROJECT_ROOT/mcp-server.json" > "$temp_file"
        mv "$temp_file" "$PROJECT_ROOT/mcp-server.json"
        
        print_status "MCP Registry提交文件准备完成"
        
        if [ "$DRY_RUN" != "true" ]; then
            print_info "运行MCP Registry提交脚本..."
            bash "$PROJECT_ROOT/scripts/submit-to-docker-mcp-registry.sh"
        else
            print_info "[DRY RUN] 将运行MCP Registry提交脚本"
        fi
    fi
}

# 创建GitHub Release（可选）
create_github_release() {
    if command -v gh &> /dev/null && [ "$DRY_RUN" != "true" ]; then
        print_info "检查是否需要创建GitHub Release..."
        
        # 检查是否已存在该版本的release
        if gh release view "v${VERSION}" &> /dev/null; then
            print_info "GitHub Release v${VERSION} 已存在"
        else
            read -p "创建GitHub Release v${VERSION}? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "创建GitHub Release..."
                
                # 生成release notes
                local release_notes="## TaskFlow AI v${VERSION}

### 🐳 Docker镜像
- \`${FULL_IMAGE_NAME}:${VERSION}\`
- \`${FULL_IMAGE_NAME}:latest\`

### 📦 安装方式

#### NPM
\`\`\`bash
npm install -g ${NAME}
\`\`\`

#### Docker
\`\`\`bash
docker run -it ${FULL_IMAGE_NAME}:${VERSION}
\`\`\`

#### MCP服务器
\`\`\`bash
npx ${NAME} mcp server
\`\`\`

### 🔗 相关链接
- [Docker Hub](https://hub.docker.com/r/${DOCKER_NAMESPACE}/${IMAGE_NAME})
- [NPM Package](https://www.npmjs.com/package/${NAME})
- [MCP服务器文档](./MCP-README.md)"
                
                gh release create "v${VERSION}" \
                    --title "TaskFlow AI v${VERSION}" \
                    --notes "$release_notes" \
                    --latest
                
                print_status "GitHub Release创建完成"
            fi
        fi
    fi
}

# 发布后验证
verify_publication() {
    print_info "验证发布结果..."
    
    if [[ "$PUBLISH_TARGETS" == *"dockerhub"* ]] && [ "$DRY_RUN" != "true" ]; then
        # 验证Docker Hub
        print_info "验证Docker Hub发布..."
        if docker pull "${FULL_IMAGE_NAME}:${VERSION}" &> /dev/null; then
            print_status "Docker Hub发布验证成功"
        else
            print_warning "Docker Hub发布验证失败"
        fi
    fi
    
    print_status "发布验证完成"
}

# 显示发布摘要
show_publication_summary() {
    echo ""
    echo -e "${PURPLE}📊 发布摘要${NC}"
    echo "===================="
    echo -e "${CYAN}📦 项目: ${NAME} v${VERSION}${NC}"
    echo -e "${CYAN}🐳 镜像: ${FULL_IMAGE_NAME}${NC}"
    echo ""
    
    if [[ "$PUBLISH_TARGETS" == *"dockerhub"* ]]; then
        echo -e "${GREEN}✓ Docker Hub${NC}"
        echo "  - ${FULL_IMAGE_NAME}:${VERSION}"
        echo "  - ${FULL_IMAGE_NAME}:latest"
        echo "  - 拉取命令: docker pull ${FULL_IMAGE_NAME}:${VERSION}"
    fi
    
    if [[ "$PUBLISH_TARGETS" == *"mcp-registry"* ]]; then
        echo -e "${GREEN}✓ Docker MCP Registry${NC}"
        echo "  - 提交文件已准备"
        echo "  - 请查看提交脚本输出"
    fi
    
    echo ""
    echo -e "${YELLOW}🚀 使用方法:${NC}"
    echo "  # NPM安装"
    echo "  npm install -g ${NAME}"
    echo ""
    echo "  # Docker运行"
    echo "  docker run -it ${FULL_IMAGE_NAME}:${VERSION}"
    echo ""
    echo "  # MCP服务器"
    echo "  npx ${NAME} mcp server"
}

# 显示帮助信息
show_help() {
    echo "TaskFlow AI Docker 发布脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --targets TARGETS  发布目标 (dockerhub,mcp-registry) [默认: dockerhub,mcp-registry]"
    echo "  -r, --registry REG     Docker注册表 [默认: docker.io]"
    echo "  -n, --namespace NS     Docker命名空间 [默认: agions]"
    echo "  --dry-run              预览模式，不实际发布"
    echo "  --force                强制发布，跳过检查"
    echo "  -h, --help             显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_REGISTRY        Docker注册表地址"
    echo "  DOCKER_NAMESPACE       Docker命名空间"
    echo "  PUBLISH_TARGETS        发布目标列表"
    echo "  DRY_RUN                预览模式 (true|false)"
    echo "  FORCE_PUBLISH          强制发布 (true|false)"
    echo ""
    echo "示例:"
    echo "  $0                     # 发布到所有目标"
    echo "  $0 -t dockerhub        # 仅发布到Docker Hub"
    echo "  $0 --dry-run           # 预览发布过程"
    echo "  $0 --force             # 强制发布"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--targets)
            PUBLISH_TARGETS="$2"
            shift 2
            ;;
        -r|--registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        -n|--namespace)
            DOCKER_NAMESPACE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --force)
            FORCE_PUBLISH="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 更新完整镜像名称
FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${IMAGE_NAME}"

# 主执行流程
main() {
    # 设置错误处理
    trap 'echo -e "\n${RED}发布被中断${NC}"; exit 1' INT TERM
    
    if [ "$DRY_RUN" = "true" ]; then
        print_warning "运行在预览模式，不会实际发布"
        echo ""
    fi
    
    check_prerequisites
    check_docker_login
    publish_to_dockerhub
    prepare_mcp_registry_submission
    create_github_release
    verify_publication
    show_publication_summary
    
    echo ""
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 预览完成！使用 --dry-run=false 进行实际发布${NC}"
    else
        echo -e "${GREEN}🎉 发布完成！${NC}"
    fi
}

# 运行主函数
main "$@"
