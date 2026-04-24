# 文档合并决策

## 分析结果

### DEVELOPER_GUIDE 文件

| 文件 | 行数 | 语言 | 更新时间 | 内容 |
|------|------|------|---------|------|
| `docs/DEVELOPER_GUIDE.md` | 856 | 英文 | 2026-04-23 15:23 | 完整的开发指南 |
| `docs/development-guide.md` | 427 | 中文 | 2026-04-24 12:19 | 开发工程师最佳实践 |

**结论**: 两个文件内容**不同**，不是重复
- 英文版更全面
- 中文版更新，但内容不同（TDD 侧重最佳实践）

### API_REFERENCE 文件

| 文件 | 行数 | 语言 | 更新时间 | 内容 |
|------|------|------|---------|------|
| `docs/API_REFERENCE.md` | 955 | 英文 | 2026-04-23 15:23 | 类型定义 + API 参考 |
| `docs/api-reference.md` | 644 | 中文 | 2026-04-22 16:12 | CLI API 文档 |

**结论**: 两个文件内容**不同**，不是重复
- 英文版包括类型定义，更技术化
- 中文版侧重 CLI 使用

## 决策策略

### 方案 1: 保留双语文档 (推荐)

**优点**:
- 服务不同语言用户
- 内容互补而非重复
- 中文版更新，有价值

**操作**:
- 保留所有四个文件
- 添加中英文链接，相互引用
- 统一目录结构

**链接添加**:
```markdown
<!-- 在英文版顶部添加 -->
**[中文版 🇨🇳](../../development-guide.md)**

<!-- 在中文版顶部添加 -->
**[English Version 🇺🇸](../DEVELOPER_GUIDE.md)**
```

### 方案 2: 创建合并版

**优点**:
- 单一文档更易维护
- 避免内容分化

**缺点**:
- 文档过长
- 维护工作量大
- 双语混合可能困扰用户

### 方案 3: 选择性删除

**操作**:
- 保留英文版（更全面）
- 删除中文版

**缺点**: 失去中文用户的友好文档

## 最终决策

**采用方案 1**: 保留双语文档，添加相互链接

### 实施步骤

1. 在 `docs/DEVELOPER_GUIDE.md` 顶部添加中文版链接
2. 在 `docs/development-guide.md` 顶部添加英文版链接
3. 在 `docs/API_REFERENCE.md` 顶部添加中文版链接
4. 在 `docs/api-reference.md` 顶部添加英文版链接
5. 更新 `docs/DOCUMENTATION-CHECKLIST.md` 反映文档现状

### 目录结构

```
docs/
├── DEVELOPER_GUIDE.md      # English: Comprehensive Developer Guide
├── development-guide.md    # Chinese: Developer Best Practices
├── API_REFERENCE.md        # English: API Reference with Type Definitions
└── api-reference.md        # Chinese: CLI API Documentation
```

### 命名约定

- **英文版**: 大写驼峰命名 (UPPER_CAMEL_CASE)
- **中文版**: 小写短横线命名 (lower-case)
- **目的**: 明确区分双语文档
