import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * 用户登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // 模拟登录逻辑
    if (email && password) {
      const token = 'mock_jwt_token';
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: '1',
            email,
            name: 'Test User',
            role: 'admin'
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: '邮箱和密码不能为空' }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 用户注册
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // 模拟注册逻辑
    if (email && password && name) {
      const user = {
        id: Date.now().toString(),
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: user
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: '邮箱、密码和姓名不能为空' }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 刷新令牌
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const newToken = 'new_mock_jwt_token';
      res.json({
        success: true,
        data: { token: newToken }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: '刷新令牌不能为空' }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

/**
 * 用户登出
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: (error as Error).message }
    });
  }
});

export { router as authRoutes };
