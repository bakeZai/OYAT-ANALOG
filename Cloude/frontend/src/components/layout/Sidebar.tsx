// frontend/src/components/layout/Sidebar.tsx
'use client';

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Button,
  Box,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Cloud as CloudIcon,
  FolderShared as FolderSharedIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Компонент Sidebar, отображающий выдвижную боковую панель навигации.
 * Добавлены ссылки на Профиль и кнопка Выйти.
 *
 * @param {SidebarProps} props - Свойства компонента.
 * @param {boolean} props.open - Состояние, определяющее, открыта ли боковая панель.
 * @param {() => void} props.onClose - Функция, вызываемая при закрытии боковой панели.
 */
const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login'); // Перенаправляем на страницу входа после выхода
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Для лучшей производительности на мобильных
      }}
      sx={{
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
      }}
    >
      <Box sx={{ overflow: 'auto', p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Spacer, чтобы контент начинался под AppBar */}
        <Toolbar />
        
        {/* Ссылки навигации */}
        <List sx={{ flexGrow: 1 }}>
          {/* Ссылка на Профиль */}
          <Link href="/profile" passHref style={{ textDecoration: 'none' }}>
            <ListItem disablePadding>
              <ListItemButton onClick={onClose}>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary="Профиль" />
              </ListItemButton>
            </ListItem>
          </Link>
          {/* Ссылка на "Мои файлы" */}
          <Link href="/files" passHref style={{ textDecoration: 'none' }}>
            <ListItem disablePadding>
              <ListItemButton onClick={onClose}>
                <ListItemIcon>
                  <CloudIcon />
                </ListItemIcon>
                <ListItemText primary="Мои файлы" />
              </ListItemButton>
            </ListItem>
          </Link>
          {/* Ссылка на "Общие" */}
          <Link href="/shared" passHref style={{ textDecoration: 'none' }}>
            <ListItem disablePadding>
              <ListItemButton onClick={onClose}>
                <ListItemIcon>
                  <FolderSharedIcon />
                </ListItemIcon>
                <ListItemText primary="Общие" />
              </ListItemButton>
            </ListItem>
          </Link>
          {/* Ссылка на "Настройки" */}
          <Link href="/settings" passHref style={{ textDecoration: 'none' }}>
            <ListItem disablePadding>
              <ListItemButton onClick={onClose}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Настройки" />
              </ListItemButton>
            </ListItem>
          </Link>
        </List>

        {/* Кнопка выхода внизу */}
        <Divider sx={{ mt: 'auto', mb: 2 }} />
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
        >
          Выйти
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
