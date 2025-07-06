# TaskFlow AI - MCP Server

[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue)](https://hub.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

Intelligent PRD parsing, task management, and project orchestration MCP server with advanced AI capabilities.

## 🚀 Features

### 🤖 AI-Powered PRD Parsing
- **Multi-Model Support**: Qwen, DeepSeek, Zhipu, Baichuan, Moonshot, Yi
- **Structured Extraction**: Features, requirements, tasks, and acceptance criteria
- **Intelligent Analysis**: Context-aware parsing with semantic understanding

### 📋 Advanced Task Management
- **Comprehensive Metadata**: Dependencies, priorities, time estimates, tags
- **Status Tracking**: Pending, in-progress, completed, blocked, cancelled
- **Flexible Filtering**: By status, priority, assignee, tags, and more

### 🎯 Intelligent Orchestration
- **Critical Path Analysis**: Identify project bottlenecks and dependencies
- **Parallel Optimization**: Maximize resource utilization and efficiency
- **Risk Assessment**: Proactive identification of potential issues
- **Multiple Strategies**: Agile, Waterfall, Critical Chain, Lean Startup, and more

### 📊 Comprehensive Analytics
- **Real-time Metrics**: Progress tracking and performance indicators
- **Visual Reports**: Gantt charts, status dashboards, risk assessments
- **Export Options**: Markdown, JSON, CSV formats

## 🛠️ Installation

### NPM (Recommended)
```bash
npm install -g taskflow-ai
taskflow-ai mcp
```

### Docker
```bash
docker run -it taskflow-ai:latest
```

### From Source
```bash
git clone https://github.com/Agions/taskflow-ai.git
cd taskflow-ai
npm install
npm run build
node bin/index.js mcp
```

## 📖 MCP Client Configuration

### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taskflow-ai": {
      "command": "npx",
      "args": ["taskflow-ai", "mcp"],
      "env": {
        "AI_MODEL": "qwen",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Docker Compose
```yaml
version: '3.8'
services:
  taskflow-mcp:
    image: taskflow-ai:latest
    environment:
      - AI_MODEL=qwen
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
```

## 🔧 Available Tools

### `parse_prd`
Parse Product Requirements Documents and extract structured information.

**Parameters:**
- `content` (string, required): PRD content in markdown or text format
- `options` (object, optional): Parsing configuration
  - `extractTasks` (boolean): Extract actionable tasks
  - `generateAcceptanceCriteria` (boolean): Generate acceptance criteria
  - `aiModel` (string): AI model to use (qwen, deepseek, zhipu, etc.)

**Example:**
```json
{
  "tool": "parse_prd",
  "arguments": {
    "content": "# Feature: User Authentication\n\n## Requirements\n- User login with email/password\n- Password reset functionality",
    "options": {
      "extractTasks": true,
      "aiModel": "qwen"
    }
  }
}
```

### `create_task`
Create new project tasks with comprehensive metadata.

**Parameters:**
- `title` (string, required): Task title
- `description` (string, required): Detailed description
- `priority` (string): Priority level (low, medium, high, critical)
- `estimatedHours` (number): Time estimate in hours
- `dependencies` (array): List of dependent task IDs
- `tags` (array): Categorization tags

### `orchestrate_tasks`
Perform intelligent task orchestration and optimization.

**Parameters:**
- `preset` (string): Strategy preset (agile_sprint, waterfall, critical_chain, etc.)
- `config` (object): Custom configuration options
- `dryRun` (boolean): Preview results without applying changes

**Example:**
```json
{
  "tool": "orchestrate_tasks",
  "arguments": {
    "preset": "agile_sprint",
    "config": {
      "enableCriticalPath": true,
      "enableParallelOptimization": true,
      "maxParallelTasks": 5
    }
  }
}
```

### `generate_report`
Generate various project reports and analytics.

**Parameters:**
- `type` (string, required): Report type (status, progress, gantt, risk, resource)
- `format` (string): Output format (markdown, json, csv)
- `includeCharts` (boolean): Include visual charts

## 📚 Available Resources

### Project Overview (`taskflow://project/overview`)
Complete project overview with tasks, metrics, and status information.

### All Tasks (`taskflow://tasks/all`)
Comprehensive list of all project tasks with full metadata.

### Analytics Dashboard (`taskflow://analytics/dashboard`)
Real-time project analytics and performance metrics.

### Orchestration Status (`taskflow://orchestration/status`)
Current task orchestration status and optimization recommendations.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `AI_MODEL` | Default AI model for PRD parsing | `qwen` | qwen, deepseek, zhipu, baichuan, moonshot, yi |
| `LOG_LEVEL` | Logging verbosity | `info` | debug, info, warn, error |
| `TASKFLOW_DATA_DIR` | Data directory path | `./data` | Any valid path |
| `TASKFLOW_LOG_DIR` | Log directory path | `./logs` | Any valid path |
| `TASKFLOW_CONFIG_PATH` | Configuration file path | - | Path to config file |

### Configuration File
Create a `taskflow.config.json` file:

```json
{
  "ai": {
    "defaultModel": "qwen",
    "models": {
      "qwen": {
        "apiKey": "your-api-key",
        "baseUrl": "https://api.qwen.com"
      }
    }
  },
  "orchestration": {
    "defaultPreset": "agile_sprint",
    "maxParallelTasks": 10,
    "bufferPercentage": 0.1
  },
  "logging": {
    "level": "info",
    "file": true
  }
}
```



## 🔍 Usage Examples

### 1. Parse PRD and Create Tasks
```bash
# Using Claude Desktop with TaskFlow AI MCP server
"Parse this PRD and create tasks: # User Management System..."
```

### 2. Orchestrate Project Tasks
```bash
# Optimize task scheduling using agile methodology
"Orchestrate my project tasks using agile sprint methodology with critical path analysis"
```

### 3. Generate Status Report
```bash
# Create comprehensive project report
"Generate a detailed project status report in markdown format with charts"
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://github.com/Agions/taskflow-ai/blob/main/docs)
- 🐛 [Issues](https://github.com/Agions/taskflow-ai/issues)
- 💬 [Discussions](https://github.com/Agions/taskflow-ai/discussions)
- 📧 Email: support@taskflow-ai.com

## 🏷️ Tags

`mcp` `task-management` `project-management` `prd-parsing` `ai-orchestration` `productivity` `planning` `requirements` `agile` `automation`
