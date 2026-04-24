# ⚙️ 运维部署手册 v4.0

TaskFlow AI v4.0的运维体系确保系统的高可用性、安全性和可维护性，支持快速迭代和可靠部署。

## 🎯 运维目标

### 1. SLA保障指标

| 服务级别 | 可用性 | 响应时间 | 恢复时间 |
|---------|--------|----------|----------|
| **生产环境** | 99.9% | <2s | <15min |
| **预发布环境** | 99.5% | <3s | <30min |
| **开发环境** | 95% | <5s | <2h |

### 2. 运维原则

- ✅ **基础设施即代码**: 所有配置版本化管理
- ✅ **不可变基础设施**: 每次部署都是全新的环境
- ✅ **自动化优先**: 减少人工干预，提高可靠性
- ✅ **监控先行**: 事前预防优于事后修复

## 🏗️ 基础设施架构

### 1. 容器化部署

```dockerfile
# Dockerfile - 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Security hardening
RUN addgroup -g 1001 -S taskflow && \
    adduser -u 1001 -S taskflow -G taskflow

USER taskflow

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### 2. Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://taskflow:password@db:5432/taskflow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - taskflow-network
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - taskflow-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - taskflow-network

volumes:
  postgres_data:
  redis_data:

networks:
  taskflow-network:
    driver: bridge
```

## 🚀 部署策略

### 1. CI/CD流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: agions/taskflow-ai:latest,agions/taskflow-ai:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Kubernetes
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" > kubeconfig.yaml
          export KUBECONFIG=kubeconfig.yaml
          kubectl set image deployment/taskflow-app taskflow-app=agions/taskflow-ai:${{ github.sha }}
          kubectl rollout status deployment/taskflow-app --timeout=60s
```

### 2. 蓝绿部署脚本

```bash
#!/bin/bash
# blue-green-deploy.sh

BLUE_DEPLOYMENT="taskflow-blue"
GREEN_DEPLOYMENT="taskflow-green"

echo "🔄 执行蓝绿部署..."

# 1. 检查当前活跃部署
ACTIVE=$(kubectl get service taskflow-service -o jsonpath='{.spec.selector.deployment}')

if [ "$ACTIVE" = "$BLUE_DEPLOYMENT" ]; then
    TARGET="$GREEN_DEPLOYMENT"
    CURRENT="$BLUE_DEPLOYMENT"
else
    TARGET="$BLUE_DEPLOYMENT"
    CURRENT="$GREEN_DEPLOYMENT"
fi

echo "📦 部署到 $TARGET..."

# 2. 更新部署镜像
kubectl set image deployment/$TARGET taskflow-app=agions/taskflow-ai:$1

# 3. 等待部署完成
echo "⏳ 等待部署完成..."
kubectl rollout status deployment/$TARGET --timeout=300s

if [ $? -ne 0 ]; then
    echo "❌ 部署失败，回滚到 $CURRENT"
    kubectl set selector service/taskflow-service deployment=$CURRENT
    exit 1
fi

# 4. 验证健康状态
echo "🔍 验证服务健康状态..."
sleep 10 # 给应用启动时间

if curl -f http://taskflow-service/health; then
    echo "✅ 健康检查通过"
    
    # 5. 切换流量
    echo "🔀 切换流量到 $TARGET..."
    kubectl set selector service/taskflow-service deployment=$TARGET
    
    # 6. 清理旧部署
    echo "🧹 清理旧部署..."
    kubectl delete deployment $CURRENT
    kubectl delete configmap $CURRENT-config 2>/dev/null || true
    
    echo "🎉 蓝绿部署完成！"
else
    echo "❌ 健康检查失败，回滚到 $CURRENT"
    kubectl set selector service/taskflow-service deployment=$CURRENT
    exit 1
fi
```

## 🔍 监控告警体系

### 1. Prometheus配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alert.rules.yml'

scrape_configs:
  - job_name: 'taskflow-app'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:3000']
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
    - scheme: http
      static_configs:
        - targets: ['alertmanager:9093']
```

### 2. Grafana仪表板

**关键面板配置**:
```json
{
  "dashboard": {
    "title": "TaskFlow AI 生产监控",
    "panels": [
      {
        "title": "请求成功率",
        "type": "graph",
        "targets": [{
          "expr": "rate(http_requests_total{status=~\"2..\"}[5m]) / rate(http_requests_total[5m]) * 100"
        }]
      },
      {
        "title": "响应时间分布",
        "type": "histogram",
        "targets": [{
          "expr": "rate(http_request_duration_seconds_bucket[5m])"
        }]
      },
      {
        "title": "工作流执行统计",
        "type": "stat",
        "targets": [{
          "expr": "workflow_execution_total"
        }]
      }
    ]
  }
}
```

### 3. AlertManager配置

```yaml
# alertmanager.yml
route:
  receiver: 'team-email'
  group_by: ['alertname', 'service']
  repeat_interval: 30m
  
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      repeat_interval: 5m
      continue: true

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'ops-team@company.com'
        send_resolved: true
  
  - name: 'pagerduty'
    pagerduty_configs:
      - routing_key: '${PAGERDUTY_KEY}'
        send_resolved: true
```

## 🛡️ 安全防护

### 1. 网络安全策略

```yaml
# network-policy.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: taskflow-network-policy
spec:
  podSelector:
    matchLabels:
      app: taskflow-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090 # Prometheus
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
      ports:
      - protocol: TCP
        port: 443
```

### 2. 安全扫描集成

```bash
#!/bin/bash
# security-scan.sh

echo "🛡️ 开始安全扫描..."

# 1. Trivy漏洞扫描
echo "🔍 扫描容器镜像漏洞..."
docker scan agions/taskflow-ai:latest --severity HIGH,CRITICAL

# 2. OWASP ZAP扫描
echo "🕷️ 执行Web应用扫描..."
docker run --rm -v $(pwd):/zap/wrk \
  owasp/zap2docker-stable zap-baseline.py \
  -t https://your-domain.com \
  -r zap-report.html

# 3. Snyk依赖检查
echo "🔬 检查依赖漏洞..."
snyk test
snyk monitor

# 4. 生成安全报告
cat > security-report.md << EOF
# 安全扫描报告

## 容器镜像
$(docker scan agions/taskflow-ai:latest --json | jq -r '.vulnerabilities[] | "\(.severity): \(.packageName) - \(.description)"')

## Web应用
$(grep -A5 "High" zap-report.html | head -20)

## 依赖项
$(snyk test 2>&1 | grep -E "(✗|✓)")
EOF

echo "✅ 安全扫描完成，报告已生成: security-report.md"
```

## 🔧 故障排除

### 1. 常见问题处理

```bash
# 应用日志查看
kubectl logs -f deployment/taskflow-app
docker logs -f taskflow-app

# 资源使用情况
kubectl top pods
kubectl describe nodes | grep -A5 -B5 "Allocated Resources"

# 网络连接测试
kubectl exec -it taskflow-app -- curl -v http://localhost:3000/health

# 数据库连接检查
kubectl exec -it taskflow-app -- psql -h db -U taskflow -d taskflow
```

### 2. 灾难恢复

```bash
# 数据备份脚本
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 1. 数据库备份
docker exec taskflow-db pg_dump -U taskflow taskflow > backup_${TIMESTAMP}.sql

# 2. 配置文件备份
tar -czf config_backup_${TIMESTAMP}.tar.gz config/

# 3. 上传远程存储
aws s3 cp backup_${TIMESTAMP}.sql s3://taskflow-backup/db/
aws s3 cp config_backup_${TIMESTAMP}.tar.gz s3://taskflow-backup/config/

echo "✅ 备份完成: ${TIMESTAMP}"
```

### 3. 恢复流程

```bash
# 恢复脚本
#!/bin/bash
# restore.sh

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "用法: ./restore.sh YYYYMMDD_HHMMSS"
    exit 1
fi

echo "🔄 开始从备份恢复..."

# 1. 停止服务
docker-compose down

# 2. 恢复数据库
docker cp backup_${BACKUP_DATE}.sql taskflow-db:/tmp/
docker exec taskflow-db psql -U taskflow -d taskflow -f /tmp/backup_${BACKUP_DATE}.sql

# 3. 恢复配置
rm -rf config/*
tar -xzf config_backup_${BACKUP_DATE}.tar.gz -C config/

# 4. 重新启动
docker-compose up -d

echo "✅ 恢复完成，请验证服务状态"
```

## 📊 性能优化

### 1. 数据库优化

```sql
-- 性能监控查询
EXPLAIN ANALYZE 
SELECT * FROM workflows WHERE created_at > NOW() - INTERVAL '1 day';

-- 索引优化建议
CREATE INDEX CONCURRENTLY idx_workflows_created ON workflows(created_at);
CREATE INDEX CONCURRENTLY idx_workflows_status ON workflows(status);

-- 定期维护
VACUUM ANALYZE;
REINDEX TABLE CONCURRENTLY workflows;
```

### 2. 缓存策略

```typescript
// Redis缓存管理器
class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL!);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }
}
```

## 📚 相关文档

- [Multi-Agent协作使用指南](./multi-agent-collaboration.md)
- [TypeScript修复过程记录](./type-script-fixes.md)
- [开发工程师最佳实践](./development-guide.md)
- [质量工程测试策略](./quality-guide.md)

---

**版本**: v4.0.0
**最后更新**: 2026-04-24
**适用角色**: 运维工程师