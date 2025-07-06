
const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
    // 构建主模块
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'dist/index.js',
      external: [
        'chalk',
        'commander',
        'fs-extra',
        'inquirer',
        'ora',
        'axios',
        'winston',
        'dotenv',
        'conf',
        'boxen',
        'markdown-it',
        'express',
        'jsonwebtoken'
      ],
      sourcemap: false,
      minify: true,
      keepNames: true,
      logLevel: 'info'
    });
    
    // 构建 CLI
    await esbuild.build({
      entryPoints: ['src/cli.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'bin/index.js',
      banner: {
        js: '#!/usr/bin/env node'
      },
      external: [
        'chalk',
        'commander',
        'fs-extra',
        'inquirer',
        'ora',
        'axios',
        'winston',
        'dotenv',
        'conf',
        'boxen',
        'markdown-it',
        'express',
        'jsonwebtoken'
      ],
      sourcemap: false,
      minify: true,
      keepNames: true,
      logLevel: 'info'
    });
    
    console.log('✅ ESBuild 构建成功');
  } catch (error) {
    console.error('❌ ESBuild 构建失败:', error);
    process.exit(1);
  }
}

build();
