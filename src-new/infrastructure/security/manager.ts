/**
 * TaskFlow AI 安全管理器
 * 提供API密钥加密存储、JWT认证、输入验证等安全功能
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import jwt from 'jsonwebtoken';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
    ivSize: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
  };
  storage: {
    keyFile: string;
    saltFile: string;
  };
  validation: {
    maxInputLength: number;
    allowedChars: RegExp;
  };
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
}

export interface APIKeyInfo {
  id: string;
  name: string;
  provider: string;
  encryptedKey: EncryptedData;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface JWTPayload {
  userId: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
}

/**
 * 安全管理器
 * 负责密钥管理、加密解密、身份验证等安全功能
 */
export class SecurityManager {
  private config: SecurityConfig;
  private masterKey?: Buffer;
  private keyStore = new Map<string, APIKeyInfo>();
  private secureDir: string;
  private initialized = false;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      encryption: {
        algorithm: 'aes-256-gcm',
        keySize: 32, // 256 bits
        ivSize: 16,  // 128 bits
      },
      jwt: {
        secret: this.generateSecureSecret(),
        expiresIn: '24h',
        issuer: 'taskflow-ai',
      },
      storage: {
        keyFile: 'api-keys.enc',
        saltFile: 'master.salt',
      },
      validation: {
        maxInputLength: 10000,
        allowedChars: /^[\w\s\-._@#$%^&*()+=[\]{}|;:'"<>,.?/~`!]+$/,
      },
      ...config,
    };

    this.secureDir = path.join(os.homedir(), '.taskflow', 'secure');
  }

  /**
   * 初始化安全管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 创建安全目录
      await fs.ensureDir(this.secureDir);
      
      // 设置目录权限（仅所有者可访问）
      await fs.chmod(this.secureDir, 0o700);

      // 初始化主密钥
      await this.initializeMasterKey();

      // 加载已存储的API密钥
      await this.loadAPIKeys();

      this.initialized = true;
      console.log('🔐 安全管理器初始化成功');

    } catch (error) {
      console.error('❌ 安全管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加密并存储API密钥
   */
  async storeAPIKey(
    id: string, 
    name: string, 
    provider: string, 
    apiKey: string, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    this.ensureInitialized();

    // 验证输入
    this.validateInput(apiKey, 'API密钥');
    this.validateInput(name, '密钥名称');

    // 加密API密钥
    const encryptedKey = this.encrypt(apiKey);

    const keyInfo: APIKeyInfo = {
      id,
      name,
      provider,
      encryptedKey,
      createdAt: new Date(),
      isActive: true,
      metadata,
    };

    this.keyStore.set(id, keyInfo);

    // 持久化存储
    await this.saveAPIKeys();

    console.log(`🔑 API密钥已安全存储: ${name} (${provider})`);
  }

  /**
   * 获取并解密API密钥
   */
  async getAPIKey(id: string): Promise<string | null> {
    this.ensureInitialized();

    const keyInfo = this.keyStore.get(id);
    if (!keyInfo) {
      return null;
    }

    if (!keyInfo.isActive) {
      throw new Error('API密钥已被禁用');
    }

    try {
      const decryptedKey = this.decrypt(keyInfo.encryptedKey);
      
      // 更新最后使用时间
      keyInfo.lastUsed = new Date();
      await this.saveAPIKeys();

      return decryptedKey;
    } catch (error) {
      console.error(`❌ 解密API密钥失败: ${id}`, error);
      throw new Error('API密钥解密失败');
    }
  }

  /**
   * 列出所有API密钥（不包含密钥值）
   */
  listAPIKeys(): Array<Omit<APIKeyInfo, 'encryptedKey'>> {
    this.ensureInitialized();

    return Array.from(this.keyStore.values()).map(({ encryptedKey, ...info }) => info);
  }

  /**
   * 删除API密钥
   */
  async deleteAPIKey(id: string): Promise<boolean> {
    this.ensureInitialized();

    const deleted = this.keyStore.delete(id);
    if (deleted) {
      await this.saveAPIKeys();
      console.log(`🗑️ API密钥已删除: ${id}`);
    }

    return deleted;
  }

  /**
   * 启用/禁用API密钥
   */
  async toggleAPIKey(id: string, isActive: boolean): Promise<boolean> {
    this.ensureInitialized();

    const keyInfo = this.keyStore.get(id);
    if (!keyInfo) {
      return false;
    }

    keyInfo.isActive = isActive;
    await this.saveAPIKeys();

    console.log(`🔄 API密钥状态已更新: ${id} -> ${isActive ? '启用' : '禁用'}`);
    return true;
  }

  /**
   * 生成JWT令牌
   */
  generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'>): string {
    this.ensureInitialized();

    const fullPayload: JWTPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiresIn(this.config.jwt.expiresIn),
      iss: this.config.jwt.issuer,
    };

    return jwt.sign(fullPayload, this.config.jwt.secret);
  }

  /**
   * 验证JWT令牌
   */
  verifyJWT(token: string): JWTPayload | null {
    this.ensureInitialized();

    try {
      const decoded = jwt.verify(token, this.config.jwt.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.warn('⚠️ JWT验证失败:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * 输入验证
   */
  validateInput(input: string, fieldName: string): void {
    if (!input || typeof input !== 'string') {
      throw new Error(`${fieldName}不能为空`);
    }

    if (input.length > this.config.validation.maxInputLength) {
      throw new Error(`${fieldName}长度超过限制: ${this.config.validation.maxInputLength}`);
    }

    if (!this.config.validation.allowedChars.test(input)) {
      throw new Error(`${fieldName}包含非法字符`);
    }
  }

  /**
   * 生成安全的随机字符串
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 计算文件哈希
   */
  async calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 安全比较字符串（防止时间攻击）
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * 导出加密配置（用于备份）
   */
  async exportKeys(password: string): Promise<string> {
    this.ensureInitialized();

    const exportData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      keys: Array.from(this.keyStore.values()),
    };

    // 使用密码加密导出数据
    const exportJson = JSON.stringify(exportData);
    const passwordKey = crypto.scryptSync(password, 'export-salt', 32);
    const encrypted = this.encryptWithKey(exportJson, passwordKey);

    return JSON.stringify(encrypted);
  }

  /**
   * 导入加密配置
   */
  async importKeys(encryptedData: string, password: string): Promise<number> {
    this.ensureInitialized();

    try {
      const encrypted = JSON.parse(encryptedData) as EncryptedData;
      const passwordKey = crypto.scryptSync(password, 'export-salt', 32);
      const decryptedJson = this.decryptWithKey(encrypted, passwordKey);
      const importData = JSON.parse(decryptedJson);

      let importedCount = 0;
      for (const keyInfo of importData.keys) {
        this.keyStore.set(keyInfo.id, keyInfo);
        importedCount++;
      }

      await this.saveAPIKeys();
      console.log(`📥 导入了 ${importedCount} 个API密钥`);
      
      return importedCount;
    } catch (error) {
      throw new Error('导入失败：密码错误或数据损坏');
    }
  }

  /**
   * 更改主密钥
   */
  async changeMasterKey(newPassword: string): Promise<void> {
    this.ensureInitialized();

    // 解密所有现有密钥
    const decryptedKeys = new Map<string, string>();
    for (const [id, keyInfo] of this.keyStore) {
      try {
        decryptedKeys.set(id, this.decrypt(keyInfo.encryptedKey));
      } catch (error) {
        console.error(`解密密钥 ${id} 失败:`, error);
      }
    }

    // 生成新的主密钥
    const newSalt = crypto.randomBytes(32);
    const newMasterKey = crypto.scryptSync(newPassword, newSalt, this.config.encryption.keySize);

    // 保存新的盐值
    const saltPath = path.join(this.secureDir, this.config.storage.saltFile);
    await fs.writeFile(saltPath, newSalt);
    await fs.chmod(saltPath, 0o600);

    // 使用新密钥重新加密所有密钥
    this.masterKey = newMasterKey;
    for (const [id, plainKey] of decryptedKeys) {
      const keyInfo = this.keyStore.get(id)!;
      keyInfo.encryptedKey = this.encrypt(plainKey);
    }

    await this.saveAPIKeys();
    console.log('🔄 主密钥已更新');
  }

  /**
   * 关闭安全管理器
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // 清理内存中的敏感数据
      if (this.masterKey) {
        this.masterKey.fill(0);
        this.masterKey = undefined;
      }

      this.keyStore.clear();

      this.initialized = false;
      console.log('✅ 安全管理器已关闭');

    } catch (error) {
      console.error('❌ 安全管理器关闭失败:', error);
      throw error;
    }
  }

  // 私有方法

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('安全管理器尚未初始化');
    }
  }

  private async initializeMasterKey(): Promise<void> {
    const saltPath = path.join(this.secureDir, this.config.storage.saltFile);
    
    let salt: Buffer;
    if (await fs.pathExists(saltPath)) {
      // 使用现有盐值
      salt = await fs.readFile(saltPath);
    } else {
      // 生成新的盐值
      salt = crypto.randomBytes(32);
      await fs.writeFile(saltPath, salt);
      await fs.chmod(saltPath, 0o600);
    }

    // 从环境变量或用户输入获取密码
    const password = process.env.TASKFLOW_MASTER_PASSWORD || 'default-master-key';
    
    // 使用scrypt派生主密钥
    this.masterKey = crypto.scryptSync(password, salt, this.config.encryption.keySize);
  }

  private encrypt(plaintext: string): EncryptedData {
    if (!this.masterKey) {
      throw new Error('主密钥未初始化');
    }

    const iv = crypto.randomBytes(this.config.encryption.ivSize);
    const cipher = crypto.createCipherGCM(this.config.encryption.algorithm, this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: this.config.encryption.algorithm,
    };
  }

  private decrypt(encryptedData: EncryptedData): string {
    if (!this.masterKey) {
      throw new Error('主密钥未初始化');
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipherGCM(encryptedData.algorithm, this.masterKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private encryptWithKey(plaintext: string, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(this.config.encryption.ivSize);
    const cipher = crypto.createCipherGCM(this.config.encryption.algorithm, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: this.config.encryption.algorithm,
    };
  }

  private decryptWithKey(encryptedData: EncryptedData, key: Buffer): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    const decipher = crypto.createDecipherGCM(encryptedData.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async loadAPIKeys(): Promise<void> {
    const keyPath = path.join(this.secureDir, this.config.storage.keyFile);
    
    if (!await fs.pathExists(keyPath)) {
      return;
    }

    try {
      const encryptedData = await fs.readJson(keyPath);
      const decryptedJson = this.decrypt(encryptedData);
      const keyData = JSON.parse(decryptedJson);

      for (const keyInfo of keyData.keys || []) {
        this.keyStore.set(keyInfo.id, keyInfo);
      }

      console.log(`🔑 加载了 ${this.keyStore.size} 个API密钥`);
    } catch (error) {
      console.error('❌ 加载API密钥失败:', error);
    }
  }

  private async saveAPIKeys(): Promise<void> {
    const keyPath = path.join(this.secureDir, this.config.storage.keyFile);
    
    const keyData = {
      version: '1.0',
      updatedAt: new Date().toISOString(),
      keys: Array.from(this.keyStore.values()),
    };

    const encryptedData = this.encrypt(JSON.stringify(keyData));
    await fs.writeJson(keyPath, encryptedData);
    await fs.chmod(keyPath, 0o600);
  }

  private generateSecureSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('无效的过期时间格式');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit as keyof typeof multipliers];
  }
}
