#!/bin/bash

# TaskFlow AI - 本地Docker构建脚本
# 支持多平台构建和本地发布

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

# 从package.json读取版本信息
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

# 构建配置
BUILD_PLATFORMS="${BUILD_PLATFORMS:-linux/amd64,linux/arm64}"
BUILD_TYPE="${BUILD_TYPE:-local}"  # local, push, load
DOCKERFILE="${DOCKERFILE:-Dockerfile.mcp}"

echo -e "${BLUE}🐳 TaskFlow AI Docker 构建脚本${NC}"
echo "=================================================="
echo -e "${CYAN}📦 项目: ${NAME}${NC}"
echo -e "${CYAN}🏷️  版本: ${VERSION}${NC}"
echo -e "${CYAN}🐳 镜像: ${FULL_IMAGE_NAME}${NC}"
echo -e "${CYAN}🏗️  平台: ${BUILD_PLATFORMS}${NC}"
echo -e "${CYAN}📄 Dockerfile: ${DOCKERFILE}${NC}"
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
    print_info "检查构建先决条件..."
    
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
    
    # 检查Dockerfile
    if [ ! -f "$PROJECT_ROOT/$DOCKERFILE" ]; then
        print_error "Dockerfile不存在: $DOCKERFILE"
        exit 1
    fi
    
    # 检查buildx（多平台构建）
    if [ "$BUILD_TYPE" != "local" ] && [ "$BUILD_PLATFORMS" != "linux/amd64" ]; then
        if ! docker buildx version &> /dev/null; then
            print_warning "Docker Buildx未安装，将使用单平台构建"
            BUILD_PLATFORMS="linux/amd64"
        fi
    fi
    
    print_status "先决条件检查完成"
}

# 准备构建环境
prepare_build() {
    print_info "准备构建环境..."
    
    cd "$PROJECT_ROOT"
    
    # 确保项目已构建
    if [ ! -f "bin/index.js" ] || [ ! -d "dist" ]; then
        print_info "项目未构建，正在构建..."
        npm run build
    fi
    
    # 创建.dockerignore（如果不存在）
    if [ ! -f ".dockerignore" ]; then
        cat > .dockerignore << EOF
node_modules
.git
.github
*.md
!README.md
!MCP-README.md
.env*
.DS_Store
coverage
.nyc_output
*.log
tmp
temp
.vscode
.idea
EOF
        print_status "创建了.dockerignore文件"
    fi
    
    print_status "构建环境准备完成"
}

# 构建Docker镜像
build_image() {
    print_info "开始构建Docker镜像..."
    
    # 构建参数
    BUILD_ARGS=(
        "--file" "$DOCKERFILE"
        "--tag" "${FULL_IMAGE_NAME}:${VERSION}"
        "--tag" "${FULL_IMAGE_NAME}:latest"
        "--build-arg" "VERSION=${VERSION}"
        "--build-arg" "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
        "--build-arg" "VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    )
    
    # 根据构建类型选择命令
    case "$BUILD_TYPE" in
        "local")
            # 本地构建（单平台）
            docker build "${BUILD_ARGS[@]}" .
            ;;
        "push")
            # 构建并推送到注册表
            if command -v docker buildx &> /dev/null; then
                docker buildx build \
                    "${BUILD_ARGS[@]}" \
                    --platform "$BUILD_PLATFORMS" \
                    --push \
                    .
            else
                # 回退到普通构建+推送
                docker build "${BUILD_ARGS[@]}" .
                docker push "${FULL_IMAGE_NAME}:${VERSION}"
                docker push "${FULL_IMAGE_NAME}:latest"
            fi
            ;;
        "load")
            # 构建并加载到本地Docker
            if command -v docker buildx &> /dev/null; then
                docker buildx build \
                    "${BUILD_ARGS[@]}" \
                    --platform "linux/amd64" \
                    --load \
                    .
            else
                docker build "${BUILD_ARGS[@]}" .
            fi
            ;;
        *)
            print_error "未知的构建类型: $BUILD_TYPE"
            exit 1
            ;;
    esac
    
    print_status "Docker镜像构建完成"
}

# 测试镜像
test_image() {
    print_info "测试Docker镜像..."
    
    # 基本运行测试
    if docker run --rm "${FULL_IMAGE_NAME}:${VERSION}" node -e "console.log('TaskFlow AI MCP Server Test OK')" &> /dev/null; then
        print_status "镜像基本功能测试通过"
    else
        print_error "镜像基本功能测试失败"
        return 1
    fi
    
    # 健康检查测试（如果有）
    if docker inspect "${FULL_IMAGE_NAME}:${VERSION}" | grep -q "Healthcheck"; then
        print_info "镜像包含健康检查配置"
    fi
    
    print_status "镜像测试完成"
}

# 显示构建信息
show_build_info() {
    echo ""
    echo -e "${PURPLE}📊 构建信息${NC}"
    echo "===================="
    
    # 镜像大小
    IMAGE_SIZE=$(docker images "${FULL_IMAGE_NAME}:${VERSION}" --format "table {{.Size}}" | tail -n 1)
    echo -e "${CYAN}📦 镜像大小: ${IMAGE_SIZE}${NC}"
    
    # 镜像标签
    echo -e "${CYAN}🏷️  镜像标签:${NC}"
    echo "  - ${FULL_IMAGE_NAME}:${VERSION}"
    echo "  - ${FULL_IMAGE_NAME}:latest"
    
    # 平台信息
    echo -e "${CYAN}🏗️  构建平台: ${BUILD_PLATFORMS}${NC}"
    
    # 使用说明
    echo ""
    echo -e "${YELLOW}🚀 使用方法:${NC}"
    echo "  docker run -it ${FULL_IMAGE_NAME}:${VERSION}"
    echo "  docker run -it ${FULL_IMAGE_NAME}:latest"
    echo ""
    echo -e "${YELLOW}📤 推送到注册表:${NC}"
    echo "  docker push ${FULL_IMAGE_NAME}:${VERSION}"
    echo "  docker push ${FULL_IMAGE_NAME}:latest"
}

# 清理函数
cleanup() {
    if [ "$1" != "keep" ]; then
        print_info "清理临时文件..."
        # 这里可以添加清理逻辑
        print_status "清理完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "TaskFlow AI Docker 构建脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --type TYPE        构建类型 (local|push|load) [默认: local]"
    echo "  -p, --platforms PLAT   目标平台 [默认: linux/amd64,linux/arm64]"
    echo "  -f, --dockerfile FILE  Dockerfile路径 [默认: Dockerfile.mcp]"
    echo "  -r, --registry REG     Docker注册表 [默认: docker.io]"
    echo "  -n, --namespace NS     Docker命名空间 [默认: agions]"
    echo "  --test                 构建后运行测试"
    echo "  --no-cache             不使用构建缓存"
    echo "  -h, --help             显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  DOCKER_REGISTRY        Docker注册表地址"
    echo "  DOCKER_NAMESPACE       Docker命名空间"
    echo "  BUILD_PLATFORMS        构建平台列表"
    echo "  BUILD_TYPE             构建类型"
    echo ""
    echo "示例:"
    echo "  $0                     # 本地构建"
    echo "  $0 -t push             # 构建并推送"
    echo "  $0 -t load --test      # 构建、加载并测试"
    echo "  $0 -p linux/amd64      # 仅构建AMD64平台"
}

# 解析命令行参数
RUN_TESTS=false
NO_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -p|--platforms)
            BUILD_PLATFORMS="$2"
            shift 2
            ;;
        -f|--dockerfile)
            DOCKERFILE="$2"
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
        --test)
            RUN_TESTS=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
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

# 更新完整镜像名称（可能在参数解析后改变）
FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/${IMAGE_NAME}"

# 如果启用了no-cache，添加到构建参数
if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS+=("--no-cache")
fi

# 主执行流程
main() {
    # 设置错误处理
    trap 'echo -e "\n${RED}构建被中断${NC}"; cleanup; exit 1' INT TERM
    
    check_prerequisites
    prepare_build
    build_image
    
    if [ "$RUN_TESTS" = true ]; then
        test_image
    fi
    
    show_build_info
    
    echo ""
    echo -e "${GREEN}🎉 Docker镜像构建成功！${NC}"
    
    cleanup keep
}

# 运行主函数
main "$@"
