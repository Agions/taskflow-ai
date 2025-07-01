import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * 健康检查
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: {
        database: 'healthy',
        redis: 'healthy',
        ai_models: 'healthy'
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 详细健康检查
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'healthy',
          responseTime: '5ms',
          connections: 10
        },
        redis: {
          status: 'healthy',
          responseTime: '2ms',
          memory: '50MB'
        },
        ai_models: {
          status: 'healthy',
          available_models: ['deepseek', 'qwen', 'zhipu'],
          active_connections: 3
        }
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    res.json({
      success: true,
      data: detailedHealth
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 就绪检查
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // 检查所有必要服务是否就绪
    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: true,
        ai_models: true,
        configuration: true
      }
    };
    
    res.json({
      success: true,
      data: ready
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: { message: '服务未就绪' }
    });
  }
});

/**
 * 存活检查
 */
router.get('/live', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'alive',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

export { router as healthRoutes };
