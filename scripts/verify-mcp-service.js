#!/usr/bin/env node

/**
 * TaskFlow AI - MCP服务验证脚本
 * 
 * 验证MCP服务器的功能和配置
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 检查Node.js版本
function checkNodeVersion() {
  return new Promise((resolve) => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      logSuccess(`Node.js版本检查通过: ${nodeVersion}`);
      resolve(true);
    } else {
      logError(`Node.js版本过低: ${nodeVersion}，需要 >= 18.0.0`);
      resolve(false);
    }
  });
}

// 检查项目构建
function checkBuild() {
  return new Promise((resolve) => {
    const distPath = path.join(process.cwd(), 'dist');
    const binPath = path.join(process.cwd(), 'bin');
    
    if (fs.existsSync(distPath) && fs.existsSync(binPath)) {
      logSuccess('项目构建文件检查通过');
      resolve(true);
    } else {
      logError('项目构建文件缺失，请运行 npm run build');
      resolve(false);
    }
  });
}

// 检查MCP配置文件
function checkMCPConfig() {
  return new Promise((resolve) => {
    const mcpConfigPath = path.join(process.cwd(), 'mcp-server.json');
    
    if (fs.existsSync(mcpConfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        if (config.name && config.server && config.capabilities) {
          logSuccess('MCP配置文件检查通过');
          resolve(true);
        } else {
          logError('MCP配置文件格式不正确');
          resolve(false);
        }
      } catch (error) {
        logError(`MCP配置文件解析失败: ${error.message}`);
        resolve(false);
      }
    } else {
      logError('MCP配置文件不存在: mcp-server.json');
      resolve(false);
    }
  });
}

// 测试MCP命令
function testMCPCommand() {
  return new Promise((resolve) => {
    const child = spawn('node', ['bin/index.js', 'mcp', '--help'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0 && output.includes('MCP')) {
        logSuccess('MCP命令测试通过');
        resolve(true);
      } else {
        logError('MCP命令测试失败');
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      logError(`MCP命令执行错误: ${error.message}`);
      resolve(false);
    });
  });
}

// 验证MCP配置完整性
function validateMCPConfiguration() {
  return new Promise((resolve) => {
    logInfo('验证MCP配置完整性...');

    const mcpConfigPath = path.join(process.cwd(), 'mcp-server.json');

    try {
      const config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

      // 检查必需的配置项
      const requiredFields = ['name', 'server', 'capabilities'];
      const missingFields = requiredFields.filter(field => !config[field]);

      if (missingFields.length > 0) {
        logError(`MCP配置缺少必需字段: ${missingFields.join(', ')}`);
        resolve(false);
        return;
      }

      // 检查服务器配置
      if (!config.server.command || !config.server.args) {
        logError('MCP服务器配置不完整');
        resolve(false);
        return;
      }

      // 检查工具配置
      if (!config.capabilities.tools || config.capabilities.tools.length === 0) {
        logError('MCP工具配置为空');
        resolve(false);
        return;
      }

      logSuccess('MCP配置完整性验证通过');
      resolve(true);
    } catch (error) {
      logError(`MCP配置验证失败: ${error.message}`);
      resolve(false);
    }
  });
}

// 检查环境变量
function checkEnvironment() {
  return new Promise((resolve) => {
    const requiredEnvVars = ['QWEN_API_KEY', 'DEEPSEEK_API_KEY', 'ZHIPU_API_KEY'];
    const availableKeys = requiredEnvVars.filter(key => process.env[key]);
    
    if (availableKeys.length > 0) {
      logSuccess(`环境变量检查通过，已配置: ${availableKeys.join(', ')}`);
      resolve(true);
    } else {
      logWarning('未检测到AI API密钥环境变量，MCP服务器可能无法正常工作');
      logInfo('请配置至少一个API密钥: QWEN_API_KEY, DEEPSEEK_API_KEY, ZHIPU_API_KEY');
      resolve(true); // 不阻塞验证，只是警告
    }
  });
}

// 生成MCP客户端配置
function generateClientConfig() {
  const config = {
    mcpServers: {
      "taskflow-ai": {
        command: "npx",
        args: ["taskflow-ai", "mcp"],
        env: {
          NODE_ENV: "production",
          AI_MODEL: "qwen",
          LOG_LEVEL: "info"
        }
      }
    }
  };

  const configPath = path.join(process.cwd(), 'mcp-client-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  logSuccess(`MCP客户端配置已生成: ${configPath}`);
}

// 主验证函数
async function verifyMCPService() {
  log('\n🔍 TaskFlow AI MCP服务验证', 'bold');
  log('═'.repeat(50), 'blue');
  
  const checks = [
    { name: 'Node.js版本检查', fn: checkNodeVersion },
    { name: '项目构建检查', fn: checkBuild },
    { name: 'MCP配置文件检查', fn: checkMCPConfig },
    { name: '环境变量检查', fn: checkEnvironment },
    { name: 'MCP命令测试', fn: testMCPCommand },
    { name: 'MCP配置完整性验证', fn: validateMCPConfiguration }
  ];
  
  let passedChecks = 0;
  
  for (const check of checks) {
    logInfo(`\n正在执行: ${check.name}`);
    const result = await check.fn();
    if (result) {
      passedChecks++;
    }
  }
  
  log('\n📊 验证结果', 'bold');
  log('-'.repeat(30), 'blue');
  
  if (passedChecks === checks.length) {
    logSuccess(`所有检查通过 (${passedChecks}/${checks.length})`);
    log('\n🎉 TaskFlow AI MCP服务已准备就绪！', 'green');
    
    logInfo('\n📋 下一步操作:');
    log('1. 生成MCP客户端配置文件', 'blue');
    generateClientConfig();

    log('2. 在Claude Desktop中配置MCP服务器', 'blue');
    log('   配置文件路径: ~/Library/Application Support/Claude/claude_desktop_config.json', 'yellow');
    log('   使用生成的配置文件: mcp-client-config.json', 'yellow');
    
  } else {
    logError(`部分检查失败 (${passedChecks}/${checks.length})`);
    log('\n❗ 请解决上述问题后重新验证', 'red');
  }
  
  log('\n📚 更多信息请参考:', 'blue');
  log('- 本地MCP部署指南: docs/local-mcp-deployment.md', 'yellow');
  log('- MCP服务器文档: MCP-README.md', 'yellow');
  log('- 项目文档: https://agions.github.io/taskflow-ai', 'yellow');
}

// 运行验证
if (require.main === module) {
  verifyMCPService().catch(error => {
    logError(`验证过程出错: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verifyMCPService };
