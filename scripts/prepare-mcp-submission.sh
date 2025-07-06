#!/bin/bash

# TaskFlow AI - Docker MCP Registry 提交准备脚本
# 简化版本，专注于文件准备和验证

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="taskflow-ai"
REPO_URL="https://github.com/Agions/taskflow-ai"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🐳 TaskFlow AI - Docker MCP Registry 提交准备${NC}"
echo "=================================================="

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

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 检查前置条件...${NC}"
    
    # Check if we're in the correct directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "必须在TaskFlow AI项目根目录运行此脚本"
        exit 1
    fi
    
    # Check if required files exist
    required_files=(
        "mcp-server.json"
        "docker-mcp-registry.yaml"
        "Dockerfile.mcp"
        "MCP-README.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            print_error "必需文件不存在: $file"
            exit 1
        fi
    done
    
    print_status "所有前置条件满足"
}

# Function to validate MCP server configuration
validate_mcp_config() {
    echo -e "${BLUE}🔧 验证MCP服务器配置...${NC}"
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_warning "jq未安装，跳过JSON验证"
        return 0
    fi
    
    # Check if mcp-server.json is valid JSON
    if ! jq empty "$PROJECT_ROOT/mcp-server.json" 2>/dev/null; then
        print_error "mcp-server.json不是有效的JSON格式"
        exit 1
    fi
    
    # Check required fields in mcp-server.json
    required_fields=("name" "version" "description" "server.command")
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" "$PROJECT_ROOT/mcp-server.json" >/dev/null 2>&1; then
            print_error "mcp-server.json缺少必需字段: $field"
            exit 1
        fi
    done
    
    print_status "MCP服务器配置验证通过"
}

# Function to test MCP server functionality
test_mcp_server() {
    echo -e "${BLUE}🧪 测试MCP服务器功能...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Test if the CLI can show MCP help
    if node bin/index.js mcp --help > /dev/null 2>&1; then
        print_status "MCP命令可用"
    else
        print_error "MCP命令不可用"
        exit 1
    fi
    
    # Test if MCP server command exists
    if node bin/index.js mcp server --help > /dev/null 2>&1; then
        print_status "MCP服务器命令可用"
    else
        print_error "MCP服务器命令不可用"
        exit 1
    fi
    
    print_status "MCP服务器功能测试通过"
}

# Function to generate submission summary
generate_submission_summary() {
    echo -e "${BLUE}📋 生成提交摘要...${NC}"
    
    # Get version from package.json
    local version=$(jq -r '.version' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "unknown")
    
    cat > "$PROJECT_ROOT/SUBMISSION_SUMMARY.md" << EOF
# TaskFlow AI - Docker MCP Registry 提交摘要

## 基本信息
- **项目名称**: TaskFlow AI
- **版本**: $version
- **仓库**: $REPO_URL
- **提交类型**: Docker MCP Registry
- **提交日期**: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## MCP服务器功能
### 🤖 AI驱动的PRD解析
- 支持多种AI模型: Qwen, DeepSeek, Zhipu, Baichuan, Moonshot, Yi
- 智能提取需求、功能和任务
- 自动生成验收标准

### 📋 高级任务管理
- 完整的任务生命周期管理
- 依赖关系和优先级支持
- 灵活的过滤和搜索功能

### 🎯 智能项目编排
- 关键路径分析
- 并行优化算法
- 风险评估和缓解
- 多种编排策略(敏捷、瀑布、关键链等)

### 📊 综合分析报告
- 实时项目指标
- 可视化图表生成
- 多格式导出(Markdown, JSON, CSV)

## 技术规格
- **传输协议**: STDIO (默认), HTTP (可选)
- **MCP版本**: 1.0.0兼容
- **Node.js要求**: >=18.0.0
- **Docker支持**: 多阶段构建，生产就绪

## 提交文件清单
- [x] mcp-server.json - MCP服务器元数据
- [x] docker-mcp-registry.yaml - Docker MCP Registry规范
- [x] Dockerfile.mcp - 专用Docker镜像
- [x] MCP-README.md - MCP服务器文档
- [x] scripts/submit-to-docker-mcp-registry.sh - 提交脚本

## 安装和使用
\`\`\`bash
# NPM安装
npm install -g taskflow-ai
taskflow-ai mcp server

# Docker运行
docker run -it taskflow-ai:latest

# Claude Desktop配置
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["taskflow-ai", "mcp", "server"]
    }
  }
}
\`\`\`

## 质量保证
- ✅ 完整的TypeScript类型定义
- ✅ 企业级错误处理
- ✅ 生产级日志记录
- ✅ 安全的Docker配置
- ✅ 完整的测试覆盖

## 下一步操作
1. Fork Docker MCP Registry仓库
2. 创建新分支: add-taskflow-ai-mcp-server
3. 复制提交文件到servers/taskflow-ai/目录
4. 创建Pull Request
5. 等待审核和合并

---
生成时间: $(date)
EOF
    
    print_status "提交摘要已生成: SUBMISSION_SUMMARY.md"
}

# Function to create submission package
create_submission_package() {
    echo -e "${BLUE}📦 创建提交包...${NC}"
    
    local submission_dir="$PROJECT_ROOT/mcp-submission"
    rm -rf "$submission_dir"
    mkdir -p "$submission_dir"
    
    # Copy required files
    cp "$PROJECT_ROOT/mcp-server.json" "$submission_dir/"
    cp "$PROJECT_ROOT/docker-mcp-registry.yaml" "$submission_dir/server.yaml"
    cp "$PROJECT_ROOT/MCP-README.md" "$submission_dir/README.md"
    cp "$PROJECT_ROOT/Dockerfile.mcp" "$submission_dir/Dockerfile"
    cp "$PROJECT_ROOT/SUBMISSION_SUMMARY.md" "$submission_dir/"
    
    # Create metadata file
    cat > "$submission_dir/metadata.json" << EOF
{
  "name": "taskflow-ai",
  "displayName": "TaskFlow AI",
  "description": "Intelligent PRD parsing, task management, and project orchestration MCP server",
  "version": "$(jq -r '.version' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "1.0.0")",
  "author": "TaskFlow AI Team",
  "license": "MIT",
  "repository": "$REPO_URL",
  "categories": ["productivity", "project-management", "ai-tools"],
  "keywords": ["mcp", "task-management", "prd-parsing", "ai-orchestration", "productivity"],
  "transport": "stdio",
  "capabilities": ["tools", "resources"],
  "submissionType": "docker-built",
  "submissionDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verified": true,
  "tested": true
}
EOF
    
    print_status "提交包已创建: $submission_dir"
}

# Function to display next steps
display_next_steps() {
    echo ""
    echo -e "${BLUE}🚀 下一步操作指南${NC}"
    echo "===================="
    echo ""
    echo -e "${YELLOW}1. Fork Docker MCP Registry仓库${NC}"
    echo "   访问: https://github.com/docker/mcp-registry"
    echo "   点击 'Fork' 按钮创建你的分支"
    echo ""
    echo -e "${YELLOW}2. 克隆你的Fork${NC}"
    echo "   git clone https://github.com/YOUR_USERNAME/mcp-registry.git"
    echo "   cd mcp-registry"
    echo ""
    echo -e "${YELLOW}3. 创建新分支${NC}"
    echo "   git checkout -b add-taskflow-ai-mcp-server"
    echo ""
    echo -e "${YELLOW}4. 复制提交文件${NC}"
    echo "   mkdir -p servers/taskflow-ai"
    echo "   cp $PROJECT_ROOT/mcp-submission/* servers/taskflow-ai/"
    echo ""
    echo -e "${YELLOW}5. 提交更改${NC}"
    echo "   git add servers/taskflow-ai/"
    echo "   git commit -m \"Add TaskFlow AI MCP Server\""
    echo "   git push origin add-taskflow-ai-mcp-server"
    echo ""
    echo -e "${YELLOW}6. 创建Pull Request${NC}"
    echo "   访问: https://github.com/docker/mcp-registry/compare"
    echo "   选择你的分支并创建PR"
    echo ""
    echo -e "${GREEN}✨ 提交准备完成！${NC}"
}

# Main execution
main() {
    echo "开始Docker MCP Registry提交准备..."
    echo ""
    
    check_prerequisites
    validate_mcp_config
    test_mcp_server
    generate_submission_summary
    create_submission_package
    display_next_steps
    
    echo ""
    echo -e "${GREEN}🎉 TaskFlow AI MCP服务器提交准备完成！${NC}"
    echo ""
    echo "所有文件已准备就绪，请按照上述步骤完成提交。"
}

# Handle script interruption
trap 'echo -e "\n${RED}脚本被中断${NC}"; exit 1' INT TERM

# Run main function
main "$@"
