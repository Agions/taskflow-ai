# @taskflow-ai/console

TaskFlow AI Web 控制台 - 可视化工作流编辑器

## 功能

- 🎨 可视化工作流编排（拖拽节点）
- 📊 实时执行状态监控
- 📝 执行日志查看
- 📦 模板市场入口
- 🔌 MCP 工具集成

## 快速开始

```bash
# 安装依赖
cd packages/console
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

- React 18
- React Flow (工作流编辑器)
- Zustand (状态管理)
- Socket.io (实时通信)
- Vite (构建工具)

## 项目结构

```
src/
├── App.tsx          # 主应用组件
├── main.tsx         # 入口文件
└── index.css        # 全局样式
```

## 连接到后端

默认连接 `http://localhost:18999`，可在 `vite.config.ts` 中修改代理配置。

## 截图

![Console Preview](https://via.placeholder.com/800x600?text=TaskFlow+Console)
