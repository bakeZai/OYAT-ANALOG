// frontend/src/components/files/FolderManager/FolderManager.tsx

'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
} from '@mui/material';

// ✅ Удаляем импорт useFiles
// import { useFiles } from '@/hooks/useFiles';

export interface FolderManagerProps {
  // ✅ Упрощаем пропсы. Теперь компонент просто принимает onFolderCreated, который и будет выполнять всю логику
  open: boolean;
  onClose: () => void;
  onFolderCreated: (folderName: string) => Promise<void>;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  open,
  onClose,
  onFolderCreated,
}) => {
  // ✅ Убираем состояние loading и error, так как они будут управляться в родительском компоненте
  // const { createFolder } = useFiles();
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      // ✅ Теперь мы просто выводим ошибку в консоль, так как
      // управление ошибками будет в родительском компоненте
      console.error('Имя папки не может быть пустым.');
      return;
    }

    setLoading(true);
    try {
      await onFolderCreated(folderName); // ✅ Вызываем пропс с именем папки
      setFolderName('');
      onClose();
    } catch (err: any) {
      // ✅ Ошибка будет обрабатываться в родительском компоненте
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Создать новую папку</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="folderName"
          label="Имя папки"
          type="text"
          fullWidth
          variant="standard"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          sx={{ mt: 2 }}
        />
        {/* ✅ Убираем отображение ошибок */}
        {/* {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>} */}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Отмена
        </Button>
        <Button onClick={handleCreateFolder} disabled={loading || !folderName.trim()}>
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderManager;
