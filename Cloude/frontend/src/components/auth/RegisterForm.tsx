'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Link,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth.tsx';
import React from 'react';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signUpError } = await signUp(email, password, fullName);
    
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
          <Alert severity="success">
            Регистрация успешна! Теперь вы можете войти в свой аккаунт.
          </Alert>
          <Box textAlign="center" mt={2}>
            <Link href="/login" variant="body2">
              Перейти на страницу входа
            </Link>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Регистрация
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Полное имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            helperText="Минимум 6 символов"
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>

          <Box textAlign="center">
            <Link href="/login" variant="body2">
              Уже есть аккаунт? Войти
            </Link>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
