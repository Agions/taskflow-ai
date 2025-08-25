/**
 * TaskFlow AI 优化构建配置
 * 使用ESBuild替代Rollup，构建速度提升10倍
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

// 构建环境配置
const isDev = process.env.NODE_ENV === 'development';
const isWatch = process.argv.includes('--watch');
const isAnalyze = process.env.ANALYZE === 'true';

// 外部依赖列表（不打包进bundle）
const external = [
  // Node.js 内置模块
  'fs', 'path', 'os', 'child_process', 'readline', 'crypto', 'util', 
  'events', 'stream', 'url', 'querystring', 'http', 'https', 'zlib',
  'buffer', 'string_decoder', 'net', 'tls', 'dns', 'dgram', 'cluster',
  'worker_threads', 'perf_hooks', 'inspector', 'async_hooks', 'v8',
  'vm', 'repl', 'tty', 'domain', 'punycode', 'assert', 'constants',
  'module', 'timers', 'console', 'process',
  
  // NPM 依赖包
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

// 共享构建选项
const sharedOptions = {
  platform: 'node',
  target: 'node18',
  sourcemap: isDev ? 'inline' : true,
  minify: !isDev,
  metafile: isAnalyze,
  external,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.APP_VERSION': JSON.stringify(pkg.version),
  },
  banner: {
    js: `/* TaskFlow AI v${pkg.version} - Built with ESBuild */`,
  },
  logLevel: 'info',
  color: true,
};

// 构建配置
const buildConfigs = [
  // 1. 主库构建 (CommonJS)
  {
    ...sharedOptions,
    entryPoints: ['src/index.ts'],
    outfile: pkg.main,
    format: 'cjs',
    bundle: true,
    treeShaking: true,
  },
  
  // 2. ES模块构建
  {
    ...sharedOptions,
    entryPoints: ['src/index.ts'],
    outfile: pkg.module || pkg.main.replace('.js', '.mjs'),
    format: 'esm',
    bundle: true,
    treeShaking: true,
  },
  
  // 3. CLI工具构建
  {
    ...sharedOptions,
    entryPoints: ['src/cli.ts'],
    outfile: 'bin/index.js',
    format: 'cjs',
    bundle: true,
    banner: {
      js: '#!/usr/bin/env node\n/* TaskFlow AI CLI */\n',
    },
    // CLI特定优化
    drop: isDev ? [] : ['console', 'debugger'],
  },
  
  // 4. MCP服务器构建
  {
    ...sharedOptions,
    entryPoints: ['src/mcp/server.ts'],
    outfile: 'bin/mcp-server.js',
    format: 'cjs',
    bundle: true,
    banner: {
      js: '#!/usr/bin/env node\n/* TaskFlow AI MCP Server */\n',
    },
  }
];

// 插件：文件复制
const copyPlugin = {
  name: 'copy-files',
  setup(build) {
    build.onEnd(async () => {
      // 复制必要的静态文件
      const filesToCopy = [
        { from: 'README.md', to: 'dist/README.md' },
        { from: 'package.json', to: 'dist/package.json' },
        { from: 'CHANGELOG.md', to: 'dist/CHANGELOG.md' },
      ];
      
      for (const { from, to } of filesToCopy) {
        if (fs.existsSync(from)) {
          const destDir = path.dirname(to);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(from, to);
        }
      }
    });
  },
};

// 插件：类型声明生成
const typeDefsPlugin = {
  name: 'type-defs',
  setup(build) {
    build.onEnd(async () => {
      if (!isDev) {
        try {
          console.log('📝 生成TypeScript类型声明文件...');
          const { execSync } = require('child_process');
          execSync('npx tsc --emitDeclarationOnly --outDir dist', {
            stdio: 'inherit',
          });
          console.log('✅ 类型声明文件生成完成');
        } catch (error) {
          console.warn('⚠️ 类型声明生成失败:', error.message);
        }
      }
    });
  },
};

// 插件：构建分析
const analyzerPlugin = {
  name: 'analyzer',
  setup(build) {
    if (isAnalyze) {
      build.onEnd(async (result) => {
        if (result.metafile) {
          await generateBuildAnalysis(result.metafile);
        }
      });
    }
  },
};

// 插件：性能监控
const performancePlugin = {
  name: 'performance',
  setup(build) {
    let startTime;
    
    build.onStart(() => {
      startTime = Date.now();
      console.log('🚀 开始构建...');
    });
    
    build.onEnd((result) => {
      const duration = Date.now() - startTime;
      const errors = result.errors.length;
      const warnings = result.warnings.length;
      
      console.log(`⚡ 构建完成! 耗时: ${duration}ms`);
      
      if (errors > 0) {
        console.log(`❌ 错误: ${errors}`);
      }
      if (warnings > 0) {
        console.log(`⚠️ 警告: ${warnings}`);
      }
      
      // 显示文件大小信息
      showFileSizes();
    });
  },
};

// 主要构建函数
async function build() {
  try {
    console.log('🔧 TaskFlow AI - ESBuild 构建启动');
    console.log(`📦 版本: ${pkg.version}`);
    console.log(`🎯 模式: ${isDev ? '开发' : '生产'}`);
    
    // 清理输出目录
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    if (fs.existsSync('bin')) {
      fs.rmSync('bin', { recursive: true, force: true });
    }
    
    // 创建输出目录
    fs.mkdirSync('dist', { recursive: true });
    fs.mkdirSync('bin', { recursive: true });
    
    // 添加插件到所有配置
    buildConfigs.forEach(config => {
      config.plugins = [
        copyPlugin,
        typeDefsPlugin,
        analyzerPlugin,
        performancePlugin,
        ...(config.plugins || []),
      ];
    });
    
    // 执行构建
    if (isWatch) {
      console.log('👀 监听模式启动...');
      
      const contexts = await Promise.all(
        buildConfigs.map(config => esbuild.context(config))
      );
      
      await Promise.all(
        contexts.map(context => context.watch())
      );
      
      console.log('👀 正在监听文件变化...');
      
    } else {
      // 并行构建所有配置
      await Promise.all(
        buildConfigs.map(config => esbuild.build(config))
      );
    }
    
    // 设置CLI工具可执行权限
    if (fs.existsSync('bin/index.js')) {
      fs.chmodSync('bin/index.js', '755');
    }
    if (fs.existsSync('bin/mcp-server.js')) {
      fs.chmodSync('bin/mcp-server.js', '755');
    }
    
    console.log('✅ 所有构建任务完成!');
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 清理函数
async function clean() {
  const dirsToClean = ['dist', 'bin', '.esbuild'];
  
  for (const dir of dirsToClean) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🧹 已清理: ${dir}`);
    }
  }
  
  console.log('✅ 清理完成');
}

// 显示文件大小
function showFileSizes() {
  const files = [
    'dist/index.js',
    'dist/index.mjs', 
    'bin/index.js',
    'bin/mcp-server.js'
  ];
  
  console.log('\n📊 构建文件大小:');
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`  ${file}: ${size} KB`);
    }
  });
}

// 生成构建分析报告
async function generateBuildAnalysis(metafile) {
  try {
    const analysis = await esbuild.analyzeMetafile(metafile);
    
    // 保存分析报告
    const reportPath = 'dist/build-analysis.txt';
    fs.writeFileSync(reportPath, analysis);
    
    console.log(`📊 构建分析报告已生成: ${reportPath}`);
    
    // 显示简要统计
    const bundleSize = Object.values(metafile.outputs)[0]?.bytes || 0;
    console.log(`📦 Bundle大小: ${(bundleSize / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.warn('⚠️ 构建分析生成失败:', error.message);
  }
}

// 开发服务器
async function dev() {
  process.env.NODE_ENV = 'development';
  
  console.log('🛠️ 启动开发模式...');
  
  // 监听构建
  const context = await esbuild.context({
    ...buildConfigs[2], // CLI构建配置
    sourcemap: 'inline',
    minify: false,
  });
  
  await context.watch();
  console.log('👀 开发模式已启动，正在监听文件变化...');
}

// 命令行处理
const command = process.argv[2];

switch (command) {
  case 'clean':
    clean();
    break;
  case 'dev':
    dev();
    break;
  case 'watch':
    process.argv.push('--watch');
    build();
    break;
  default:
    build();
}

// 导出配置供其他文件使用
module.exports = {
  build,
  clean,
  dev,
  buildConfigs,
  sharedOptions,
};