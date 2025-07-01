import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * API文档首页
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const docs = {
      title: 'TaskFlow AI API Documentation',
      version: '1.0.0',
      description: 'TaskFlow AI - 智能PRD文档解析与任务管理助手 API文档',
      baseUrl: '/api',
      endpoints: {
        auth: '/auth',
        users: '/users',
        projects: '/projects',
        tasks: '/tasks',
        ai: '/ai',
        health: '/health'
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization',
        format: 'Bearer <token>'
      }
    };
    
    res.json({
      success: true,
      data: docs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * OpenAPI规范
 */
router.get('/openapi', async (req: Request, res: Response) => {
  try {
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: 'TaskFlow AI API',
        version: '1.0.0',
        description: 'TaskFlow AI - 智能PRD文档解析与任务管理助手'
      },
      servers: [
        {
          url: '/api',
          description: 'API服务器'
        }
      ],
      paths: {
        '/auth/login': {
          post: {
            summary: '用户登录',
            tags: ['Authentication'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      email: { type: 'string' },
                      password: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        '/projects': {
          get: {
            summary: '获取项目列表',
            tags: ['Projects']
          },
          post: {
            summary: '创建项目',
            tags: ['Projects']
          }
        },
        '/ai/parse': {
          post: {
            summary: '解析PRD文档',
            tags: ['AI']
          }
        }
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
    
    res.json(openapi);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * API使用示例
 */
router.get('/examples', async (req: Request, res: Response) => {
  try {
    const examples = {
      authentication: {
        login: {
          method: 'POST',
          url: '/api/auth/login',
          body: {
            email: 'user@example.com',
            password: 'password123'
          }
        }
      },
      projects: {
        create: {
          method: 'POST',
          url: '/api/projects',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          body: {
            name: '新项目',
            description: '项目描述'
          }
        }
      },
      ai: {
        parsePRD: {
          method: 'POST',
          url: '/api/ai/parse',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          body: {
            content: 'PRD文档内容',
            fileType: 'markdown'
          }
        }
      }
    };
    
    res.json({
      success: true,
      data: examples
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

export { router as docsRoutes };
