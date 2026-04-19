# Docker Deployment Guide

This guide covers deploying TaskFlow AI using Docker containers.

## Prerequisites

### Docker Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

**CentOS/RHEL:**
```bash
sudo yum install -y docker docker-compose
sudo systemctl enable docker
sudo systemctl start docker
```

**macOS:**
```bash
brew install docker docker-compose
# Or install Docker Desktop from https://docker.com/products/docker-desktop
```

**Windows:**
Install Docker Desktop from https://docker.com/products/docker-desktop

### Verify Installation

```bash
docker --version
docker-compose --version
sudo docker run hello-world
```

## Image Building

### Build from Dockerfile

```bash
# Clone the repository
git clone https://github.com/taskflow-ai/taskflow-ai.git
cd taskflow-ai

# Build the image
docker build -t taskflow-ai:latest .
```

### Build with Custom Tag

```bash
docker build -t taskflow-ai:1.0.0 .
```

### Build with Build Arguments

```bash
docker build --build-arg NODE_ENV=production -t taskflow-ai:latest .
```

## Docker-Compose Setup

### Basic Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: taskflow-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://taskflow:password@db:5432/taskflow
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: taskflow-db
    environment:
      - POSTGRES_USER=taskflow
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=taskflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 30s
      timeout: 10s
      retries: 3

  cache:
    image: redis:7-alpine
    container_name: taskflow-cache
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

### Production Configuration with Nginx

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: taskflow-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: taskflow-app
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://taskflow:password@db:5432/taskflow
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: taskflow-db
    environment:
      - POSTGRES_USER=taskflow
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=taskflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 30s
      timeout: 10s
      retries: 3

  cache:
    image: redis:7-alpine
    container_name: taskflow-cache
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

## Environment Configuration

### Environment File

Create `.env` file:

```bash
# Application
NODE_ENV=production
PORT=3000
APP_URL=https://taskflow.example.com

# Database
DATABASE_URL=postgresql://taskflow:password@db:5432/taskflow
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://cache:6379

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=7d

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASSWORD=password

# Storage
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads
```

### Loading Environment Variables

Update `docker-compose.yml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env
```

## Data Persistence

### Volume Management

Docker volumes persist data between container restarts:

```bash
# List volumes
docker volume ls | grep taskflow

# Inspect volume
docker volume inspect taskflow-ai_postgres_data
```

### Backing Up Data

```bash
# Backup PostgreSQL
docker exec taskflow-db pg_dump -U taskflow taskflow > backup.sql

# Backup Redis
docker exec taskflow-cache redis-cli SAVE
docker cp taskflow-cache:/data/dump.rdb ./redis_backup.rdb
```

### Restoring Data

```bash
# Restore PostgreSQL
cat backup.sql | docker exec -i taskflow-db psql -U taskflow taskflow

# Restore Redis
docker cp redis_backup.rdb taskflow-cache:/data/dump.rdb
docker restart taskflow-cache
```

## Health Checks

### Application Health Endpoint

Ensure your application has a `/health` endpoint returning:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### Container Health Checks

Docker health checks are already configured in `docker-compose.yml`:

```bash
# View container health status
docker inspect --format='{{.State.Health}}' taskflow-app

# View health check logs
docker inspect --format='{{range .State.Health.Log}} {{.Output}} {{end}}' taskflow-app
```

### Monitoring Commands

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f app

# View logs for specific service
docker compose logs -f db

# Check resource usage
docker stats

# Execute health check manually
docker exec taskflow-app curl -f http://localhost:3000/health
```

## Deployment Commands

### Starting Services

```bash
# Start all services
docker compose up -d

# Start with rebuild
docker compose up -d --build

# Start specific services
docker compose up -d app db
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Stop and remove images
docker compose down --rmi local
```

### Scaling Services

```bash
# Scale app service
docker compose up -d --scale app=3

# Note: Requires load balancer configuration for horizontal scaling
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker compose logs app
docker compose config --validate
```

**Database connection issues:**
```bash
docker exec taskflow-db psql -U taskflow -d taskflow -c "SELECT 1;"
docker exec taskflow-app nc -zv db 5432
```

**Permission issues:**
```bash
sudo chown -R $USER:$USER .
docker exec taskflow-app ls -la /app
```

### Restarting Containers

```bash
# Restart single service
docker compose restart app

# Restart all services
docker compose restart
```

### Shell Access

```bash
# Access app container
docker exec -it taskflow-app sh

# Access database
docker exec -it taskflow-db psql -U taskflow taskflow
```
