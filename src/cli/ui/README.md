# TaskFlow AI CLI UI 组件库

专业级终端界面组件库，提供精美的 CLI 用户体验。

## 特性

- 🎨 **统一主题** - 一致的颜色系统和视觉风格
- ✨ **丰富组件** - Logo、加载动画、信息框、表格、进度条等
- 🎯 **交互提示** - 确认、输入、选择、向导等交互组件
- 📊 **仪表板** - 项目状态、系统信息、任务列表、时间线
- 🔧 **易于使用** - 简洁的 API 设计

## 安装

依赖已包含在项目 package.json 中：

```bash
npm install chalk ora boxen figlet inquirer
```

## 快速开始

```typescript
import { ui, showLogo, Spinner } from './ui';

// 显示 Logo
await showLogo();

// 显示信息框
ui.success('操作成功', '任务已完成！');
ui.error('操作失败', '连接超时');

// 加载动画
const spinner = ui.spinner('正在处理...').start();
// ... 异步操作
spinner.succeed('处理完成！');
```

## 组件文档

### 颜色主题

```typescript
import { theme } from './ui';

console.log(theme.primary('主色调'));
console.log(theme.success('成功'));
console.log(theme.error('错误'));
console.log(theme.warning('警告'));
console.log(theme.info('信息'));
console.log(theme.muted('次要'));
console.log(theme.highlight('高亮'));
```

### Logo 展示

```typescript
import { showLogo, showSimpleLogo } from './ui';

// 完整 ASCII Logo
await showLogo();

// 简洁版本
showSimpleLogo();
```

### 加载动画

```typescript
import { Spinner } from './ui';

const spinner = new Spinner('加载中...').start();

// 更新文本
spinner.update('正在解析...');

// 完成状态
spinner.succeed('成功！');
spinner.fail('失败！');
spinner.warn('警告');
spinner.info('信息');
```

### 信息框

```typescript
import { ui } from './ui';

ui.success('标题', '成功消息');
ui.error('标题', '错误消息', '详细信息');
ui.warning('标题', '警告消息');
ui.info('标题', '提示消息');
```

### 列表

```typescript
import { ui } from './ui';

// 有序列表
ui.list('任务列表', [
  '解析 PRD',
  '生成代码',
  '编写测试'
]);

// 键值对
ui.keyValue({
  '名称': 'TaskFlow',
  '版本': '2.1.0',
  '作者': 'Agions'
});
```

### 表格

```typescript
import { ui, TableColumn, TableData } from './ui';

const columns: TableColumn[] = [
  { header: 'ID', key: 'id', width: 8 },
  { header: '任务', key: 'name', width: 20 },
  { header: '状态', key: 'status', width: 10 }
];

const data: TableData[] = [
  { id: 'T001', name: '解析 PRD', status: '完成' },
  { id: 'T002', name: '生成代码', status: '进行中' }
];

ui.table(columns, data);
```

### 进度条

```typescript
import { ui } from './ui';

// 显示进度
console.log(ui.progress(50, 100, '处理中'));
// 输出: [████████████░░░░░░░░░░░░░░░░░░] 50%
```

### 分隔线和章节

```typescript
import { ui } from './ui';

ui.divider('─', 60);  // 自定义分隔线
ui.section('章节标题');  // 带下划线的标题
```

## 交互式提示

```typescript
import { prompts } from './ui';

// 确认
const ok = await prompts.confirm('确定继续？', true);

// 输入
const name = await prompts.input('项目名称', 'my-project');

// 密码
const token = await prompts.password('API Token');

// 选择
const type = await prompts.select('项目类型', [
  { name: 'Web', value: 'web' },
  { name: 'Node', value: 'node' }
]);

// 多选
const features = await prompts.multiSelect('功能', [
  { name: 'TypeScript', value: 'ts', checked: true },
  { name: '测试', value: 'test' }
]);

// 数字
const port = await prompts.number('端口号', 3000, 1000, 9999);

// 编辑器
const content = await prompts.editor('描述');

// 多步骤向导
const answers = await prompts.wizard([
  { name: 'name', type: 'input', message: '项目名称' },
  { name: 'type', type: 'list', message: '项目类型', choices: [...] },
  { name: 'confirm', type: 'confirm', message: '确认？' }
], '项目初始化');
```

## 仪表板组件

```typescript
import { dashboard } from './ui';

// 项目状态
dashboard.project({
  name: 'TaskFlow AI',
  version: '2.1.0',
  status: 'active',
  progress: 75,
  tasks: { total: 20, completed: 12, inProgress: 5, pending: 2, blocked: 1 },
  lastUpdated: '2024-01-15 10:30:00'
});

// 系统信息
dashboard.system({
  nodeVersion: 'v20.11.0',
  platform: 'linux',
  memory: { used: 512, total: 2048 },
  uptime: '2d 4h 30m'
});

// 任务列表
dashboard.tasks([
  { id: '1', name: '重构', status: 'in-progress', priority: 'high' },
  { id: '2', name: '文档', status: 'pending', priority: 'medium' }
]);

// 时间线
dashboard.timeline([
  { time: '10:30', event: '完成', status: 'success' },
  { time: '10:25', event: '开始', status: 'info' }
]);

// 统计卡片
dashboard.stats([
  { label: '总数', value: 20, change: 5 },
  { label: '完成率', value: '75%', change: 10, unit: '%' }
]);
```

## 运行演示

```bash
npx ts-node src/cli/ui/demo.ts
```

## 文件结构

```
src/cli/ui/
├── index.ts      # 核心组件和主题
├── prompts.ts    # 交互式提示
├── dashboard.ts  # 仪表板组件
├── demo.ts       # 演示脚本
└── README.md     # 文档
```
