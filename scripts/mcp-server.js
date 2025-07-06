#!/usr/bin/env node

/**
 * TaskFlow AI MCP Server Launcher
 * 
 * This script launches the TaskFlow AI MCP server with proper configuration
 * and error handling for Docker and standalone environments.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  // Server configuration
  server: {
    name: 'taskflow-ai',
    version: '1.0.0',
    transport: process.env.MCP_TRANSPORT || 'stdio',
    port: process.env.MCP_PORT || 3000,
  },
  
  // Paths
  paths: {
    root: path.resolve(__dirname, '..'),
    bin: path.resolve(__dirname, '..', 'bin'),
    data: process.env.TASKFLOW_DATA_DIR || path.resolve(__dirname, '..', 'data'),
    logs: process.env.TASKFLOW_LOG_DIR || path.resolve(__dirname, '..', 'logs'),
    config: process.env.TASKFLOW_CONFIG_DIR || path.resolve(__dirname, '..', 'config'),
  },
  
  // Environment
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
    TASKFLOW_ENV: process.env.TASKFLOW_ENV || 'production',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    AI_MODEL: process.env.AI_MODEL || 'qwen',
  }
};

/**
 * Ensure required directories exist
 */
function ensureDirectories() {
  const dirs = [CONFIG.paths.data, CONFIG.paths.logs, CONFIG.paths.config];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Validate environment and dependencies
 */
function validateEnvironment() {
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    console.error(`Error: Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    process.exit(1);
  }
  
  // Check if main executable exists
  const mainExecutable = path.join(CONFIG.paths.bin, 'index.js');
  if (!fs.existsSync(mainExecutable)) {
    console.error(`Error: Main executable not found at ${mainExecutable}`);
    console.error('Please ensure TaskFlow AI is properly built and installed.');
    process.exit(1);
  }
  
  console.log(`✓ Environment validation passed`);
  console.log(`✓ Node.js version: ${nodeVersion}`);
  console.log(`✓ TaskFlow AI executable found`);
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers(childProcess) {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      
      if (childProcess && !childProcess.killed) {
        childProcess.kill(signal);
        
        // Force kill after timeout
        setTimeout(() => {
          if (!childProcess.killed) {
            console.log('Force killing child process...');
            childProcess.kill('SIGKILL');
          }
        }, 5000);
      }
      
      process.exit(0);
    });
  });
}

/**
 * Launch the MCP server
 */
function launchMCPServer() {
  console.log('🚀 Starting TaskFlow AI MCP Server...');
  console.log(`📍 Transport: ${CONFIG.server.transport}`);
  console.log(`📍 Environment: ${CONFIG.env.TASKFLOW_ENV}`);
  console.log(`📍 Data directory: ${CONFIG.paths.data}`);
  console.log(`📍 Log level: ${CONFIG.env.LOG_LEVEL}`);
  
  // Prepare environment variables
  const env = {
    ...process.env,
    ...CONFIG.env,
    TASKFLOW_DATA_DIR: CONFIG.paths.data,
    TASKFLOW_LOG_DIR: CONFIG.paths.logs,
    TASKFLOW_CONFIG_DIR: CONFIG.paths.config,
  };
  
  // Prepare command arguments
  const executable = path.join(CONFIG.paths.bin, 'index.js');
  const args = ['mcp', 'server'];
  
  // Add transport-specific arguments
  if (CONFIG.server.transport === 'http') {
    args.push('--transport', 'http');
    args.push('--port', CONFIG.server.port.toString());
  }
  
  // Spawn the MCP server process
  const childProcess = spawn('node', [executable, ...args], {
    env,
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: CONFIG.paths.root,
  });
  
  // Setup signal handlers
  setupSignalHandlers(childProcess);
  
  // Handle child process events
  childProcess.on('spawn', () => {
    console.log(`✓ TaskFlow AI MCP Server started (PID: ${childProcess.pid})`);
  });
  
  childProcess.on('error', (error) => {
    console.error(`❌ Failed to start MCP server: ${error.message}`);
    process.exit(1);
  });
  
  childProcess.on('exit', (code, signal) => {
    if (signal) {
      console.log(`🛑 MCP server terminated by signal: ${signal}`);
    } else if (code === 0) {
      console.log(`✓ MCP server exited successfully`);
    } else {
      console.error(`❌ MCP server exited with code: ${code}`);
      process.exit(code);
    }
  });
  
  return childProcess;
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
TaskFlow AI MCP Server Launcher

Usage: node mcp-server.js [options]

Options:
  --help, -h          Show this help message
  --version, -v       Show version information
  --transport <type>  Set transport type (stdio|http) [default: stdio]
  --port <port>       Set HTTP port [default: 3000]
  --verbose           Enable verbose logging

Environment Variables:
  MCP_TRANSPORT       Transport type (stdio|http)
  MCP_PORT           HTTP port number
  TASKFLOW_DATA_DIR  Data directory path
  TASKFLOW_LOG_DIR   Log directory path
  TASKFLOW_CONFIG_DIR Configuration directory path
  LOG_LEVEL          Logging level (debug|info|warn|error)
  AI_MODEL           Default AI model (qwen|deepseek|zhipu|baichuan|moonshot|yi)

Examples:
  node mcp-server.js                    # Start with stdio transport
  node mcp-server.js --transport http   # Start with HTTP transport
  MCP_PORT=8080 node mcp-server.js      # Start with custom port

For more information, visit: https://github.com/Agions/taskflow-ai
`);
}

/**
 * Display version information
 */
function displayVersion() {
  console.log(`TaskFlow AI MCP Server v${CONFIG.server.version}`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    return;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    displayVersion();
    return;
  }
  
  // Parse transport option
  const transportIndex = args.indexOf('--transport');
  if (transportIndex !== -1 && args[transportIndex + 1]) {
    CONFIG.server.transport = args[transportIndex + 1];
  }
  
  // Parse port option
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    CONFIG.server.port = parseInt(args[portIndex + 1]);
  }
  
  // Enable verbose logging if requested
  if (args.includes('--verbose')) {
    CONFIG.env.LOG_LEVEL = 'debug';
  }
  
  try {
    // Initialize
    ensureDirectories();
    validateEnvironment();
    
    // Launch server
    launchMCPServer();
    
  } catch (error) {
    console.error(`❌ Failed to start TaskFlow AI MCP Server: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  launchMCPServer,
  ensureDirectories,
  validateEnvironment,
};
