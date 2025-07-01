import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * 获取用户列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // 模拟用户列表
    const users = [
      {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: users.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 获取用户详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 模拟用户详情
    const user = {
      id,
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 创建用户
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email, name, role = 'user' } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: { message: '邮箱和姓名不能为空' }
      });
    }

    const user = {
      id: Date.now().toString(),
      email,
      name,
      role,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
}));

/**
 * 更新用户
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 删除用户
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: `用户 ${id} 已删除`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

export { router as userRoutes };
