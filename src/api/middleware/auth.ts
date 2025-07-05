/**
 * 认证中间件
 * 处理JWT token验证、用户权限检查等认证相关功能
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ConfigManager } from '../../infra/config';

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

/**
 * 用户信息接口
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

/**
 * 扩展Request接口以包含用户信息
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * JWT认证中间件
 * @param configManager 配置管理器
 */
export function authMiddleware(configManager: ConfigManager) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 跳过认证的路径
    const skipAuthPaths = [
      '/health',
      '/docs',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/forgot-password',
      '/api/auth/reset-password'
    ];

    if (skipAuthPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // 获取token
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    try {
      // 验证token
      const jwtSecret = configManager.get('security.jwt.secret', 'default-secret-key') as string;
      const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & AuthUser;

      // 检查token是否过期
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        res.status(401).json({
          success: false,
          message: '访问令牌已过期',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      // 将用户信息添加到请求对象
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: '访问令牌无效',
          code: 'TOKEN_INVALID'
        });
        return;
      }

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: '访问令牌已过期',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: '认证服务异常',
        code: 'AUTH_ERROR'
      });
      return;
    }
  };
}

/**
 * 权限检查中间件
 * @param allowedRoles 允许的角色列表
 */
export function authorize(allowedRoles: UserRole[] | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    // 检查用户角色
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          userRole: req.user.role,
          requiredRoles: allowedRoles
        }
      });
      return;
    }

    next();
  };
}

/**
 * 权限检查中间件（基于具体权限）
 * @param requiredPermissions 需要的权限列表
 */
export function requirePermissions(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    // 管理员拥有所有权限
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // 检查用户是否拥有所需权限
    const hasAllPermissions = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(permission =>
        !req.user!.permissions.includes(permission)
      );

      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: {
          missingPermissions,
          userPermissions: req.user.permissions
        }
      });
    }

    next();
  };
}

/**
 * 资源所有者检查中间件
 * @param resourceIdParam 资源ID参数名
 * @param resourceType 资源类型
 */
export function requireOwnership(resourceIdParam: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
    }

    // 管理员可以访问所有资源
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: '资源ID缺失',
        code: 'RESOURCE_ID_MISSING'
      });
    }

    try {
      // 这里应该调用相应的服务来检查资源所有权
      // 为了示例，我们假设有一个通用的权限检查服务
      const hasAccess = await checkResourceAccess(req.user.id, resourceId, resourceType);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: '无权访问此资源',
          code: 'RESOURCE_ACCESS_DENIED',
          details: {
            resourceId,
            resourceType,
            userId: req.user.id
          }
        });
      }

      next();
    } catch {
      return res.status(500).json({
        success: false,
        message: '权限检查失败',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * API密钥认证中间件
 * @param configManager 配置管理器
 */
export function apiKeyAuth(configManager: ConfigManager) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API密钥缺失',
        code: 'API_KEY_MISSING'
      });
    }

    // 验证API密钥
    const validApiKeys = configManager.get('security.apiKeys', []) as string[];

    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        message: 'API密钥无效',
        code: 'API_KEY_INVALID'
      });
    }

    // 为API密钥创建虚拟用户
    req.user = {
      id: 'api-key-user',
      email: 'api@taskflow.ai',
      name: 'API Key User',
      role: UserRole.DEVELOPER,
      permissions: ['api:read', 'api:write']
    };

    next();
  };
}

/**
 * 可选认证中间件（允许匿名访问）
 */
export function optionalAuth(configManager: ConfigManager) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
      return next(); // 没有token，继续执行（匿名访问）
    }

    try {
      const jwtSecret = configManager.get('security.jwt.secret', 'default-secret-key') as string;
      const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & AuthUser;
      req.user = decoded;
    } catch {
      // token无效，但不阻止访问
    }

    next();
  };
}

/**
 * 从请求中提取token
 * @param req 请求对象
 */
function extractToken(req: Request): string | null {
  // 从Authorization header提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从查询参数提取
  const tokenFromQuery = req.query.token as string;
  if (tokenFromQuery) {
    return tokenFromQuery;
  }

  // 从cookie提取
  const tokenFromCookie = req.cookies?.token;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  return null;
}

/**
 * 检查资源访问权限
 * @param userId 用户ID
 * @param resourceId 资源ID
 * @param resourceType 资源类型
 */
async function checkResourceAccess(
  userId: string,
  resourceId: string,
  resourceType: string
): Promise<boolean> {
  // 这里应该实现具体的权限检查逻辑
  // 例如：查询数据库检查用户是否是资源的所有者或有权限访问

  // 示例实现（实际应该根据业务逻辑实现）
  try {
    switch (resourceType) {
      case 'project':
        // 检查用户是否是项目成员
        return await checkProjectMembership(userId, resourceId);

      case 'task':
        // 检查用户是否是任务负责人或项目成员
        return await checkTaskAccess(userId, resourceId);

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * 检查项目成员身份
 * @param userId 用户ID
 * @param projectId 项目ID
 */
async function checkProjectMembership(_userId: string, _projectId: string): Promise<boolean> {
  // 实际实现应该查询数据库
  // 这里返回true作为示例
  return true;
}

/**
 * 检查任务访问权限
 * @param userId 用户ID
 * @param taskId 任务ID
 */
async function checkTaskAccess(_userId: string, _taskId: string): Promise<boolean> {
  // 实际实现应该查询数据库
  // 这里返回true作为示例
  return true;
}

/**
 * 生成JWT token
 * @param user 用户信息
 * @param configManager 配置管理器
 */
export function generateToken(user: Omit<AuthUser, 'iat' | 'exp'>, configManager: ConfigManager): string {
  const jwtSecret = configManager.get('security.jwt.secret', 'default-secret-key') as string;
  const expiresIn = configManager.get('security.jwt.expiresIn', '24h') as string;

  return jwt.sign(user as string | object | Buffer, jwtSecret, { expiresIn } as jwt.SignOptions);
}

/**
 * 验证token
 * @param token JWT token
 * @param configManager 配置管理器
 */
export function verifyToken(token: string, configManager: ConfigManager): AuthUser {
  const jwtSecret = configManager.get('security.jwt.secret', 'default-secret-key') as string;
  return jwt.verify(token, jwtSecret) as jwt.JwtPayload & AuthUser;
}

/**
 * 刷新token
 * @param token 旧token
 * @param configManager 配置管理器
 */
export function refreshToken(token: string, configManager: ConfigManager): string {
  try {
    const decoded = verifyToken(token, configManager);

    // 移除时间戳字段
    const { iat: _iat, exp: _exp, ...userInfo } = decoded;

    // 生成新token
    return generateToken(userInfo, configManager);
  } catch {
    throw new Error('Token刷新失败');
  }
}
