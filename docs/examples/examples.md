# TaskFlow AI Examples

Welcome to the TaskFlow AI examples index. This page provides an overview of available examples and common use cases demonstrating how to use TaskFlow AI with different types of projects.

---

## 📁 Example Files Overview

| File | Description | Project Type |
|------|-------------|--------------|
| [example-prd.md](./example-prd.md) | E-commerce user management system PRD | Enterprise Backend |
| [guide/examples.md](../guide/examples.md) | Comprehensive usage examples with 7+ project types | All Types |

---

## 🚀 Quick Start Examples

### Basic Project Setup

```bash
# Install TaskFlow AI
npm install -g taskflow-ai

# Initialize in existing project
cd my-project
taskflow init

# Configure AI model
taskflow config set models.deepseek.apiKey "your-api-key"

# Parse a PRD document
taskflow parse docs/requirements.md

# View generated tasks
taskflow status list
```

### Parsing a PRD and Generating Tasks

```bash
# Parse PRD with default settings
taskflow parse docs/prd.md

# Parse with specific AI model
taskflow parse docs/prd.md --model deepseek

# Parse with verbose output
taskflow parse docs/prd.md --verbose
```

---

## 💻 Common Use Cases

### 1. Web Application Development

**Use Case**: Building a React + Node.js web application

```bash
# Initialize project
taskflow init --project-type webapp

# Parse web application PRD
taskflow parse docs/webapp-prd.md --framework react

# Generate tasks with frontend focus
taskflow plan docs/webapp-prd.md --focus frontend,backend
```

**Example Workflow Configuration**:
```json
{
  "project": {
    "name": "my-webapp",
    "type": "webapp",
    "framework": "react"
  },
  "tasks": {
    "autoGenerate": true,
    "includeTests": true
  }
}
```

---

### 2. Backend API Development

**Use Case**: Creating a RESTful API with Express/FastAPI

```bash
# Initialize API project
taskflow init --project-type api

# Parse API specification
taskflow parse docs/api-spec.md --focus endpoints,authentication

# Generate with database tasks
taskflow plan docs/api-spec.md --include database,testing
```

**Example PRD Snippet** (`api-prd.md`):
```markdown
# RESTful API Project

## Endpoints

### GET /api/users
- Returns list of users
- Authentication: Bearer Token
- Pagination: page, limit

### POST /api/users
- Creates new user
- Body: { name, email, password }
- Returns: created user object

## Data Models

### User
- id: UUID (primary key)
- name: string (required)
- email: string (unique, required)
- password: string (hashed)
- created_at: timestamp
```

---

### 3. Mobile Application Development

**Use Case**: React Native or Flutter mobile app

```bash
# Initialize mobile project
taskflow init --project-type mobile

# Parse mobile PRD with platform focus
taskflow parse docs/mobile-prd.md --platform ios,android

# Generate platform-specific tasks
taskflow plan docs/mobile-prd.md --include native-features
```

---

### 4. Microservices Architecture

**Use Case**: Enterprise microservices with multiple services

```bash
# Initialize microservices project
taskflow init --project-type microservices

# Parse architecture PRD
taskflow parse docs/microservices-prd.md --architecture microservices

# Generate multi-service plan
taskflow plan docs/microservices-prd.md \
  --team-size 12 \
  --include-devops,monitoring
```

**Example Service Structure**:
```yaml
services:
  - name: user-service
    port: 3001
    dependencies: []
  - name: order-service
    port: 3002
    dependencies: [user-service, payment-service]
  - name: payment-service
    port: 3003
    dependencies: []
```

---

### 5. Data Science / ML Projects

**Use Case**: Machine learning pipeline with data processing

```bash
# Initialize ML project
taskflow init --project-type ml

# Parse ML project PRD
taskflow parse docs/ml-prd.md --domain machine-learning

# Generate with ML-specific tasks
taskflow plan docs/ml-prd.md \
  --include data-processing,model-training,evaluation
```

---

### 6. Enterprise Application (ERP/CRM)

**Use Case**: Large-scale enterprise system

```bash
# Initialize enterprise project
taskflow init --project-type enterprise

# Parse enterprise PRD with compliance
taskflow parse docs/enterprise-prd.md \
  --scale enterprise \
  --compliance requirements

# Generate comprehensive plan
taskflow plan docs/enterprise-prd.md \
  --team-size 20 \
  --sprint-duration 21 \
  --include security,audit,compliance
```

---

## 📊 Output Format Examples

### JSON Output

```bash
taskflow parse docs/prd.md --output json
```

```json
{
  "project": "my-project",
  "tasks": [
    {
      "id": "task-001",
      "title": "Setup project structure",
      "type": "setup",
      "priority": "high",
      "estimatedHours": 4,
      "dependencies": []
    },
    {
      "id": "task-002",
      "title": "Implement user authentication",
      "type": "development",
      "priority": "high",
      "estimatedHours": 16,
      "dependencies": ["task-001"]
    }
  ],
  "stats": {
    "totalTasks": 2,
    "totalHours": 20,
    "criticalPath": ["task-001", "task-002"]
  }
}
```

### Table Output

```bash
taskflow status list --format table
```

```
┌─────────────┬──────────────────────────┬──────────┬──────────┬──────────┐
│ ID          │ Task Name               │ Status   │ Priority │ Hours    │
├─────────────┼──────────────────────────┼──────────┼──────────┼──────────┤
│ task-001    │ Setup project structure │ Done     │ High     │ 4        │
│ task-002    │ User authentication      │ In Prog  │ High     │ 16       │
│ task-003    │ API endpoints            │ Pending  │ High     │ 24       │
└─────────────┴──────────────────────────┴──────────┴──────────┴──────────┘
```

### Markdown Report

```bash
taskflow plan docs/prd.md --output report.md --format markdown
```

---

## 🔧 Advanced Configuration Examples

### Multi-Model Setup

```bash
# Enable multi-model support
taskflow config set multiModel.enabled true
taskflow config set multiModel.primary "deepseek"
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# Use multi-model parsing
taskflow parse docs/prd.md --multi-model
```

### Team Configuration

```bash
# Configure team members
taskflow config set team.members '["Alice", "Bob", "Charlie"]'

# Assign tasks
taskflow status update task-001 in_progress --assignee "Alice"

# View team progress
taskflow status progress --by-member
```

### CI/CD Integration

```yaml
# .github/workflows/taskflow.yml
name: TaskFlow Analysis
on:
  push:
    paths: ['docs/**/*.md']

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup TaskFlow AI
        run: npm install -g taskflow-ai
      - name: Parse PRD
        run: taskflow parse docs/prd.md --output results.json
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: taskflow-results
          path: results.json
```

---

## 📈 Task Management Examples

### Task Lifecycle

```bash
# Get next recommended task
taskflow status next

# Start a task
taskflow status update task-001 in_progress

# Add work comment
taskflow status update task-001 in_progress --comment "Working on auth module"

# Complete a task
taskflow status update task-001 completed --comment "Auth module complete"

# View dependencies
taskflow status dependencies task-002

# View critical path
taskflow status critical-path
```

### Sprint Management

```bash
# Create sprint
taskflow sprint create --name "Sprint-1" --duration "2-weeks"

# Add tasks to sprint
taskflow sprint add-tasks task-001,task-002,task-003

# View sprint progress
taskflow sprint progress --name "Sprint-1"

# Complete sprint
taskflow sprint complete "Sprint-1"
```

---

## 🛠️ Plugin and Template Examples

### Using Built-in Templates

```bash
# List available templates
taskflow template list

# Apply template
taskflow template apply api-template

# Create custom template
taskflow template create --name my-template --from-existing
```

### Plugin System

```bash
# List available plugins
taskflow plugin list

# Install plugin
taskflow plugin install prd-enhancer

# Enable plugin
taskflow plugin enable prd-enhancer
```

---

## 📝 PRD Format Examples

### Minimal PRD

```markdown
# Project Name

## Features

- User registration
- User login
- Profile management

## Technical Stack

- Frontend: React
- Backend: Node.js
- Database: PostgreSQL
```

### Comprehensive PRD

See [example-prd.md](./example-prd.md) for a complete PRD example with:
- User stories with acceptance criteria
- API design specifications
- Database schema definitions
- Non-functional requirements
- Risk assessment

---

## 🎯 Best Practices by Project Type

| Project Type | Recommended Setup | Key Focus Areas |
|-------------|-------------------|-----------------|
| **Startup MVP** | Fast iteration, minimal features | Speed to market, core value |
| **Enterprise** | Multi-team, compliance | Security, audit, documentation |
| **Open Source** | Contributor-friendly | Clear tasks, good first issues |
| **Internal Tool** | Efficiency focused | Automation, integration |
| **ML/AI Project** | Experiment tracking | Data pipeline, model versioning |

---

## 🔗 Related Documentation

- [Getting Started Guide](../guide/getting-started.md) - Step-by-step tutorial
- [User Manual](../user-guide/user-manual.md) - Complete feature reference
- [Workflows Guide](../user-guide/workflows.md) - Team collaboration workflows
- [CLI Commands Reference](../cli/commands.md) - Full command documentation
- [Configuration Reference](../reference/configuration.md) - Configuration options
- [API Documentation](../api/index.md) - Programmatic API reference

---

## 💡 Tips and Tricks

1. **Use `--dry-run` to preview** before executing potentially destructive commands
2. **Enable `--verbose`** for detailed debugging output
3. **Use `taskflow config validate`** after configuration changes
4. **Run `taskflow backup create`** regularly to prevent data loss
5. **Use `taskflow status next`** to get AI-recommended next task

```bash
# Dry run example
taskflow parse docs/prd.md --dry-run

# Backup before major changes
taskflow backup create --name "pre-refactor"

# Validate configuration
taskflow config validate
```
