#!/bin/bash

# TaskFlow AI - Docker MCP Registry Submission Script
# This script prepares and submits TaskFlow AI to the Docker MCP Registry

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
MCP_REGISTRY_REPO="https://github.com/docker/mcp-registry"
SUBMISSION_BRANCH="add-taskflow-ai-mcp-server"

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMP_DIR="/tmp/mcp-registry-submission"

echo -e "${BLUE}🐳 TaskFlow AI - Docker MCP Registry Submission${NC}"
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
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git and try again."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check if we're in the correct directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "This script must be run from the TaskFlow AI project root directory."
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
            print_error "Required file not found: $file"
            exit 1
        fi
    done
    
    print_status "All prerequisites met"
}

# Function to validate MCP server configuration
validate_mcp_config() {
    echo -e "${BLUE}🔧 Validating MCP server configuration...${NC}"
    
    # Check if mcp-server.json is valid JSON
    if ! jq empty "$PROJECT_ROOT/mcp-server.json" 2>/dev/null; then
        print_error "mcp-server.json is not valid JSON"
        exit 1
    fi
    
    # Check required fields in mcp-server.json
    required_fields=("name" "version" "description" "server.command")
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" "$PROJECT_ROOT/mcp-server.json" >/dev/null 2>&1; then
            print_error "Required field missing in mcp-server.json: $field"
            exit 1
        fi
    done
    
    print_status "MCP server configuration is valid"
}

# Function to build and test Docker image
build_and_test_docker() {
    echo -e "${BLUE}🐳 Building and testing Docker image...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Build the MCP Docker image
    echo "Building Docker image..."
    if docker build -f Dockerfile.mcp -t taskflow-ai-mcp:test . > /dev/null 2>&1; then
        print_status "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
    
    # Test the Docker image
    echo "Testing Docker image..."
    if docker run --rm taskflow-ai-mcp:test node -e "console.log('Test successful')" > /dev/null 2>&1; then
        print_status "Docker image test passed"
    else
        print_error "Docker image test failed"
        exit 1
    fi
    
    # Clean up test image
    docker rmi taskflow-ai-mcp:test > /dev/null 2>&1 || true
}

# Function to prepare submission files
prepare_submission() {
    echo -e "${BLUE}📝 Preparing submission files...${NC}"
    
    # Create temporary directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    
    # Clone the MCP registry repository
    echo "Cloning MCP registry repository..."
    git clone "$MCP_REGISTRY_REPO" "$TEMP_DIR/mcp-registry" > /dev/null 2>&1
    
    cd "$TEMP_DIR/mcp-registry"
    
    # Create a new branch for our submission
    git checkout -b "$SUBMISSION_BRANCH" > /dev/null 2>&1
    
    # Create the server directory
    SERVER_DIR="servers/$REPO_NAME"
    mkdir -p "$SERVER_DIR"
    
    # Copy submission files
    cp "$PROJECT_ROOT/mcp-server.json" "$SERVER_DIR/"
    cp "$PROJECT_ROOT/docker-mcp-registry.yaml" "$SERVER_DIR/server.yaml"
    cp "$PROJECT_ROOT/MCP-README.md" "$SERVER_DIR/README.md"
    cp "$PROJECT_ROOT/Dockerfile.mcp" "$SERVER_DIR/Dockerfile"
    
    # Create a simple server metadata file
    cat > "$SERVER_DIR/metadata.json" << EOF
{
  "name": "taskflow-ai",
  "displayName": "TaskFlow AI",
  "description": "Intelligent PRD parsing, task management, and project orchestration MCP server",
  "version": "1.0.0",
  "author": "TaskFlow AI Team",
  "license": "MIT",
  "repository": "$REPO_URL",
  "categories": ["productivity", "project-management", "ai-tools"],
  "keywords": ["mcp", "task-management", "prd-parsing", "ai-orchestration", "productivity"],
  "transport": "stdio",
  "capabilities": ["tools", "resources"],
  "submissionType": "docker-built",
  "submissionDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    print_status "Submission files prepared"
}

# Function to create pull request
create_pull_request() {
    echo -e "${BLUE}🚀 Creating pull request...${NC}"
    
    cd "$TEMP_DIR/mcp-registry"
    
    # Add and commit changes
    git add .
    git commit -m "Add TaskFlow AI MCP Server

- Intelligent PRD parsing with multiple AI models
- Advanced task management with dependencies and metadata
- AI-powered project orchestration with critical path analysis
- Comprehensive analytics and reporting capabilities
- Docker-ready deployment with production-grade features

Categories: productivity, project-management, ai-tools
Transport: stdio
Capabilities: tools, resources
Submission Type: Docker-built image (recommended)

Repository: $REPO_URL
License: MIT
Version: 1.0.0" > /dev/null 2>&1
    
    print_status "Changes committed to branch: $SUBMISSION_BRANCH"
    
    # Display next steps
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Push the branch to your fork of the MCP registry:"
    echo "   cd $TEMP_DIR/mcp-registry"
    echo "   git remote add fork https://github.com/YOUR_USERNAME/mcp-registry.git"
    echo "   git push fork $SUBMISSION_BRANCH"
    echo ""
    echo "2. Create a pull request on GitHub:"
    echo "   - Go to: https://github.com/docker/mcp-registry/compare"
    echo "   - Select your fork and the '$SUBMISSION_BRANCH' branch"
    echo "   - Title: 'Add TaskFlow AI MCP Server'"
    echo "   - Include the description from the commit message"
    echo ""
    echo "3. Wait for review and approval from the Docker MCP Registry team"
    echo ""
    echo -e "${GREEN}✨ Submission preparation complete!${NC}"
}

# Function to display submission summary
display_summary() {
    echo ""
    echo -e "${BLUE}📊 Submission Summary${NC}"
    echo "===================="
    echo "Server Name: taskflow-ai"
    echo "Version: 1.0.0"
    echo "Repository: $REPO_URL"
    echo "Submission Type: Docker-built image (recommended)"
    echo "Categories: productivity, project-management, ai-tools"
    echo "Transport: stdio"
    echo "Capabilities: tools, resources"
    echo ""
    echo "Files prepared:"
    echo "- servers/taskflow-ai/mcp-server.json"
    echo "- servers/taskflow-ai/server.yaml"
    echo "- servers/taskflow-ai/README.md"
    echo "- servers/taskflow-ai/Dockerfile"
    echo "- servers/taskflow-ai/metadata.json"
    echo ""
    echo "Submission directory: $TEMP_DIR/mcp-registry"
}

# Function to cleanup
cleanup() {
    if [ "$1" != "keep" ]; then
        echo -e "${BLUE}🧹 Cleaning up...${NC}"
        rm -rf "$TEMP_DIR"
        print_status "Cleanup complete"
    fi
}

# Main execution
main() {
    echo "Starting Docker MCP Registry submission process..."
    echo ""
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Please install jq and try again."
        exit 1
    fi
    
    check_prerequisites
    validate_mcp_config
    build_and_test_docker
    prepare_submission
    create_pull_request
    display_summary
    
    echo ""
    echo -e "${GREEN}🎉 TaskFlow AI MCP Server submission preparation complete!${NC}"
    echo ""
    echo "The submission files are ready in: $TEMP_DIR/mcp-registry"
    echo "Follow the next steps above to complete the submission process."
    echo ""
    
    # Ask if user wants to keep the temporary directory
    read -p "Keep temporary submission directory? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    else
        cleanup keep
        echo "Temporary directory preserved: $TEMP_DIR/mcp-registry"
    fi
}

# Handle script interruption
trap 'echo -e "\n${RED}Script interrupted${NC}"; cleanup; exit 1' INT TERM

# Run main function
main "$@"
