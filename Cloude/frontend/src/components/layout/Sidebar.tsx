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
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Cloud as CloudIcon,
  FolderShared as FolderSharedIcon,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Компонент Sidebar, отображающий выдвижную боковую панель навигации.
 * Использует компоненты Drawer, List и ListItem от Material-UI.
 *
 * @param {SidebarProps} props - Свойства компонента.
 * @param {boolean} props.open - Состояние, определяющее, открыта ли боковая панель.
 * @param {() => void} props.onClose - Функция, вызываемая при закрытии боковой панели.
 */
const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <Drawer
      // Temporary Drawer появляется сверху поверх основного контента.
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Для лучшей производительности на мобильных
      }}
      sx={{
        // Задаем ширину боковой панели через CSS
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
      }}
    >
      {/* Spacer, чтобы контент начинался под AppBar */}
      <Toolbar />
      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <CloudIcon />
            </ListItemIcon>
            <ListItemText primary="Мои файлы" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <FolderSharedIcon />
            </ListItemIcon>
            <ListItemText primary="Общие" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Настройки" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
