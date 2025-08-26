/**
 * TaskFlow AI ESBuild 配置
 * 替代Rollup，提供10倍性能提升的现代化构建配置
 */

const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');

// 构建配置
const buildConfig = {
  // 基础配置
  entryPoints: {
    // CLI应用入口
    'cli/index': 'packages/cli/src/index.ts',

    // 核心引擎入口
    'core/index': 'packages/core/src/index.ts',

    // MCP服务器入口
    'mcp-server/index': 'packages/mcp-server/src/index.ts',

    // 工具包入口
    'tools/index': 'packages/tools/src/index.ts',

    // 测试工具包入口
    'test-utils/index': 'packages/test-utils/src/index.ts',
  },

  outdir: 'packages',
  outbase: 'packages',
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['node18'],
  platform: 'node',
  format: 'cjs',

  // 优化配置
  splitting: false, // Node.js不支持代码分割
  treeShaking: true,
  metafile: true, // 生成构建分析文件

  // 外部依赖
  external: [
    // Node.js内置模块
    'fs',
    'path',
    'crypto',
    'events',
    'stream',
    'util',
    'os',
    'v8',
    'process',

    // 大型第三方依赖（保持外部）
    'axios',
    'markdown-it',
    'fs-extra',
    'ink',
    'react',
    'commander',
    'winston',
  ],

  // 加载器配置
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.js': 'js',
    '.jsx': 'jsx',
    '.json': 'json',
  },

  // 路径别名
  alias: {
    '@cli': path.resolve(__dirname, 'packages/cli/src'),
    '@core': path.resolve(__dirname, 'packages/core/src'),
    '@mcp-server': path.resolve(__dirname, 'packages/mcp-server/src'),
    '@tools': path.resolve(__dirname, 'packages/tools/src'),
    '@test-utils': path.resolve(__dirname, 'packages/test-utils/src'),
  },

  // 定义全局变量
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.BUILD_TIME': `"${new Date().toISOString()}"`,
    'process.env.VERSION': `"${require('./package.json').version}"`,
  },

  // 横幅配置
  banner: {
    js: `
/**
 * TaskFlow AI v${require('./package.json').version}
 * Built at ${new Date().toISOString()}
 * Copyright (c) 2025 TaskFlow Team
 */
`,
  },

  // 插件配置
  plugins: [
    // TypeScript路径映射插件
    {
      name: 'typescript-paths',
      setup(build) {
        const tsConfig = require('./tsconfig.json');
        const baseUrl = tsConfig.compilerOptions.baseUrl || './';
        const paths = tsConfig.compilerOptions.paths || {};

        for (const [pattern, mappings] of Object.entries(paths)) {
          const regex = new RegExp(`^${pattern.replace('*', '(.*)')}$`);

          build.onResolve({ filter: regex }, args => {
            const match = args.path.match(regex);
            if (match) {
              const mapping = mappings[0].replace('*', match[1]);
              return { path: path.resolve(baseUrl, mapping) };
            }
          });
        }
      },
    },

    // 构建进度插件
    {
      name: 'progress',
      setup(build) {
        let buildStart;

        build.onStart(() => {
          buildStart = Date.now();
          console.log('🔨 开始构建 TaskFlow AI...');
        });

        build.onEnd(result => {
          const duration = Date.now() - buildStart;
          const errors = result.errors.length;
          const warnings = result.warnings.length;

          if (errors > 0) {
            console.error(`❌ 构建失败: ${errors} 个错误, ${warnings} 个警告, 耗时 ${duration}ms`);
          } else {
            console.log(`✅ 构建成功: ${warnings} 个警告, 耗时 ${duration}ms`);
          }
        });
      },
    },

    // 文件复制插件
    {
      name: 'copy-files',
      setup(build) {
        build.onEnd(async () => {
          try {
            // 复制配置文件到各个包
            for (const pkg of ['cli', 'core', 'mcp-server', 'tools', 'test-utils']) {
              const srcConfig = path.join('packages', pkg, 'config');
              const distConfig = path.join('packages', pkg, 'dist', 'config');

              if (await fs.pathExists(srcConfig)) {
                await fs.copy(srcConfig, distConfig, { overwrite: true });
              }
            }

            // 复制模板文件
            if (await fs.pathExists('templates')) {
              await fs.copy('templates', 'packages/cli/dist/templates', { overwrite: true });
            }

            // 复制静态资源
            if (await fs.pathExists('assets')) {
              await fs.copy('assets', 'packages/cli/dist/assets', { overwrite: true });
            }

            console.log('📁 静态文件复制完成');
          } catch (error) {
            console.error('❌ 文件复制失败:', error);
          }
        });
      },
    },

    // 依赖分析插件
    {
      name: 'bundle-analyzer',
      setup(build) {
        build.onEnd(async result => {
          if (result.metafile) {
            const analysis = await esbuild.analyzeMetafile(result.metafile);

            // 生成构建分析报告
            await fs.writeFile('build-analysis.txt', analysis, 'utf8');

            // 生成依赖图
            const deps = extractDependencies(result.metafile);
            await fs.writeJSON('dist/dependencies.json', deps, { spaces: 2 });

            console.log('📊 构建分析报告已生成');
          }
        });
      },
    },
  ],
};

// 开发配置
const devConfig = {
  ...buildConfig,
  minify: false,
  sourcemap: 'inline',
  define: {
    ...buildConfig.define,
    'process.env.NODE_ENV': '"development"',
  },
};

// 监听模式配置
const watchConfig = {
  ...devConfig,
  plugins: [
    ...devConfig.plugins,
    {
      name: 'watch-notify',
      setup(build) {
        build.onEnd(() => {
          console.log('🔄 文件变更检测，重新构建完成');
        });
      },
    },
  ],
};

// 构建函数
async function build(options = {}) {
  const config = options.dev ? devConfig : buildConfig;

  try {
    // 清理输出目录
    await fs.emptyDir('dist');
    console.log('🧹 输出目录已清理');

    // 执行构建
    const result = await esbuild.build(config);

    // 处理错误和警告
    if (result.errors.length > 0) {
      console.error('构建错误:', result.errors);
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn('构建警告:', result.warnings);
    }

    // 生成包信息
    await generatePackageInfo();

    return result;
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 监听模式
async function watch() {
  try {
    console.log('👀 启动监听模式...');

    const context = await esbuild.context(watchConfig);
    await context.watch();

    console.log('✅ 监听模式已启动，等待文件变更...');

    // 处理退出信号
    process.on('SIGINT', async () => {
      console.log('\n🛑 正在停止监听模式...');
      await context.dispose();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ 监听模式启动失败:', error);
    process.exit(1);
  }
}

// 生成包信息
async function generatePackageInfo() {
  const packageJson = require('./package.json');
  const buildInfo = {
    name: packageJson.name,
    version: packageJson.version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    entryPoints: Object.keys(buildConfig.entryPoints),
    dependencies: Object.keys(packageJson.dependencies || {}),
    devDependencies: Object.keys(packageJson.devDependencies || {}),
  };

  await fs.writeJSON('dist/build-info.json', buildInfo, { spaces: 2 });
  console.log('📦 包信息已生成');
}

// 提取依赖关系
function extractDependencies(metafile) {
  const deps = {
    modules: [],
    externals: [],
    assets: [],
  };

  // 分析输入文件
  for (const [file, info] of Object.entries(metafile.inputs)) {
    deps.modules.push({
      file,
      bytes: info.bytes,
      imports: info.imports?.map(imp => imp.path) || [],
    });
  }

  // 分析输出文件
  for (const [file, info] of Object.entries(metafile.outputs)) {
    if (file.endsWith('.js')) {
      deps.assets.push({
        file,
        bytes: info.bytes,
        entryPoint: info.entryPoint,
      });
    }
  }

  return deps;
}

// CLI命令处理
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'build':
      build({ dev: false });
      break;

    case 'build:dev':
      build({ dev: true });
      break;

    case 'watch':
      watch();
      break;

    default:
      console.log(`
TaskFlow AI 构建工具

用法:
  node esbuild.config.js <command>

命令:
  build      生产环境构建
  build:dev  开发环境构建
  watch      监听模式

示例:
  node esbuild.config.js build
  node esbuild.config.js watch
`);
      break;
  }
}

module.exports = {
  buildConfig,
  devConfig,
  watchConfig,
  build,
  watch,
};
