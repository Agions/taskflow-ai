# 常见问题解答 (FAQ)

## 🤔 一般问题

### Q: TaskFlow AI 是什么？
A: TaskFlow AI 是一个智能的PRD文档解析与任务管理工具，专为开发团队设计。它能够自动解析产品需求文档(PRD)，智能提取关键信息，生成结构化的开发任务，并提供完整的任务管理和进度跟踪功能。

### Q: TaskFlow AI 支持哪些AI模型？
A: TaskFlow AI 支持多个国产大模型，包括：
- **DeepSeek**: 强大的代码理解和生成能力
- **智谱AI (GLM)**: 优秀的中文理解和推理能力
- **通义千问 (Qwen)**: 阿里云的大语言模型
- **文心一言 (ERNIE)**: 百度的AI大模型
- **月之暗面 (Moonshot)**: 长文本处理能力强
- **讯飞星火 (Spark)**: 科大讯飞的AI模型

### Q: TaskFlow AI 是免费的吗？
A: TaskFlow AI 本身是开源免费的，采用 MIT 许可证。但是使用AI模型需要相应的API密钥，这些服务可能会产生费用。我们建议根据使用量选择合适的AI服务商套餐。

### Q: TaskFlow AI 支持哪些编程语言？
A: TaskFlow AI 支持多种编程语言的项目模板，包括：
- **JavaScript/TypeScript**: React, Vue, Node.js, Express
- **Python**: Django, Flask, FastAPI
- **Java**: Spring Boot, Maven, Gradle
- **Go**: Gin, Echo, 标准库
- **Rust**: Actix, Rocket, Tokio
- **C#**: .NET Core, ASP.NET
- **PHP**: Laravel, Symfony

## 🛠️ 安装和配置

### Q: 如何安装 TaskFlow AI？
A: 你可以通过 npm 全局安装：
```bash
npm install -g taskflow-ai
```

或者在项目中本地安装：
```bash
npm install taskflow-ai
```

### Q: 安装时遇到权限错误怎么办？
A: 如果遇到权限错误，可以尝试以下解决方案：

1. **使用 sudo（不推荐）**：
   ```bash
   sudo npm install -g taskflow-ai
   ```

2. **配置 npm 全局目录（推荐）**：
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   npm install -g taskflow-ai
   ```

3. **使用 nvm**：
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   npm install -g taskflow-ai
   ```

### Q: 如何获取AI模型的API密钥？
A: 不同模型的API密钥获取方式：

- **DeepSeek**: 访问 [DeepSeek 官网](https://www.deepseek.com/) 注册账号
- **智谱AI**: 访问 [智谱AI 开放平台](https://open.bigmodel.cn/) 注册
- **通义千问**: 访问 [阿里云模型服务灵积](https://dashscope.aliyun.com/) 注册
- **文心一言**: 访问 [百度智能云](https://cloud.baidu.com/) 注册
- **月之暗面**: 访问 [Moonshot AI](https://www.moonshot.cn/) 注册

### Q: 配置文件在哪里？
A: 配置文件位置：
- **Windows**: `%USERPROFILE%\.taskflow\config.json`
- **macOS**: `~/.taskflow/config.json`
- **Linux**: `~/.taskflow/config.json`

你可以使用 `taskflow config path` 命令查看配置文件路径。

## 📄 PRD解析

### Q: TaskFlow AI 支持哪些文档格式？
A: 目前支持以下格式：
- **Markdown (.md)**: 推荐格式，解析效果最佳
- **纯文本 (.txt)**: 基本支持
- **Word 文档 (.docx)**: 实验性支持
- **PDF 文件 (.pdf)**: 计划中

### Q: 如何编写高质量的PRD文档？
A: 建议的PRD文档结构：

```markdown
# 项目标题

## 项目概述
简要描述项目的目标和背景

## 功能需求
### 功能1: 功能名称
- 描述: 详细的功能描述
- 验收标准:
  - 标准1
  - 标准2

## 技术要求
- 前端技术栈
- 后端技术栈
- 数据库选择

## 优先级
1. 高优先级功能
2. 中优先级功能
3. 低优先级功能
```

### Q: 解析结果不准确怎么办？
A: 可以尝试以下方法：

1. **优化PRD文档结构**：确保文档结构清晰，包含明确的功能描述和验收标准
2. **尝试不同的AI模型**：
   ```bash
   taskflow parse requirements.md --model zhipu
   ```
3. **启用多模型协同**：
   ```bash
   taskflow parse requirements.md --multi-model
   ```
4. **调整解析参数**：
   ```bash
   taskflow parse requirements.md --extract-sections --extract-features
   ```

## 📋 任务管理

### Q: 如何查看任务列表？
A: 使用以下命令查看任务：
```bash
# 查看所有任务
taskflow status

# 查看特定状态的任务
taskflow status --filter status=in_progress

# 查看高优先级任务
taskflow status --filter priority=high
```

### Q: 如何更新任务状态？
A: 使用 `taskflow status update` 命令：
```bash
# 更新单个任务状态
taskflow status update task-001 completed

# 批量更新任务状态
taskflow status update --batch task-001,task-002 in_progress

# 添加完成备注
taskflow status update task-001 completed --comment "功能已实现并测试通过"
```

### Q: 如何查看项目进度？
A: 使用进度查看命令：
```bash
# 查看整体进度
taskflow status progress

# 查看详细进度报告
taskflow status progress --detailed

# 生成进度图表
taskflow status progress --chart
```

## 🛠️ AI编辑器集成

### Q: TaskFlow AI 支持哪些AI编辑器？
A: 目前支持以下AI编辑器：
- **Cursor**: 专业的AI代码编辑器
- **Windsurf**: 新兴的AI编程工具
- **Trae**: AI辅助开发环境
- **VSCode**: 配合AI扩展使用

### Q: 如何在现有项目中集成TaskFlow AI？
A: 在现有项目目录中初始化TaskFlow AI：
```bash
# 进入现有项目目录
cd your-existing-project

# 初始化TaskFlow AI配置
taskflow init

# 配置AI模型
taskflow config set models.deepseek.apiKey "your-api-key"
```

### Q: 生成的配置文件包含什么？
A: 生成的配置文件包括：
- **代码规范**: ESLint、Prettier配置
- **AI规则**: 编辑器特定的AI提示规则
- **项目设置**: 工作区配置和推荐扩展
- **调试配置**: 断点和调试设置

## 🔧 高级功能

### Q: 如何启用多模型协同？
A: 配置多模型支持：
```bash
# 启用多模型支持
taskflow config set multiModel.enabled true

# 设置主要模型
taskflow config set multiModel.primary "deepseek"

# 设置备用模型
taskflow config set multiModel.fallback '["zhipu", "qwen"]'

# 启用负载均衡
taskflow config set multiModel.loadBalancing true
```

### Q: 如何优化性能？
A: 性能优化建议：

1. **调整缓存设置**：
   ```bash
   taskflow config set performance.cacheSize 200
   taskflow config set performance.cacheTTL 600000
   ```

2. **增加并发数**：
   ```bash
   taskflow config set performance.concurrency 10
   ```

3. **启用性能监控**：
   ```bash
   taskflow config set performance.enableMonitoring true
   ```

### Q: 如何备份和恢复数据？
A: 数据备份和恢复：
```bash
# 创建备份
taskflow backup create

# 查看备份列表
taskflow backup list

# 恢复备份
taskflow backup restore latest

# 导出配置
taskflow config export config-backup.json

# 导入配置
taskflow config import config-backup.json
```

## 🐛 故障排除

### Q: 命令执行缓慢怎么办？
A: 性能优化方法：
1. 清理缓存：`taskflow cache clear`
2. 检查网络连接：`ping api.deepseek.com`
3. 调整超时设置：`taskflow config set performance.timeout 60000`
4. 使用本地代理：配置代理设置

### Q: API请求失败怎么办？
A: 检查以下项目：
1. **API密钥是否正确**：`taskflow config validate`
2. **网络连接是否正常**：`taskflow models test`
3. **API配额是否充足**：查看服务商控制台
4. **是否需要代理**：配置网络代理

### Q: 如何获取详细的错误信息？
A: 启用调试模式：
```bash
# 设置日志级别为调试
taskflow config set logging.level debug

# 查看详细日志
taskflow logs --tail 50

# 生成诊断报告
taskflow doctor
```

## 💡 最佳实践

### Q: 团队协作的最佳实践是什么？
A: 团队协作建议：

1. **统一配置**：使用版本控制管理配置模板
2. **定期同步**：每日更新任务状态
3. **标准化流程**：制定统一的PRD编写规范
4. **权限管理**：合理分配任务和权限
5. **定期备份**：定期备份项目数据和配置

### Q: 如何提高PRD解析质量？
A: PRD编写建议：

1. **结构清晰**：使用标准的Markdown格式
2. **描述详细**：包含完整的功能描述和验收标准
3. **优先级明确**：明确标注功能优先级
4. **技术要求具体**：详细说明技术栈和架构要求
5. **示例丰富**：提供UI原型和交互示例

### Q: 如何选择合适的AI模型？
A: 模型选择建议：

- **DeepSeek**: 适合代码生成和技术文档解析
- **智谱AI**: 适合中文内容理解和业务逻辑分析
- **通义千问**: 适合综合性任务和多轮对话
- **文心一言**: 适合创意性内容和文案生成

## 📞 获取帮助

### Q: 如何获取更多帮助？
A: 获取帮助的途径：

1. **查看文档**：[在线文档](https://agions.github.io/taskflow-ai)
2. **GitHub Issues**：[提交问题](https://github.com/agions/taskflow-ai/issues)
3. **讨论区**：[GitHub Discussions](https://github.com/agions/taskflow-ai/discussions)
4. **社区群组**：加入QQ群或微信群
5. **邮件支持**：发送邮件到 1051736049@qq.com

### Q: 如何报告Bug？
A: 报告Bug时请提供：
1. **系统信息**：`taskflow info`
2. **错误日志**：`taskflow logs --level error`
3. **重现步骤**：详细的操作步骤
4. **预期行为**：期望的正确结果
5. **实际行为**：观察到的错误现象

### Q: 如何提出功能建议？
A: 提出功能建议：
1. 访问 [GitHub Issues](https://github.com/agions/taskflow-ai/issues)
2. 选择 "Feature Request" 模板
3. 详细描述功能需求和使用场景
4. 说明功能的价值和重要性
5. 提供可能的实现方案

---

*如果你的问题没有在这里找到答案，请通过 [GitHub Issues](https://github.com/agions/taskflow-ai/issues) 联系我们。*
