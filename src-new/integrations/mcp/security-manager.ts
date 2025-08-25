/**
 * TaskFlow AI MCP 服务器安全和信任机制
 * 提供完整的安全验证、权限控制和信任管理
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { ConfigManager } from '../../infrastructure/config/manager';
import { CacheManager } from '../../infrastructure/storage/cache';

export interface SecurityPolicy {
  id: string;
  name: string;
  version: string;
  rules: SecurityRule[];
  permissions: Permission[];
  trustedSources: TrustedSource[];
  restrictions: SecurityRestriction[];
  auditSettings: AuditSettings;
}

export interface SecurityRule {
  id: string;
  type: 'allow' | 'deny' | 'require';
  condition: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export interface TrustedSource {
  id: string;
  type: 'domain' | 'certificate' | 'signature' | 'repository';
  value: string;
  trustLevel: 'low' | 'medium' | 'high' | 'absolute';
  expiresAt?: Date;
}

export interface SecurityRestriction {
  type: 'network' | 'filesystem' | 'process' | 'memory' | 'time';
  rules: Record<string, any>;
}

export interface AuditSettings {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  retentionDays: number;
  sensitiveDataMasking: boolean;
}

export interface SecurityContext {
  serverId: string;
  sourceUrl?: string;
  certificate?: string;
  signature?: string;
  metadata: Record<string, any>;
  requestedPermissions: string[];
}

export interface SecurityAssessment {
  trusted: boolean;
  trustLevel: 'untrusted' | 'low' | 'medium' | 'high' | 'absolute';
  risks: SecurityRisk[];
  recommendations: string[];
  permissions: GrantedPermission[];
}

export interface SecurityRisk {
  id: string;
  type: 'certificate' | 'permission' | 'network' | 'code' | 'data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation?: string;
}

export interface GrantedPermission {
  resource: string;
  actions: string[];
  restrictions: Record<string, any>;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  keySize: number;
  algorithm: string;
}

/**
 * MCP服务器安全管理器
 */
export class MCPSecurityManager {
  private securityPolicies = new Map<string, SecurityPolicy>();
  private trustedCertificates = new Map<string, CertificateInfo>();
  private configManager: ConfigManager;
  private cacheManager: CacheManager;
  private auditLog: SecurityAuditLog;

  constructor(configManager: ConfigManager, cacheManager: CacheManager) {
    this.configManager = configManager;
    this.cacheManager = cacheManager;
    this.auditLog = new SecurityAuditLog(cacheManager);
  }

  /**
   * 初始化安全管理器
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔒 初始化MCP安全管理器...');

      // 加载默认安全策略
      await this.loadDefaultSecurityPolicies();

      // 加载受信任的证书
      await this.loadTrustedCertificates();

      // 初始化审计日志
      await this.auditLog.initialize();

      console.log('✅ MCP安全管理器初始化完成');

    } catch (error) {
      console.error('❌ MCP安全管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 评估MCP服务器安全性
   */
  async assessServerSecurity(context: SecurityContext): Promise<SecurityAssessment> {
    try {
      console.log(`🔍 评估MCP服务器安全性: ${context.serverId}`);

      const assessment: SecurityAssessment = {
        trusted: false,
        trustLevel: 'untrusted',
        risks: [],
        recommendations: [],
        permissions: []
      };

      // 1. 验证证书
      if (context.certificate) {
        const certRisks = await this.validateCertificate(context.certificate);
        assessment.risks.push(...certRisks);
      }

      // 2. 验证数字签名
      if (context.signature) {
        const sigRisks = await this.validateSignature(context);
        assessment.risks.push(...sigRisks);
      }

      // 3. 检查来源可信度
      if (context.sourceUrl) {
        const sourceRisks = await this.validateSource(context.sourceUrl);
        assessment.risks.push(...sourceRisks);
      }

      // 4. 评估请求的权限
      const permissionRisks = await this.evaluatePermissions(context.requestedPermissions);
      assessment.risks.push(...permissionRisks);

      // 5. 计算信任级别
      assessment.trustLevel = this.calculateTrustLevel(assessment.risks);
      assessment.trusted = assessment.trustLevel !== 'untrusted';

      // 6. 生成权限授予
      if (assessment.trusted) {
        assessment.permissions = await this.grantPermissions(
          context.requestedPermissions, 
          assessment.trustLevel
        );
      }

      // 7. 生成安全建议
      assessment.recommendations = this.generateSecurityRecommendations(assessment.risks);

      // 记录审计日志
      await this.auditLog.logSecurityAssessment(context, assessment);

      console.log(`✅ 安全评估完成: ${context.serverId} (信任级别: ${assessment.trustLevel})`);
      return assessment;

    } catch (error) {
      console.error(`❌ 安全评估失败: ${context.serverId}`, error);
      throw error;
    }
  }

  /**
   * 验证MCP服务器证书
   */
  async validateCertificate(certificate: string): Promise<SecurityRisk[]> {
    const risks: SecurityRisk[] = [];

    try {
      // 解析证书
      const cert = crypto.createHash('sha256').update(certificate).digest('hex');
      
      // 检查是否为受信任的证书
      const trustedCert = this.trustedCertificates.get(cert);
      if (!trustedCert) {
        risks.push({
          id: 'untrusted_certificate',
          type: 'certificate',
          severity: 'high',
          description: '证书未在受信任列表中',
          mitigation: '验证证书来源或添加到受信任列表'
        });
      }

      // 检查证书有效期
      if (trustedCert && trustedCert.validTo < new Date()) {
        risks.push({
          id: 'expired_certificate',
          type: 'certificate',
          severity: 'critical',
          description: '证书已过期',
          mitigation: '更新到有效证书'
        });
      }

      // 检查证书强度
      if (trustedCert && trustedCert.keySize < 2048) {
        risks.push({
          id: 'weak_certificate',
          type: 'certificate',
          severity: 'medium',
          description: '证书密钥强度不足',
          mitigation: '使用至少2048位的RSA密钥'
        });
      }

    } catch (error) {
      risks.push({
        id: 'certificate_validation_error',
        type: 'certificate',
        severity: 'high',
        description: `证书验证失败: ${error}`,
        mitigation: '检查证书格式和完整性'
      });
    }

    return risks;
  }

  /**
   * 验证数字签名
   */
  async validateSignature(context: SecurityContext): Promise<SecurityRisk[]> {
    const risks: SecurityRisk[] = [];

    try {
      if (!context.signature || !context.metadata.publicKey) {
        risks.push({
          id: 'missing_signature_data',
          type: 'certificate',
          severity: 'high',
          description: '缺少签名或公钥信息',
          mitigation: '提供完整的签名验证数据'
        });
        return risks;
      }

      // 验证签名（简化实现）
      const verify = crypto.createVerify('SHA256');
      verify.update(context.serverId);
      
      const isValid = verify.verify(context.metadata.publicKey, context.signature, 'base64');
      
      if (!isValid) {
        risks.push({
          id: 'invalid_signature',
          type: 'certificate',
          severity: 'critical',
          description: '数字签名验证失败',
          mitigation: '确保签名和公钥匹配'
        });
      }

    } catch (error) {
      risks.push({
        id: 'signature_validation_error',
        type: 'certificate',
        severity: 'high',
        description: `签名验证失败: ${error}`,
        mitigation: '检查签名格式和算法'
      });
    }

    return risks;
  }

  /**
   * 验证来源可信度
   */
  async validateSource(sourceUrl: string): Promise<SecurityRisk[]> {
    const risks: SecurityRisk[] = [];

    try {
      const url = new URL(sourceUrl);
      
      // 检查协议安全性
      if (url.protocol !== 'https:') {
        risks.push({
          id: 'insecure_protocol',
          type: 'network',
          severity: 'high',
          description: '使用了不安全的协议',
          mitigation: '使用HTTPS协议'
        });
      }

      // 检查域名是否在受信任列表中
      const trustedDomain = Array.from(this.securityPolicies.values())
        .flatMap(policy => policy.trustedSources)
        .find(source => source.type === 'domain' && url.hostname.endsWith(source.value));

      if (!trustedDomain) {
        risks.push({
          id: 'untrusted_domain',
          type: 'network',
          severity: 'medium',
          description: '域名不在受信任列表中',
          mitigation: '验证域名可信度或添加到受信任列表'
        });
      }

      // 检查是否为已知恶意域名
      if (await this.isKnownMaliciousDomain(url.hostname)) {
        risks.push({
          id: 'malicious_domain',
          type: 'network',
          severity: 'critical',
          description: '域名在恶意域名列表中',
          mitigation: '阻止连接并报告安全团队'
        });
      }

    } catch (error) {
      risks.push({
        id: 'source_validation_error',
        type: 'network',
        severity: 'medium',
        description: `来源验证失败: ${error}`,
        mitigation: '检查URL格式'
      });
    }

    return risks;
  }

  /**
   * 评估权限请求
   */
  async evaluatePermissions(requestedPermissions: string[]): Promise<SecurityRisk[]> {
    const risks: SecurityRisk[] = [];

    for (const permission of requestedPermissions) {
      // 检查敏感权限
      if (this.isSensitivePermission(permission)) {
        risks.push({
          id: 'sensitive_permission_request',
          type: 'permission',
          severity: 'high',
          description: `请求敏感权限: ${permission}`,
          mitigation: '仔细审查权限必要性'
        });
      }

      // 检查权限组合风险
      const combinationRisk = this.evaluatePermissionCombination(requestedPermissions);
      if (combinationRisk) {
        risks.push(combinationRisk);
      }
    }

    return risks;
  }

  /**
   * 计算信任级别
   */
  private calculateTrustLevel(risks: SecurityRisk[]): SecurityAssessment['trustLevel'] {
    const criticalRisks = risks.filter(r => r.severity === 'critical').length;
    const highRisks = risks.filter(r => r.severity === 'high').length;
    const mediumRisks = risks.filter(r => r.severity === 'medium').length;

    if (criticalRisks > 0) {
      return 'untrusted';
    } else if (highRisks > 2) {
      return 'low';
    } else if (highRisks > 0 || mediumRisks > 3) {
      return 'medium';
    } else if (mediumRisks > 0) {
      return 'high';
    } else {
      return 'absolute';
    }
  }

  /**
   * 授予权限
   */
  private async grantPermissions(
    requestedPermissions: string[], 
    trustLevel: string
  ): Promise<GrantedPermission[]> {
    const grantedPermissions: GrantedPermission[] = [];

    for (const permission of requestedPermissions) {
      const granted = this.shouldGrantPermission(permission, trustLevel);
      if (granted) {
        grantedPermissions.push({
          resource: permission,
          actions: this.getAllowedActions(permission, trustLevel),
          restrictions: this.getPermissionRestrictions(permission, trustLevel)
        });
      }
    }

    return grantedPermissions;
  }

  /**
   * 生成安全建议
   */
  private generateSecurityRecommendations(risks: SecurityRisk[]): string[] {
    const recommendations: string[] = [];

    if (risks.some(r => r.type === 'certificate')) {
      recommendations.push('使用有效的SSL/TLS证书');
      recommendations.push('定期更新证书');
    }

    if (risks.some(r => r.type === 'network')) {
      recommendations.push('使用HTTPS协议');
      recommendations.push('验证域名可信度');
    }

    if (risks.some(r => r.type === 'permission')) {
      recommendations.push('遵循最小权限原则');
      recommendations.push('定期审查权限使用');
    }

    return [...new Set(recommendations)];
  }

  // 辅助方法

  private async loadDefaultSecurityPolicies(): Promise<void> {
    const defaultPolicy: SecurityPolicy = {
      id: 'default',
      name: '默认安全策略',
      version: '1.0.0',
      rules: [
        {
          id: 'require_https',
          type: 'require',
          condition: 'protocol === "https"',
          description: '要求使用HTTPS协议',
          severity: 'high'
        },
        {
          id: 'deny_file_write',
          type: 'deny',
          condition: 'permission.includes("file:write")',
          description: '禁止文件写入权限',
          severity: 'medium'
        }
      ],
      permissions: [],
      trustedSources: [
        {
          id: 'github',
          type: 'domain',
          value: 'github.com',
          trustLevel: 'high'
        }
      ],
      restrictions: [
        {
          type: 'network',
          rules: {
            allowedDomains: ['*.github.com', '*.npmjs.com'],
            deniedDomains: ['*.malicious.com']
          }
        }
      ],
      auditSettings: {
        enabled: true,
        logLevel: 'info',
        retentionDays: 30,
        sensitiveDataMasking: true
      }
    };

    this.securityPolicies.set('default', defaultPolicy);
  }

  private async loadTrustedCertificates(): Promise<void> {
    // 这里可以从配置文件或证书存储中加载受信任的证书
    // 简化实现
  }

  private async isKnownMaliciousDomain(domain: string): Promise<boolean> {
    // 这里可以集成恶意域名检测服务
    const maliciousDomains = ['malicious.com', 'phishing.net'];
    return maliciousDomains.some(malicious => domain.includes(malicious));
  }

  private isSensitivePermission(permission: string): boolean {
    const sensitivePermissions = [
      'file:write',
      'file:delete',
      'network:unrestricted',
      'process:spawn',
      'system:admin'
    ];
    return sensitivePermissions.includes(permission);
  }

  private evaluatePermissionCombination(permissions: string[]): SecurityRisk | null {
    // 检查危险的权限组合
    if (permissions.includes('file:write') && permissions.includes('network:unrestricted')) {
      return {
        id: 'dangerous_permission_combination',
        type: 'permission',
        severity: 'critical',
        description: '文件写入和网络访问权限组合存在安全风险',
        mitigation: '限制权限范围或加强监控'
      };
    }
    return null;
  }

  private shouldGrantPermission(permission: string, trustLevel: string): boolean {
    // 根据信任级别决定是否授予权限
    const sensitivePermissions = ['file:write', 'file:delete', 'process:spawn'];
    
    if (sensitivePermissions.includes(permission)) {
      return trustLevel === 'absolute' || trustLevel === 'high';
    }
    
    return trustLevel !== 'untrusted';
  }

  private getAllowedActions(permission: string, trustLevel: string): string[] {
    // 根据信任级别返回允许的操作
    const baseActions = ['read'];
    
    if (trustLevel === 'high' || trustLevel === 'absolute') {
      baseActions.push('write', 'execute');
    } else if (trustLevel === 'medium') {
      baseActions.push('write');
    }
    
    return baseActions;
  }

  private getPermissionRestrictions(permission: string, trustLevel: string): Record<string, any> {
    // 根据信任级别设置权限限制
    const restrictions: Record<string, any> = {};
    
    if (trustLevel !== 'absolute') {
      restrictions.timeLimit = 3600; // 1小时
      restrictions.auditRequired = true;
    }
    
    if (permission.includes('file:')) {
      restrictions.allowedPaths = ['/tmp', '/var/tmp'];
    }
    
    return restrictions;
  }
}

/**
 * 安全审计日志
 */
class SecurityAuditLog {
  private cacheManager: CacheManager;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  async initialize(): Promise<void> {
    // 初始化审计日志
  }

  async logSecurityAssessment(context: SecurityContext, assessment: SecurityAssessment): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      serverId: context.serverId,
      sourceUrl: context.sourceUrl,
      trustLevel: assessment.trustLevel,
      riskCount: assessment.risks.length,
      criticalRisks: assessment.risks.filter(r => r.severity === 'critical').length
    };

    await this.cacheManager.set(`audit:${Date.now()}`, logEntry, 86400 * 30); // 30天
  }
}

export default MCPSecurityManager;