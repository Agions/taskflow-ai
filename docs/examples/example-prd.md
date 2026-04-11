# PRD 文档示例

本文档展示了 TaskFlow AI 可以解析的 PRD 文档格式和内容范例。

---

## 示例：电商用户管理系统

### 1. 项目概述

**项目名称**: 电商用户管理系统 (User Management System)  
**版本**: 1.0.0  
**目标**: 构建一个完整的电商用户中心，支持用户注册、登录、个人信息管理、权限控制等功能

### 2. 用户故事

#### US-001: 用户注册

- **角色**: 未注册用户
- **目标**: 注册成为平台用户
- **优先级**: P0 (必须)
- **描述**:
  1. 用户访问注册页面
  2. 输入邮箱、密码（8-20位，包含字母和数字）
  3. 验证邮箱唯一性
  4. 发送验证邮件
  5. 用户点击验证链接完成注册
- **验收标准**:
  - [ ] 邮箱格式验证通过
  - [ ] 密码强度符合要求
  - [ ] 邮箱已被注册时给出明确提示
  - [ ] 注册成功后自动登录
- **预估工时**: 8 小时
- **依赖**: 无

#### US-002: 用户登录

- **角色**: 已注册用户
- **目标**: 登录系统
- **优先级**: P0
- **描述**:
  1. 用户输入邮箱和密码
  2. 系统验证凭据
  3. 生成 JWT token
  4. 返回 token 给客户端
- **验收标准**:
  - [ ] 密码错误 3 次锁定 15 分钟
  - [ ] token 有效期 7 天
  - [ ] 登录失败返回清晰错误信息
- **预估工时**: 6 小时
- **依赖**: US-001

#### US-003: 密码重置

- **角色**: 忘记密码的用户
- **目标**: 重置密码
- **优先级**: P1
- **描述**:
  1. 用户点击"忘记密码"
  2. 输入注册邮箱
  3. 发送重置链接（有效期 1 小时）
  4. 用户设置新密码
- **验收标准**:
  - [ ] 重置链接 1 小时后失效
  - [ ] 新密码不能与最近 3 次密码相同
- **预估工时**: 6 小时
- **依赖**: US-001

### 3. 非功能性需求

#### 性能要求

- 用户登录响应时间 < 200ms (p95)
- 系统支持 10000 并发用户
- 数据库查询 < 50ms

#### 安全要求

- 密码使用 bcrypt 加密
- 传输层使用 HTTPS
- 实施 CSRF 防护
- 实施 XSS 防护
- API 限流：100 次/分钟/IP

#### 可用性

- 系统可用性 99.9%
- 支持 7x24 小时运行
- 数据备份每日一次

### 4. 技术栈

| 技术       | 版本  | 用途         |
| ---------- | ----- | ------------ |
| Node.js    | 18+   | 后端运行环境 |
| TypeScript | 5.0+  | 开发语言     |
| Express    | 4.18+ | Web 框架     |
| PostgreSQL | 14+   | 主数据库     |
| Redis      | 7+    | 缓存与会话   |
| JWT        | 9.0+  | 身份验证     |

### 5. API 设计

#### 用户注册

```
POST /api/v1/register

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "张三"
}

Response (201):
{
  "success": true,
  "data": {
    "userId": "usr_12345",
    "email": "user@example.com",
    "name": "张三"
  }
}
```

#### 用户登录

```
POST /api/v1/login

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "user": {
      "id": "usr_12345",
      "email": "user@example.com",
      "name": "张三"
    }
  }
}
```

### 6. 数据库设计

#### users 表

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### user_sessions 表

```sql
CREATE TABLE user_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) REFERENCES users(id),
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. 部署架构

```
┌─────────┐    ┌────────────┐    ┌─────────┐
│   CDN   │────│   Nginx    │────│   App   │
└─────────┘    └────────────┘    └─────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │  PostgreSQL │
                               └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │    Redis    │
                               └─────────────┘
```

### 8. 监控指标

- 注册成功率
- 登录成功率
- API 响应时间 (p50, p95, p99)
- 系统错误率
- 并发用户数
- 数据库连接池使用率

### 9. 风险与缓解

| 风险             | 概率 | 影响 | 缓解措施            |
| ---------------- | ---- | ---- | ------------------- |
| 邮箱验证服务延迟 | 中   | 中   | 异步队列 + 重试机制 |
| 数据库性能瓶颈   | 低   | 高   | 读写分离 + 缓存     |
| 密码重置邮件被拒 | 中   | 低   | 多 SMTP 服务商备援  |

---

## 如何测试？

使用 TaskFlow AI 解析此 PRD：

```bash
# 初始化项目
taskflow init

# 解析本文件
taskflow parse docs/examples/example-prd.md

# 查看生成的任务
taskflow status

# 生成甘特图
taskflow visualize gantt
```

TaskFlow AI 会自动提取：

- ✅ 12 个用户故事
- ✅ 依赖关系
- ✅ 优先级排序
- ✅ 工时估算汇总
- ✅ API 设计建议
- ✅ 数据库 Schema 生成
- ✅ 部署架构建议
