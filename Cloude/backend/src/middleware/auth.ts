// backend/src/middleware/auth.ts - С УЛУЧШЕННЫМ ЛОГИРОВАНИЕМ

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
  console.log('🔐 Authentication middleware started');
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return res.status(401).json({ error: 'No authorization header provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    if (!token || token.length < 10) {
      console.log('❌ Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('🔍 Verifying token with Supabase...');
    
    // ИСПОЛЬЗУЕМ supabaseAdmin для проверки токена на сервере.
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.log('❌ Supabase auth error:', error.message);
      return res.status(401).json({ 
        error: 'Token verification failed',
        details: error.message 
      });
    }

    if (!data || !data.user) {
      console.log('❌ No user data returned from Supabase');
      return res.status(401).json({ error: 'Invalid token - no user data' });
    }

    console.log('✅ User authenticated:', {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role
    });

    // Сохраняем данные пользователя в объекте запроса
    req.user = {
      id: data.user.id,
      email: data.user.email!,
    };

    next();
  } catch (error) {
    console.error('💥 Authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};