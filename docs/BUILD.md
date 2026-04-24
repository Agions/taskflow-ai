# Build System

TaskFlow AI v4.0 使用现代化的双模式构建系统，平衡开发速度和类型安全。

## 📊 构建模式对比

| 模式 | 命令 | 耗时 | 类型检查 | 使用场景 |
|------|------|------|---------|---------|
| **快速模式** | `node build.js --fast` | ~0.46s | ❌ 跳过 | 开发、快速迭代 |
| **标准模式** | `npm run build` | ~7.30s | ✅ 完整 | 发布、CI/CD |
| **清理重建** | `node build.js --clean` | ~10s | ✅ 完整 | 清理缓存 |
| **监听模式** | `node build.js --watch` | 实时 | ✅ 增量 | 开发调试 |

## 🚀 快速开始

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 pnpm（推荐）
pnpm install

# 使用 yarn
yarn install
```

### 构建项目

```bash
# 快速构建（推荐用于开发）
node build.js --fast

# 标准构建（带类型检查）
npm run build

# 完整清理后构建
node build.js --clean
```

## 🏗️ 构建系统架构

### 构建流程

```
build.js (入口)
├── 参数解析
├── 项目名称检测
├── [快速模式] → esbuild 编译
│   ├── 跳过类型检查
│   ├── babel-loader 转换
│   └── 生成 bundle
└── [标准模式] → TypeScript 编译
    ├── 类型检查
    ├── tsc 编译
    └── 生成 .js/.d.ts 文件
生成入口文件
├── bin/index.js
└── dist/index.js
```

### 技术栈

- **TypeScript** 5.9.3：类型系统和编译
- **esbuild** 0.24.0：快速打包
- **ts-node**：TypeScript 运行时
- **fs-extra**：文件系统操作

### 目录结构

```
taskflow-ai/
├── src/                    # 源代码
│   ├── cli/               # CLI 命令
│   ├── core/              # 核心模块
│   ├── agent/             # Agent 系统
│   └── ...
├── dist/                   # 构建输出（自动生成）
│   ├── cli/               # CLI 构建产物
│   ├── *.js               # 编译后的 JS
│   └── *.d.ts             # 类型定义文件
├── bin/                    # CLI 入口（自动生成）
│   └── index.js           # 可执行入口
├── build.js                # 构建脚本
├── tsconfig.json           # TypeScript 配置
├── tsconfig.build.json     # 构建专用配置
└── tsconfig.test.json      # 测试专用配置
```

## 🔧 构建配置

### TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 构建专用配置 (tsconfig.build.json)

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

### 快速编译配置

快速模式使用 esbuild 配置：

```javascript
// build.js 中的 esbuild 配置
const esbuildConfig = {
  entryPoints: ['src/cli/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/cli/index.js',
  format: 'cjs',
  packages: 'external',
  loader: {
    '.ts': 'ts',
  },
  minify: false,
  sourcemap: false,
};
```

## 📝 NPM Scripts

```json
{
  "scripts": {
    "build": "node build.js",
    "build:fast": "node build.js --fast",
    "build:clean": "node build.js --clean",
    "build:watch": "node build.js --watch",
    "dev": "node build.js --watch",
    "type-check": "tsc --noEmit"
  }
}
```

### 使用示例

```bash
# 开发时快速构建
npm run build:fast

# 发布前完整构建
npm run build

# 类型检查（不生成文件）
npm run type-check

# 监听模式（自动重新构建）
npm run dev
```

## ⚙️ 构建脚本详解

### build.js 核心逻辑

```javascript
#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// 构建模式
const BUILD_MODES = {
  FAST: 'fast',      // 快速模式：跳过类型检查
  STANDARD: 'standard', // 标准模式：完整类型检查
  CLEAN: 'clean',    // 清理重建
};

// 主构建函数
async function build(mode = BUILD_MODES.STANDARD) {
  console.log('🚀 TaskFlow AI 构建...');
  
  if (mode === BUILD_MODES.FAST) {
    await buildFast();
  } else {
    await buildStandard();
  }
  
  await generateEntryFiles();
  console.log('✅ 构建完成!');
}

// 快速构建
async function buildFast() {
  console.log('⚡ 使用 esbuild 快速编译...');
  execSync(
    'npx esbuild src/cli/index.ts --bundle --platform=node ' +
    '--outfile=dist/cli/index.js --format=cjs --packages=external',
    { stdio: 'inherit' }
  );
}

// 标准构建
async function buildStandard() {
  console.log('📦 使用 TypeScript 编译器...');
  execSync('npx tsc -p tsconfig.build.json', {
    stdio: 'inherit',
  });
}
```

### 生成入口文件

```javascript
// 生成 bin/index.js（CLI 入口）
const cliEntry = `#!/usr/bin/env node
require('../dist/cli/index.js');
`;

fs.writeFileSync(path.join(rootDir, 'bin/index.js'), cliEntry);
fs.chmodSync(path.join(rootDir, 'bin/index.js'), 0o755);

// 生成 dist/index.js（库入口）
const libEntry = `module.exports = require('./cli/index.js');
`;
fs.writeFileSync(path.join(rootDir, 'dist/index.js'), libEntry);
```

## 🔄 增量编译

TypeScript 支持增量编译，提升重复构建速度：

```bash
# 启用增量编译（首次使用）
npx tsc -p tsconfig.build.json --incremental

# 后续构建会更快
npm run build
```

增量编译会生成 `.tsbuildinfo` 文件缓存编译信息。

## 🎯 CI/CD 集成

### GitHub Actions 配置

```yaml
name: TaskFlow AI CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build    # 标准构建，带类型检查

  test-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
```

### NPM 发布

NPM 发布工作流使用 `--ignore-scripts` 避免类型检查问题：

```yaml
- name: Publish to npm
  run: npm publish --access public --ignore-scripts
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 🐛 常见问题排查

### 1. 类型错误导致构建失败

**问题**:
```bash
npx tsc --noEmit
# 97 个 TypeScript 错误
```

**解决方案**:
- 开发时使用快速模式：`npm run build:fast`
- 参考 [docs/TYPESYSTEM.md](./TYPESYSTEM.md) 修复类型错误
- 使用 `--skipLibCheck` 跳过第三方库检查（临时方案）

### 2. esbuild 编译失败

**问题**:
```bash
node build.js --fast
# Option name "--skipLibCheck" does not exist
```

**解决方案**:
esbuild 不支持 TypeScript 编译选项，使用以下方式：
```bash
npx esbuild src/cli/index.ts \
  --bundle \
  --platform=node \
  --outfile=dist/cli/index.js \
  --format=cjs \
  --packages=external
```

### 3. 清理缓存

**问题**:
构建结果不更新，使用旧的文件

**解决方案**:
```bash
# 完全清理
npm run build:clean

# 或手动删除
rm -rf dist/ .tsbuildinfo/
rm -rf node_modules/.cache/
```

### 4. Source Map 问题

**问题**：
调试时无法映射到源代码

**解决方案**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": true,
    "sourceRoot": "./src"
  }
}

// esbuild 添加 sourcemap
npx esbuild ... --sourcemap
```

## 📈 性能优化

### 构建速度对比

```
首次构建（不使用缓存）:
- 标准模式: ~7.30s
- 快速模式: ~0.46s
- 提升: 15.8x

增量构建（使用 .tsbuildinfo）:
- 标准模式: ~2.5s
- 快速模式: ~0.46s
- 提升: 5.4x
```

### 优化建议

1. **开发时使用快速模式**
   ```bash
   npm run build:fast
   ```

2. **启用增量编译**
   ```bash
   npx tsc --incremental -p tsconfig.build.json
   ```

3. **并行构建（大型项目）**
   ```bash
   # 使用 ts-loader 的 happyPackMode
   npx webpack --config webpack.config.js
   ```

4. **缓存依赖**
   ```bash
   npm ci  # 比 npm install 快
   ```

## 🧪 测试构建

### 运行测试

```bash
# Jest 测试
npm test

# 监听模式
npm test -- --watch

# 覆盖率报告
npm test -- --coverage
```

### 集成到构建流程

在 CI/CD 中运行测试：

```yaml
- name: Run tests
  run: npm test
```

## 📦 发布流程

### 发布前检查清单

- [ ] `npm run type-check` 通过（0 错误）
- [ ] `npm test` 通过（所有测试通过）
- [ ] `npm run build` 成功构建
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号
- [ ] 执行 dry-run

### Dry Run 测试

```bash
npm publish --dry-run --access public
```

### 发布命令

```bash
# 标准发布
npm publish --access public

# 忽略脚本（避免 prepublishOnly 失败）
npm publish --access public --ignore-scripts
```

## 🔗 相关文档

- [TypeScript 类型系统](./TYPESYSTEM.md)
- [开发指南](./DEVELOPER_GUIDE.md)
- [CI/CD 配置](./ci-cd-improvements.md)
- [测试指南](./testing/testing.md)

## 📄 License

Apache License 2.0 © TaskFlow AI
