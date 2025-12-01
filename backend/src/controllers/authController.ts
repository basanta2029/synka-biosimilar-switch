import { Response } from 'express';
import { AuthRequest } from '../types';
import { authService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   * Register a new user
   */
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, name, role } = req.body;

    const result = await authService.register({
      email,
      password,
      name,
      role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      ...result,
    });
  });

  /**
   * POST /api/v1/auth/login
   * Login user
   */
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      message: 'Login successful',
      ...result,
    });
  });

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await authService.getUserById(req.user.id);

    res.json({ user });
  });
}

export const authController = new AuthController();
