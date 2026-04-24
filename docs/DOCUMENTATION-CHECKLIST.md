# 文档清单

## 核心文档

### 高级文档
| 文件 | 描述 | 状态 |
|------|------|------|
| `docs/TYPESYSTEM.md` | TypeScript 类型系统文档 | ✅ 最新 |
| `docs/BUILD.md` | 构建系统文档 | ✅ 最新 |
| `docs/PERFORMANCE.md` | 性能优化指南 | ✅ 最新 |
| `docs/TESTING.md` | 测试指南和最佳实践 | ✅ 最新 |
| `docs/TESTING-PLAN.md` | 测试完善路线图 | ✅ 最新 |
| `docs/DEVELOPER_GUIDE.md` | 开发者指南 (新) | ✅ |
| `docs/development-guide.md` | 开发者指南 (旧) | ⚠️ 需要合并 |

### API 参考
| 文件 | 描述 | 状态 |
|------|------|------|
| `docs/API_REFERENCE.md` | API 参考 (新) | ✅ |
| `docs/api-reference.md` | API 参考 (旧) | ⚠️ 需要合并 |

### 用户指南
| 文件 | 描述 | 状态 |
|------|------|------|
| `docs/user-guide/user-manual.md` | 用户手册 | ✅ |
| `docs/guide/getting-started.md` | 快速开始 | ✅ |
| `docs/guide/installation.md` | 安装指南 | ✅ |

### 临时文档 (待删除)
| 文件 | 原因 | 状态 |
|------|------|------|
| `docs/type-script-fixes.md` | TypeScript 修复过程记录，已完成 | 🗑️ 删除 |
| `docs/ci-cd-improvements.md` | CI/CD 改进记录，应合并到主文档 | 🔄 合并或删除 |
| `docs/SUMMARY-2026-04-24.md` | 临时总结报告 | 🗑️ 删除 |

## 完整文档列表

### 根目录文档
```
docs/
├── index.md                              # 文档首页
├── TYPESYSTEM.md                        # TypeScript 类型系统
├── BUILD.md                             # 构建系统
├── PERFORMANCE.md                       # 性能优化
├── TESTING.md                           # 测试指南
├── TESTING-PLAN.md                      # 测试路线图
├── DEVELOPER_GUIDE.md                   # 开发者指南
├── development-guide.md              [待合并] 开发者指南 (旧)
├── API_REFERENCE.md                     # API 参考
├── api-reference.md                 [待合并] API 参考 (旧)
└── ...
```

## 文档组织原则

### 1. 命名规范
- 使用大写蛇形命名: `TYPESYSTEM.md`, `BUILD.md`
- 或小写短横线命名: `getting-started.md`
- 统一一种命名风格

### 2. 目录结构
```
docs/
├── guide/          # 用户指南 (面向用户)
├── reference/      # 参考资料 (面向开发者)
├── api/            # API 文档
├── deployment/     # 部署文档
├── examples/       # 示例代码
├── troubleshooting/# 故障排查
└── testing/        # 测试文档
```

### 3. 文档时效性
- **临时文档**: 标记为临时，完成后删除
- **核心文档**: 保持经常更新
- **过时文档**: 标记为过时，删除或合并

## 待完成任务

### 立即处理
- [ ] 删除 `docs/ci-cd-improvements.md`
- [ ] 删除 `docs/SUMMARY-2026-04-24.md`

### 短期处理
- [ ] 合并 `docs/DEVELOPER_GUIDE.md` 和 `docs/development-guide.md`
- [ ] 合并 `docs/API_REFERENCE.md` 和 `docs/api-reference.md`
- [ ] 统一文档命名规范

### 长期维护
- [ ] 建立文档审查机制
- [ ] 定期清理过时文档
- [ ] 确保文档与代码同步更新
