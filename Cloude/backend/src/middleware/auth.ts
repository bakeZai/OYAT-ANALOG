// backend/src/middleware/auth.ts
// Промежуточное ПО для аутентификации пользователя на бэкенде.
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Расширение типа Request для добавления объекта пользователя
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // ИСПОЛЬЗУЕМ supabaseAdmin для проверки токена на сервере.
    // Это более надежный способ.
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Сохраняем данные пользователя в объекте запроса
    req.user = {
      id: data.user.id,
      email: data.user.email!,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
