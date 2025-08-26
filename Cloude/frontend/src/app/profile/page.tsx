'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import { PersonOutline as PersonIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';

/**
 * Страница профиля пользователя, отображающая информацию об авторизованном пользователе.
 * Этот компонент использует ваш хук `useAuth` для получения данных о пользователе.
 */
const ProfilePage = () => {
  // Получаем состояние аутентификации пользователя из вашего собственного хука useAuth.
  const { user, loading } = useAuth();

  // Пока данные загружаются, отображаем индикатор загрузки.
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Если пользователь не авторизован, отображаем предупреждение.
  if (!user) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="warning">
          <Typography variant="h6">
            Пожалуйста, войдите в систему, чтобы просмотреть свой профиль.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Если пользователь авторизован, отображаем его профиль.
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
        backgroundColor: 'background.default',
      }}
    >
      <Paper elevation={4} sx={{ width: '100%', maxWidth: 500, p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          {/* Аватар пользователя, если есть */}
          <Avatar
            src={user.user_metadata?.avatar_url || ''}
            sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}
          >
            {/* Заглушка, если нет аватара */}
            {!user.user_metadata?.avatar_url && <PersonIcon sx={{ fontSize: 50 }} />}
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            Профиль
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Информация о вашем аккаунте
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card variant="outlined" sx={{ bgcolor: 'grey.100' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Полное имя
              </Typography>
              <Typography variant="body1">
                {user.user_metadata?.full_name || 'Не указано'}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ bgcolor: 'grey.100' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Email
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {user.email || 'Не указано'}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ bgcolor: 'grey.100' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                ID пользователя
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                {user.id}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ bgcolor: 'grey.100' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Дата создания
              </Typography>
              <Typography variant="body1">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Не указано'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
