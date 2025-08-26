'use client';
import { useEffect, useState } from 'react';
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
import { useFiles } from '@/hooks/useFiles';

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user } = useAuth();
  const { files } = useFiles(null);
  const [displayName, setDisplayName] = useState<string>('Гость');
  const [photoURL, setPhotoURL] = useState<string>('');
  const totalStorage = 1 * 1024 * 1024 * 1024; // 1 GB

  useEffect(() => {
    if (user) {
      // Показываем имя из профиля, если оно есть, иначе email
      setDisplayName(user.email || 'Гость');
    }
  }, [user]);

  // Считаем общий размер всех файлов
  const storageUsed = files.reduce((sum, f: any) => sum + (f.size || 0), 0);
  const storagePercentage = Math.min((storageUsed / totalStorage) * 100, 100);

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Кнопка открытия Sidebar */}
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

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Использовано: {(storageUsed / 1024 / 1024).toFixed(2)} MB из 1 GB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={storagePercentage}
                sx={{
                  width: 150,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' },
                }}
              />
            </Box>
            <Avatar src={photoURL} alt={displayName} />
            <Typography variant="body1">{displayName}</Typography>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
