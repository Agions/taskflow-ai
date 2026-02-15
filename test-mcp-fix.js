#!/usr/bin/env node
/**
 * MCP 修复测试脚本
 * 用于验证 Issue #1 的修复
 */

const http = require('http');

const TEST_CONFIG = {
  host: 'localhost',
  port: 3000,
  timeout: 5000
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试端点
async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: TEST_CONFIG.host,
      port: TEST_CONFIG.port,
      path: path,
      method: method,
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (method === 'POST' && data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 运行测试
async function runTests() {
  log('\n🧪 MCP 修复测试开始\n', 'blue');
  log('=' .repeat(50), 'blue');

  const tests = [
    { name: '健康检查', path: '/health' },
    { name: '服务器信息', path: '/info' },
    { name: 'MCP 端点 (GET)', path: '/mcp' },
    { name: '工具列表', path: '/mcp/tools' },
    { name: '资源列表', path: '/mcp/resources' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log(`\n📋 测试: ${test.name}`, 'yellow');
      const result = await testEndpoint(test.path);

      if (result.statusCode === 200) {
        log(`✅ 通过 - 状态码: ${result.statusCode}`, 'green');
        try {
          const json = JSON.parse(result.data);
          log(`📄 响应: ${JSON.stringify(json, null, 2).substring(0, 200)}...`, 'reset');
        } catch {
          log(`📄 响应: ${result.data.substring(0, 100)}...`, 'reset');
        }
        passed++;
      } else {
        log(`❌ 失败 - 状态码: ${result.statusCode}`, 'red');
        failed++;
      }
    } catch (error) {
      log(`❌ 错误: ${error.message}`, 'red');
      failed++;
    }
  }

  // 测试 CORS
  try {
    log(`\n📋 测试: CORS 支持`, 'yellow');
    const result = await testEndpoint('/mcp');
    const corsHeader = result.headers['access-control-allow-origin'];
    if (corsHeader === '*') {
      log(`✅ 通过 - CORS 已启用: ${corsHeader}`, 'green');
      passed++;
    } else {
      log(`⚠️ 警告 - CORS 头: ${corsHeader || '未设置'}`, 'yellow');
    }
  } catch (error) {
    log(`❌ CORS 测试错误: ${error.message}`, 'red');
  }

  // 测试 MCP 协议初始化
  try {
    log(`\n📋 测试: MCP 初始化`, 'yellow');
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    const result = await testEndpoint('/mcp', 'POST', initRequest);
    if (result.statusCode === 200) {
      const json = JSON.parse(result.data);
      if (json.result && json.result.protocolVersion) {
        log(`✅ 通过 - MCP 协议版本: ${json.result.protocolVersion}`, 'green');
        passed++;
      } else {
        log(`❌ 失败 - 无效的响应`, 'red');
        failed++;
      }
    } else {
      log(`❌ 失败 - 状态码: ${result.statusCode}`, 'red');
      failed++;
    }
  } catch (error) {
    log(`❌ MCP 初始化错误: ${error.message}`, 'red');
    failed++;
  }

  // 总结
  log('\n' + '='.repeat(50), 'blue');
  log(`\n📊 测试结果:`, 'blue');
  log(`✅ 通过: ${passed}`, 'green');
  log(`❌ 失败: ${failed}`, failed > 0 ? 'red' : 'reset');

  if (failed === 0) {
    log(`\n🎉 所有测试通过！MCP 修复成功！`, 'green');
    log(`\n💡 现在可以在 Trae 中配置 MCP:`, 'yellow');
    log(`   URL: http://localhost:3000/mcp`, 'reset');
    process.exit(0);
  } else {
    log(`\n⚠️ 部分测试失败，请检查 MCP 服务器是否已启动`, 'yellow');
    log(`\n💡 启动服务器:`, 'yellow');
    log(`   taskflow mcp start`, 'reset');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  log(`\n❌ 测试运行错误: ${error.message}`, 'red');
  process.exit(1);
});
