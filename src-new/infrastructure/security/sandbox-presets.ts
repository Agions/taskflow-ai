/**
 * TaskFlow AI 沙箱预设配置
 * 提供不同用途的安全沙箱配置预设
 */

import { SandboxConfig } from './sandbox';

/**
 * 沙箱安全级别
 */
export enum SecurityLevel {
  STRICT = 'strict',     // 严格模式 - 最高安全性
  MODERATE = 'moderate', // 适中模式 - 平衡安全性和功能
  PERMISSIVE = 'permissive', // 宽松模式 - 更多功能
  DEVELOPMENT = 'development' // 开发模式 - 便于调试
}

/**
 * 沙箱配置预设
 */
export class SandboxPresets {
  
  /**
   * 获取预设配置
   */
  static getPreset(preset: string): SandboxConfig {
    switch (preset) {
      case 'nodejs-strict':
        return this.getNodeJSStrictConfig();
      case 'nodejs-dev':
        return this.getNodeJSDevConfig();
      case 'python-strict':
        return this.getPythonStrictConfig();
      case 'python-ml':
        return this.getPythonMLConfig();
      case 'shell-restricted':
        return this.getShellRestrictedConfig();
      case 'docker-secure':
        return this.getDockerSecureConfig();
      default:
        return this.getDefaultConfig();
    }
  }

  /**
   * 根据安全级别获取配置
   */
  static getConfigBySecurityLevel(level: SecurityLevel, language: string = 'nodejs'): SandboxConfig {
    const baseConfig = this.getBaseConfig(language);
    
    switch (level) {
      case SecurityLevel.STRICT:
        return {
          ...baseConfig,
          timeoutMs: 10000, // 10秒
          memoryLimitMB: 128,
          cpuLimitPercent: 25,
          networkEnabled: false,
          filesystemAccess: 'readonly',
          allowedCommands: this.getStrictCommands(language),
          blockedCommands: this.getStrictBlockedCommands(),
        };

      case SecurityLevel.MODERATE:
        return {
          ...baseConfig,
          timeoutMs: 30000, // 30秒
          memoryLimitMB: 256,
          cpuLimitPercent: 50,
          networkEnabled: false,
          filesystemAccess: 'restricted',
          allowedCommands: this.getModerateCommands(language),
          blockedCommands: this.getModerateBlockedCommands(),
        };

      case SecurityLevel.PERMISSIVE:
        return {
          ...baseConfig,
          timeoutMs: 60000, // 1分钟
          memoryLimitMB: 512,
          cpuLimitPercent: 75,
          networkEnabled: true,
          filesystemAccess: 'restricted',
          allowedCommands: this.getPermissiveCommands(language),
          blockedCommands: this.getPermissiveBlockedCommands(),
        };

      case SecurityLevel.DEVELOPMENT:
        return {
          ...baseConfig,
          timeoutMs: 120000, // 2分钟
          memoryLimitMB: 1024,
          cpuLimitPercent: 100,
          networkEnabled: true,
          filesystemAccess: 'full',
          allowedCommands: [], // 允许所有命令
          blockedCommands: this.getDevelopmentBlockedCommands(),
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Node.js 严格模式配置
   */
  private static getNodeJSStrictConfig(): SandboxConfig {
    return {
      type: 'docker',
      timeoutMs: 15000,
      memoryLimitMB: 128,
      cpuLimitPercent: 30,
      networkEnabled: false,
      filesystemAccess: 'readonly',
      allowedCommands: ['node'],
      blockedCommands: [
        'eval', 'Function', 'require', 'import',
        'process', 'global', 'Buffer',
        'fs', 'path', 'os', 'child_process',
        'cluster', 'dgram', 'dns', 'http', 'https',
        'net', 'tls', 'url', 'querystring'
      ],
      environmentVariables: {
        NODE_ENV: 'sandbox',
        NODE_OPTIONS: '--max-old-space-size=128'
      },
      image: 'node:18-alpine'
    };
  }

  /**
   * Node.js 开发模式配置
   */
  private static getNodeJSDevConfig(): SandboxConfig {
    return {
      type: 'process',
      timeoutMs: 60000,
      memoryLimitMB: 512,
      cpuLimitPercent: 75,
      networkEnabled: true,
      filesystemAccess: 'restricted',
      allowedCommands: ['node', 'npm', 'yarn', 'pnpm'],
      blockedCommands: [
        'rm', 'rmdir', 'del', 'format',
        'sudo', 'su', 'chmod', 'chown',
        'mount', 'umount', 'fdisk'
      ],
      environmentVariables: {
        NODE_ENV: 'development'
      }
    };
  }

  /**
   * Python 严格模式配置
   */
  private static getPythonStrictConfig(): SandboxConfig {
    return {
      type: 'docker',
      timeoutMs: 20000,
      memoryLimitMB: 256,
      cpuLimitPercent: 40,
      networkEnabled: false,
      filesystemAccess: 'readonly',
      allowedCommands: ['python3', 'python'],
      blockedCommands: [
        'exec', 'eval', 'compile', '__import__',
        'open', 'input', 'raw_input',
        'os', 'sys', 'subprocess', 'multiprocessing',
        'socket', 'urllib', 'requests'
      ],
      environmentVariables: {
        PYTHONPATH: '/workspace',
        PYTHONDONTWRITEBYTECODE: '1'
      },
      image: 'python:3.11-alpine'
    };
  }

  /**
   * Python 机器学习配置
   */
  private static getPythonMLConfig(): SandboxConfig {
    return {
      type: 'docker',
      timeoutMs: 180000, // 3分钟
      memoryLimitMB: 2048, // 2GB
      cpuLimitPercent: 80,
      networkEnabled: true, // ML模型可能需要下载
      filesystemAccess: 'restricted',
      allowedCommands: ['python3', 'pip'],
      blockedCommands: [
        'rm', 'rmdir', 'del', 'format',
        'sudo', 'su', 'chmod', 'chown'
      ],
      environmentVariables: {
        PYTHONPATH: '/workspace',
        CUDA_VISIBLE_DEVICES: '' // 禁用GPU
      },
      image: 'tensorflow/tensorflow:latest-py3'
    };
  }

  /**
   * Shell 受限模式配置
   */
  private static getShellRestrictedConfig(): SandboxConfig {
    return {
      type: 'docker',
      timeoutMs: 30000,
      memoryLimitMB: 128,
      cpuLimitPercent: 50,
      networkEnabled: false,
      filesystemAccess: 'restricted',
      allowedCommands: [
        'sh', 'bash', 'echo', 'cat', 'grep', 'awk', 'sed',
        'sort', 'uniq', 'wc', 'head', 'tail', 'cut',
        'ls', 'pwd', 'cd', 'mkdir', 'touch'
      ],
      blockedCommands: [
        'rm', 'rmdir', 'del', 'mv', 'cp',
        'sudo', 'su', 'chmod', 'chown',
        'mount', 'umount', 'fdisk', 'mkfs',
        'wget', 'curl', 'nc', 'netcat',
        'ssh', 'scp', 'rsync'
      ],
      environmentVariables: {
        SHELL: '/bin/sh',
        PATH: '/usr/local/bin:/usr/bin:/bin'
      },
      image: 'alpine:latest'
    };
  }

  /**
   * Docker 安全配置
   */
  private static getDockerSecureConfig(): SandboxConfig {
    return {
      type: 'docker',
      timeoutMs: 45000,
      memoryLimitMB: 512,
      cpuLimitPercent: 60,
      networkEnabled: false,
      filesystemAccess: 'readonly',
      allowedCommands: [],
      blockedCommands: [],
      environmentVariables: {
        DOCKER_CONTENT_TRUST: '1'
      },
      image: 'alpine:latest',
      volumes: [
        {
          host: '/tmp/sandbox-readonly',
          container: '/readonly',
          readonly: true
        }
      ]
    };
  }

  /**
   * 默认配置
   */
  private static getDefaultConfig(): SandboxConfig {
    return {
      type: 'process',
      timeoutMs: 30000,
      memoryLimitMB: 256,
      cpuLimitPercent: 50,
      networkEnabled: false,
      filesystemAccess: 'restricted',
      allowedCommands: ['node', 'python3', 'python', 'sh', 'bash'],
      blockedCommands: [
        'rm', 'rmdir', 'del', 'format',
        'sudo', 'su', 'chmod', 'chown'
      ],
      environmentVariables: {}
    };
  }

  private static getBaseConfig(language: string): SandboxConfig {
    return {
      type: 'process',
      timeoutMs: 30000,
      memoryLimitMB: 256,
      cpuLimitPercent: 50,
      networkEnabled: false,
      filesystemAccess: 'restricted',
      allowedCommands: this.getLanguageCommands(language),
      blockedCommands: [],
      environmentVariables: {}
    };
  }

  private static getLanguageCommands(language: string): string[] {
    switch (language.toLowerCase()) {
      case 'nodejs':
      case 'javascript':
        return ['node', 'npm'];
      case 'python':
        return ['python3', 'python', 'pip'];
      case 'shell':
      case 'bash':
        return ['sh', 'bash', 'echo', 'cat', 'grep'];
      default:
        return ['node'];
    }
  }

  private static getStrictCommands(language: string): string[] {
    switch (language.toLowerCase()) {
      case 'nodejs':
        return ['node'];
      case 'python':
        return ['python3'];
      case 'shell':
        return ['sh', 'echo'];
      default:
        return [];
    }
  }

  private static getModerateCommands(language: string): string[] {
    switch (language.toLowerCase()) {
      case 'nodejs':
        return ['node', 'npm'];
      case 'python':
        return ['python3', 'pip'];
      case 'shell':
        return ['sh', 'bash', 'echo', 'cat', 'grep', 'ls'];
      default:
        return ['node'];
    }
  }

  private static getPermissiveCommands(language: string): string[] {
    switch (language.toLowerCase()) {
      case 'nodejs':
        return ['node', 'npm', 'yarn', 'git'];
      case 'python':
        return ['python3', 'pip', 'git'];
      case 'shell':
        return ['sh', 'bash', 'echo', 'cat', 'grep', 'ls', 'mkdir', 'touch', 'git'];
      default:
        return ['node', 'git'];
    }
  }

  private static getStrictBlockedCommands(): string[] {
    return [
      // 文件系统危险命令
      'rm', 'rmdir', 'del', 'mv', 'cp', 'dd',
      'format', 'fdisk', 'mkfs', 'mount', 'umount',
      
      // 权限相关
      'sudo', 'su', 'chmod', 'chown', 'chgrp',
      
      // 网络相关
      'wget', 'curl', 'nc', 'netcat', 'ssh', 'scp',
      'ftp', 'sftp', 'rsync',
      
      // 系统相关
      'reboot', 'shutdown', 'halt', 'init',
      'systemctl', 'service', 'crontab',
      
      // 进程相关
      'kill', 'killall', 'pkill', 'nohup', 'screen', 'tmux'
    ];
  }

  private static getModerateBlockedCommands(): string[] {
    return [
      'rm', 'rmdir', 'del', 'format', 'fdisk',
      'sudo', 'su', 'mount', 'umount',
      'reboot', 'shutdown', 'halt', 'init'
    ];
  }

  private static getPermissiveBlockedCommands(): string[] {
    return [
      'format', 'fdisk', 'mkfs',
      'sudo', 'su',
      'reboot', 'shutdown', 'halt', 'init'
    ];
  }

  private static getDevelopmentBlockedCommands(): string[] {
    return [
      'format', 'fdisk',
      'reboot', 'shutdown', 'halt'
    ];
  }
}

/**
 * 沙箱安全策略
 */
export class SandboxSecurityPolicy {
  
  /**
   * 验证代码安全性
   */
  static validateCode(code: string, language: string): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isSecure: true,
      risks: [],
      warnings: [],
      blockedPatterns: []
    };

    const patterns = this.getSecurityPatterns(language);
    
    for (const pattern of patterns) {
      const matches = code.match(pattern.regex);
      if (matches) {
        result.risks.push({
          type: pattern.type,
          description: pattern.description,
          severity: pattern.severity,
          line: this.findLineNumber(code, matches[0])
        });
        
        if (pattern.severity === 'high' || pattern.severity === 'critical') {
          result.isSecure = false;
          result.blockedPatterns.push(pattern.name);
        } else {
          result.warnings.push(pattern.description);
        }
      }
    }

    return result;
  }

  /**
   * 获取安全模式
   */
  private static getSecurityPatterns(language: string): SecurityPattern[] {
    const commonPatterns: SecurityPattern[] = [
      {
        name: 'file_system_access',
        regex: /require\s*\(\s*['"]fs['"|'path['"]|import.*from\s*['"]fs['"|'path['"]/g,
        type: 'file_access',
        description: '检测到文件系统访问',
        severity: 'medium'
      },
      {
        name: 'network_access',
        regex: /require\s*\(\s*['"]http['"|'https['"|'net['"]\)|fetch\(|XMLHttpRequest/g,
        type: 'network_access',
        description: '检测到网络访问',
        severity: 'medium'
      },
      {
        name: 'process_access',
        regex: /require\s*\(\s*['"]child_process['"]\)|process\.exit|process\.kill/g,
        type: 'process_access',
        description: '检测到进程操作',
        severity: 'high'
      },
      {
        name: 'eval_usage',
        regex: /eval\s*\(|Function\s*\(|setTimeout\s*\(\s*['"`]/g,
        type: 'code_injection',
        description: '检测到代码注入风险',
        severity: 'critical'
      }
    ];

    switch (language.toLowerCase()) {
      case 'nodejs':
      case 'javascript':
        return [
          ...commonPatterns,
          {
            name: 'global_access',
            regex: /global\.|process\.|Buffer\.|require\.cache/g,
            type: 'global_access',
            description: '检测到全局对象访问',
            severity: 'medium'
          }
        ];
        
      case 'python':
        return [
          {
            name: 'import_os',
            regex: /import\s+os|from\s+os\s+import|__import__\s*\(\s*['"]os['"]/g,
            type: 'system_access',
            description: '检测到操作系统访问',
            severity: 'high'
          },
          {
            name: 'exec_eval',
            regex: /exec\s*\(|eval\s*\(|compile\s*\(/g,
            type: 'code_injection',
            description: '检测到代码执行',
            severity: 'critical'
          },
          {
            name: 'file_operations',
            regex: /open\s*\(|file\s*\(/g,
            type: 'file_access',
            description: '检测到文件操作',
            severity: 'medium'
          }
        ];
        
      default:
        return commonPatterns;
    }
  }

  private static findLineNumber(code: string, match: string): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 1;
  }
}

// 类型定义

export interface SecurityValidationResult {
  isSecure: boolean;
  risks: SecurityRisk[];
  warnings: string[];
  blockedPatterns: string[];
}

export interface SecurityRisk {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
}

export interface SecurityPattern {
  name: string;
  regex: RegExp;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}