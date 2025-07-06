#!/bin/bash

# TaskFlow AI - Local Docker Build & Publish Script
# 本地Docker环境构建和发布脚本

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="taskflow-ai"
DOCKER_REGISTRY="docker.io"
DOCKER_USERNAME="agions"
DOCKER_IMAGE_NAME="$DOCKER_USERNAME/$PROJECT_NAME"
MCP_IMAGE_NAME="$DOCKER_USERNAME/$PROJECT_NAME-mcp"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
GIT_SHA=$(git rev-parse --short HEAD)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🐳 TaskFlow AI - Local Docker Build & Publish${NC}"
echo "=================================================="
echo -e "${CYAN}📦 Project: $PROJECT_NAME${NC}"
echo -e "${CYAN}🏷️  Version: $VERSION${NC}"
echo -e "${CYAN}🔗 Git SHA: $GIT_SHA${NC}"
echo -e "${CYAN}📅 Build Date: $BUILD_DATE${NC}"
echo ""

# Function to print status
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

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if we're in the correct directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "This script must be run from the TaskFlow AI project root directory."
        exit 1
    fi
    
    # Check if required Dockerfiles exist
    if [ ! -f "$PROJECT_ROOT/Dockerfile" ]; then
        print_error "Dockerfile not found in project root."
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/Dockerfile.mcp" ]; then
        print_error "Dockerfile.mcp not found in project root."
        exit 1
    fi
    
    print_status "All prerequisites met"
}

# Function to build project
build_project() {
    echo -e "${BLUE}🔨 Building project...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies and build
    if npm ci --prefer-offline --no-audit > /dev/null 2>&1; then
        print_status "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    if npm run build > /dev/null 2>&1; then
        print_status "Project built successfully"
    else
        print_error "Failed to build project"
        exit 1
    fi
}

# Function to build Docker images
build_docker_images() {
    echo -e "${BLUE}🐳 Building Docker images...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Build main TaskFlow AI image
    echo -e "${PURPLE}📦 Building main TaskFlow AI image...${NC}"
    if docker build \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$GIT_SHA" \
        --target production \
        -t "$DOCKER_IMAGE_NAME:$VERSION" \
        -t "$DOCKER_IMAGE_NAME:latest" \
        -f Dockerfile \
        . > /dev/null 2>&1; then
        print_status "Main image built: $DOCKER_IMAGE_NAME:$VERSION"
    else
        print_error "Failed to build main Docker image"
        exit 1
    fi
    
    # Build MCP server image
    echo -e "${PURPLE}📦 Building MCP server image...${NC}"
    if docker build \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$GIT_SHA" \
        -t "$MCP_IMAGE_NAME:$VERSION" \
        -t "$MCP_IMAGE_NAME:latest" \
        -f Dockerfile.mcp \
        . > /dev/null 2>&1; then
        print_status "MCP image built: $MCP_IMAGE_NAME:$VERSION"
    else
        print_error "Failed to build MCP Docker image"
        exit 1
    fi
    
    # Build development image
    echo -e "${PURPLE}📦 Building development image...${NC}"
    if docker build \
        --build-arg NODE_ENV=development \
        --target development \
        -t "$DOCKER_IMAGE_NAME:dev" \
        -f Dockerfile \
        . > /dev/null 2>&1; then
        print_status "Development image built: $DOCKER_IMAGE_NAME:dev"
    else
        print_warning "Failed to build development image (non-critical)"
    fi
}

# Function to test Docker images
test_docker_images() {
    echo -e "${BLUE}🧪 Testing Docker images...${NC}"
    
    # Test main image
    if docker run --rm "$DOCKER_IMAGE_NAME:$VERSION" --version > /dev/null 2>&1; then
        print_status "Main image test passed"
    else
        print_error "Main image test failed"
        exit 1
    fi
    
    # Test MCP image
    if docker run --rm "$MCP_IMAGE_NAME:$VERSION" node -e "console.log('MCP test successful')" > /dev/null 2>&1; then
        print_status "MCP image test passed"
    else
        print_error "MCP image test failed"
        exit 1
    fi
}

# Function to login to Docker registry
docker_login() {
    echo -e "${BLUE}🔐 Docker registry login...${NC}"
    
    if [ -n "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin > /dev/null 2>&1
        print_status "Logged in to Docker registry"
    else
        print_info "Please login to Docker registry manually:"
        docker login "$DOCKER_REGISTRY"
    fi
}

# Function to push Docker images
push_docker_images() {
    echo -e "${BLUE}🚀 Pushing Docker images...${NC}"
    
    # Push main images
    echo -e "${PURPLE}📤 Pushing main images...${NC}"
    docker push "$DOCKER_IMAGE_NAME:$VERSION"
    docker push "$DOCKER_IMAGE_NAME:latest"
    print_status "Main images pushed"
    
    # Push MCP images
    echo -e "${PURPLE}📤 Pushing MCP images...${NC}"
    docker push "$MCP_IMAGE_NAME:$VERSION"
    docker push "$MCP_IMAGE_NAME:latest"
    print_status "MCP images pushed"
    
    # Push development image if it exists
    if docker image inspect "$DOCKER_IMAGE_NAME:dev" > /dev/null 2>&1; then
        echo -e "${PURPLE}📤 Pushing development image...${NC}"
        docker push "$DOCKER_IMAGE_NAME:dev"
        print_status "Development image pushed"
    fi
}

# Function to cleanup local images (optional)
cleanup_images() {
    if [ "$1" = "--cleanup" ]; then
        echo -e "${BLUE}🧹 Cleaning up local images...${NC}"
        
        # Remove local images to save space
        docker rmi "$DOCKER_IMAGE_NAME:$VERSION" "$DOCKER_IMAGE_NAME:latest" > /dev/null 2>&1 || true
        docker rmi "$MCP_IMAGE_NAME:$VERSION" "$MCP_IMAGE_NAME:latest" > /dev/null 2>&1 || true
        docker rmi "$DOCKER_IMAGE_NAME:dev" > /dev/null 2>&1 || true
        
        # Prune unused images
        docker image prune -f > /dev/null 2>&1 || true
        
        print_status "Local images cleaned up"
    fi
}

# Function to display image information
display_image_info() {
    echo ""
    echo -e "${CYAN}📊 Built Images Summary${NC}"
    echo "========================"
    echo -e "${GREEN}Main TaskFlow AI:${NC}"
    echo "  - $DOCKER_IMAGE_NAME:$VERSION"
    echo "  - $DOCKER_IMAGE_NAME:latest"
    echo ""
    echo -e "${GREEN}MCP Server:${NC}"
    echo "  - $MCP_IMAGE_NAME:$VERSION"
    echo "  - $MCP_IMAGE_NAME:latest"
    echo ""
    echo -e "${GREEN}Development:${NC}"
    echo "  - $DOCKER_IMAGE_NAME:dev"
    echo ""
    echo -e "${CYAN}📋 Usage Examples:${NC}"
    echo "  # Run main application"
    echo "  docker run -it $DOCKER_IMAGE_NAME:latest"
    echo ""
    echo "  # Run MCP server"
    echo "  docker run -it $MCP_IMAGE_NAME:latest"
    echo ""
    echo "  # Run with custom configuration"
    echo "  docker run -v \$(pwd)/config:/app/config $DOCKER_IMAGE_NAME:latest"
}

# Function to display help
display_help() {
    echo "TaskFlow AI - Local Docker Build & Publish Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --build-only     Only build images, don't push"
    echo "  --push-only      Only push existing images"
    echo "  --cleanup        Remove local images after push"
    echo "  --no-test        Skip image testing"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_PASSWORD  Docker registry password (optional)"
    echo "  DOCKER_USERNAME  Docker registry username (default: agions)"
    echo "  DOCKER_REGISTRY  Docker registry URL (default: docker.io)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full build and push"
    echo "  $0 --build-only       # Only build images"
    echo "  $0 --cleanup          # Build, push, and cleanup"
    echo "  DOCKER_PASSWORD=xxx $0  # Automated login"
}

# Main execution
main() {
    local build_only=false
    local push_only=false
    local cleanup=false
    local no_test=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --push-only)
                push_only=true
                shift
                ;;
            --cleanup)
                cleanup=true
                shift
                ;;
            --no-test)
                no_test=true
                shift
                ;;
            --help|-h)
                display_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                display_help
                exit 1
                ;;
        esac
    done
    
    # Execute based on options
    if [ "$push_only" = true ]; then
        check_prerequisites
        docker_login
        push_docker_images
        cleanup_images $cleanup
    else
        check_prerequisites
        build_project
        build_docker_images
        
        if [ "$no_test" = false ]; then
            test_docker_images
        fi
        
        if [ "$build_only" = false ]; then
            docker_login
            push_docker_images
            cleanup_images $cleanup
        fi
    fi
    
    display_image_info
    
    echo ""
    echo -e "${GREEN}🎉 Docker build and publish completed successfully!${NC}"
}

# Handle script interruption
trap 'echo -e "\n${RED}Script interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
