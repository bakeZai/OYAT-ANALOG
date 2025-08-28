

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
import { useFiles } from '@/hooks/useFiles';



    
export interface FolderManagerProps {
  onCreateFolder: (folderName: string) => Promise<void>;
  open: boolean;
  onClose: () => void;
  onFolderCreated: () => void;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  open,
  onClose,
  onFolderCreated,
}) => {
  const { createFolder } = useFiles();
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError('Имя папки не может быть пустым.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createFolder(folderName);
      onFolderCreated();
      setFolderName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError(null);
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
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
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
