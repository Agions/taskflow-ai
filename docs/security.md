# 安全策略

## 报告安全问题

我们非常重视安全问题。如果您发现了 TaskFlow AI 的安全漏洞，请负责任地披露给我们。

### 如何报告

**请勿**在公开的 GitHub Issues 中报告安全漏洞。

请通过以下方式报告：

1. **邮件报告**: 发送详细信息至 security@agions.com
2. **加密报告**: 如有 PGP 密钥，可使用我们的 PGP 密钥加密（见下文）
3. **响应时间**: 我们会在 48 小时内确认收到报告，并在 7 天内提供初步评估

### 报告内容

请包含以下信息：

- **漏洞描述**: 清晰描述安全问题
- **影响范围**: 哪些版本受影响
- **复现步骤**: 如何重现问题
- **建议修复**: 如有修复建议请提供
- **您的信息**: 姓名/组织和联系方式（可选）

### PGP 密钥

```
Key fingerprint: 3B82 F6AB C123 DEF0 4567
               89AB CDEF 0123 4567 89AB
```

公钥下载: https://agions.com/pgp-key.asc

---

## 已修复的安全问题

| CVE                 | 严重性   | 描述                       | 修复版本 |
| ------------------- | -------- | -------------------------- | -------- |
| GHSA-67mh-4wv8-2f99 | Moderate | esbuild 开发服务器请求漏洞 | v2.1.10+ |
| GHSA-f269-vfmq-vjvj | High     | undici WebSocket 溢出      | v2.1.10+ |
| GHSA-2mjp-6q6p-2qxm | High     | undici HTTP 走私           | v2.1.10+ |
| GHSA-vrm6-8vpv-qv8q | High     | undici 内存消耗            | v2.1.10+ |
| GHSA-v9p9-hfj2-hcw8 | High     | undici 异常处理            | v2.1.10+ |
| GHSA-4992-7rv2-5pvq | High     | undici CRLF 注入           | v2.1.10+ |

---

## 安全最佳实践

### 使用 TaskFlow AI

1. **保护 API 密钥**

   ```bash
   # ❌ 不要硬编码
   const apiKey = "sk-xxx";

   # ✅ 使用环境变量
   const apiKey = process.env.OPENAI_API_KEY;
   ```

2. **最小权限原则**
   - 为每个项目创建独立的 API 密钥
   - 限制密钥的访问范围
   - 定期轮换密钥

3. **输入验证**
   - 验证所有用户输入
   - 使用白名单而非黑名单
   - 防范路径遍历攻击

### 开发安全

1. **依赖管理**

   ```bash
   # 定期检查漏洞
   npm audit

   # 自动更新
   npm audit fix
   ```

2. **代码安全**
   - 避免使用 `eval()` 和 `new Function()`
   - 验证所有外部输入
   - 使用参数化查询防止 SQL 注入

3. **日志安全**
   - 不要记录敏感信息
   - 使用结构化日志
   - 定期审查日志

### 部署安全

1. **网络**
   - 使用 HTTPS（强制）
   - 配置防火墙规则
   - 限制不必要的端口暴露

2. **服务器**
   - 保持系统更新
   - 使用非 root 用户运行
   - 禁用不必要的服务

3. **数据**
   - 数据库连接加密
   - 定期备份
   - 加密敏感数据

---

## 安全更新

我们通过以下方式发布安全更新：

- **GitHub Releases**: https://github.com/Agions/taskflow-ai/releases
- **Security Advisories**: https://github.com/Agions/taskflow-ai/security/advisories
- **NPM**: 自动同步更新

订阅安全通知：

```bash
# GitHub CLI
gh api repos/Agions/taskflow-ai/vulnerability-alerts
```

---

## 安全功能

TaskFlow AI 内置多种安全保护：

### 命令注入防护

- Shell 命令白名单验证
- 危险模式检测 (`;`, `|`, `&`, `$()`, backticks)
- 路径遍历防护

### SSRF 防护

- URL 协议验证（只允许 http/https）
- 私有 IP 地址阻止（10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16）
- localhost/127.0.0.1 限制

### 敏感信息脱敏

- API 密钥在日志中自动隐藏
- 配置文件输出时脱敏
- 错误信息不暴露内部路径

---

## 第三方依赖

我们积极监控依赖漏洞并定期更新：

| 依赖     | 策略                       |
| -------- | -------------------------- |
| esbuild  | npm overrides 强制安全版本 |
| undici   | npm overrides 强制安全版本 |
| 所有依赖 | 每月自动扫描+人工审核      |

查看完整依赖树：

```bash
npm ls --all
```

---

## 安全测试

我们的安全测试包括：

- ✅ 静态分析 (ESLint Security)
- ✅ 依赖漏洞扫描 (npm audit)
- ✅ 动态测试 ( integration tests)
- ✅ 代码审查 (所有 PR 都有安全审查)

---

## 联系我们

- **安全问题**: security@agions.com
- **一般问题**: https://github.com/Agions/taskflow-ai/issues
- **商业支持**: support@agions.com

---

_最后更新: 2025-03-28_
