// frontend/src/components/layout/Header.tsx - БЕЗ ДУБЛИРОВАНИЯ ЗАПРОСОВ

'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import Link from "next/link";


interface HeaderProps {
  onOpenSidebar: () => void;
  // ✅ Принимаем статистику от родительского компонента
  storageStats?: {
    used: number;
    total: number;
  };
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar, storageStats }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>('Гость');

  useEffect(() => {
    if (user?.email) {
      setDisplayName(user.email);
    }
  }, [user?.email]); // ✅ Зависимость только от email

  // ✅ Мемоизируем вычисления storage
  const storageInfo = useMemo(() => {
    if (!storageStats) {
      return null;
    }

    const totalGB = storageStats.total / (1024 * 1024 * 1024);
    const usedMB = storageStats.used / (1024 * 1024);
    const percentage = Math.min((storageStats.used / storageStats.total) * 100, 100);

    return {
      totalGB: totalGB.toFixed(0),
      usedMB: usedMB.toFixed(2),
      percentage
    };
  }, [storageStats]);

  // ✅ Не показываем storage info, пока она не загружена
  if (!user) {
    return (
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onOpenSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Облачное хранилище</Typography>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onOpenSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6">Облачное хранилище</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {storageInfo && (
            <Box>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Использовано: {storageInfo.usedMB} MB из {storageInfo.totalGB} GB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={storageInfo.percentage}
                sx={{
                  width: 150,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' },
                }}
              />
            </Box>
          )}
          <Avatar alt={displayName} />
          <Typography variant="body1">
            <Link href="/profile" style={{ color: "white", textDecoration: "none" }}> 
            {displayName}
            </Link>
            </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;