const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// 备用构建配置 - 当Rollup失败时使用
const buildConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'bin/index.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  minify: true,
  external: [
    // 保持外部依赖
    'fs',
    'path',
    'os',
    'child_process',
    'readline',
    'crypto',
    'util',
    'events',
    'stream',
    'url',
    'querystring',
    'http',
    'https',
    'zlib',
    'buffer',
    'string_decoder',
    'net',
    'tls',
    'dns',
    'dgram',
    'cluster',
    'worker_threads',
    'perf_hooks',
    'inspector',
    'async_hooks',
    'v8',
    'vm',
    'repl',
    'tty',
    'domain',
    'punycode',
    'assert',
    'constants',
    'module',
    'timers',
    'console',
    'process',
    'global',
    '__dirname',
    '__filename',
    'require',
    'exports',
    // NPM依赖
    'commander',
    'chalk',
    'ora',
    'inquirer',
    'fs-extra',
    'yaml',
    'axios',
    'openai',
    'dotenv'
  ],
  banner: {
    js: '#!/usr/bin/env node'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

async function build() {
  try {
    console.log('🔧 使用esbuild进行备用构建...');
    
    // 确保输出目录存在
    const outDir = path.dirname(buildConfig.outfile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    await esbuild.build(buildConfig);
    
    // 设置可执行权限
    fs.chmodSync(buildConfig.outfile, '755');
    
    console.log('✅ esbuild构建完成');
    console.log(`📦 输出文件: ${buildConfig.outfile}`);
    
    // 验证构建结果
    if (fs.existsSync(buildConfig.outfile)) {
      const stats = fs.statSync(buildConfig.outfile);
      console.log(`📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
  } catch (error) {
    console.error('❌ esbuild构建失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build, buildConfig };
