# TaskFlow AI - 企业级多阶段Docker构建
# 支持生产和开发环境，优化性能和安全性

# ============================================================================
# 阶段1: 基础镜像 - 安装系统依赖和工具
# ============================================================================
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装系统依赖和安全更新
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    git \
    curl \
    ca-certificates \
    tzdata && \
    rm -rf /var/cache/apk/*

# 创建非root用户
RUN addgroup -g 1001 -S taskflow && \
    adduser -S taskflow -u 1001 -G taskflow

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# ============================================================================
# 阶段2: 依赖安装 - 安装和缓存依赖
# ============================================================================
FROM base AS deps

# 复制包管理文件
COPY package*.json ./

# 设置npm配置优化
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fund false && \
    npm config set audit false

# 安装生产依赖
RUN npm ci --only=production --no-optional && \
    npm cache clean --force

# 安装所有依赖（包括开发依赖）
FROM base AS deps-dev
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm ci --include=dev && \
    npm cache clean --force

# ============================================================================
# 阶段3: 构建 - 编译TypeScript和打包
# ============================================================================
FROM deps-dev AS builder

# 复制源代码
COPY . .

# 设置构建环境变量
ENV NODE_ENV=production
ENV BUILD_SOURCEMAP=false
ENV BUILD_ANALYZE=false

# 执行构建
RUN npm run build && \
    npm run type-check && \
    npm run lint

# 清理构建缓存
RUN rm -rf node_modules/.cache && \
    rm -rf src && \
    rm -rf tests

# ============================================================================
# 阶段4: 生产镜像 - 最小化运行时镜像
# ============================================================================
FROM base AS production

# 设置生产环境变量
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV TASKFLOW_CONFIG_DIR=/app/.taskflow
ENV TASKFLOW_DATA_DIR=/app/data

# 创建应用目录结构
RUN mkdir -p /app/.taskflow /app/data /app/logs && \
    chown -R taskflow:taskflow /app

# 从依赖阶段复制生产依赖
COPY --from=deps --chown=taskflow:taskflow /app/node_modules ./node_modules

# 从构建阶段复制构建产物
COPY --from=builder --chown=taskflow:taskflow /app/dist ./dist
COPY --from=builder --chown=taskflow:taskflow /app/bin ./bin
COPY --from=builder --chown=taskflow:taskflow /app/package.json ./

# 复制必要的配置文件
COPY --chown=taskflow:taskflow .env.example ./.env.example

# 设置可执行权限
RUN chmod +x ./bin/index.js && \
    chmod +x ./bin/taskflow-mcp

# 创建符号链接
RUN ln -sf /app/bin/index.js /usr/local/bin/taskflow && \
    ln -sf /app/bin/taskflow-mcp /usr/local/bin/taskflow-mcp

# 切换到非root用户
USER taskflow

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD taskflow --version || exit 1

# 暴露端口（如果有API服务）
EXPOSE 3000

# 设置入口点
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["taskflow", "--help"]

# ============================================================================
# 阶段5: 开发镜像 - 包含开发工具和热重载
# ============================================================================
FROM deps-dev AS development

# 设置开发环境变量
ENV NODE_ENV=development
ENV LOG_LEVEL=debug
ENV TASKFLOW_CONFIG_DIR=/app/.taskflow
ENV TASKFLOW_DATA_DIR=/app/data

# 安装开发工具
RUN npm install -g nodemon ts-node

# 创建应用目录结构
RUN mkdir -p /app/.taskflow /app/data /app/logs && \
    chown -R taskflow:taskflow /app

# 复制源代码
COPY --chown=taskflow:taskflow . .

# 设置可执行权限
RUN chmod +x ./bin/index.js 2>/dev/null || true

# 切换到非root用户
USER taskflow

# 暴露端口和调试端口
EXPOSE 3000 9229

# 开发模式入口点
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "run", "dev"]

# ============================================================================
# 元数据标签
# ============================================================================
LABEL maintainer="Agions <agions@example.com>"
LABEL version="1.3.1"
LABEL description="TaskFlow AI - 智能PRD文档解析与任务管理助手"
LABEL org.opencontainers.image.title="TaskFlow AI"
LABEL org.opencontainers.image.description="智能PRD文档解析与任务管理助手，支持多模型AI协同"
LABEL org.opencontainers.image.version="1.3.1"
LABEL org.opencontainers.image.vendor="Agions"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/Agions/taskflow-ai"
LABEL org.opencontainers.image.documentation="https://agions.github.io/taskflow-ai/"
