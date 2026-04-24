#!/usr/bin/env node
'use strict';

const path = require('path');
const { initCLI } = require('../dist/cli/index.js');

// 设置错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

// 启动 CLI
initCLI();
