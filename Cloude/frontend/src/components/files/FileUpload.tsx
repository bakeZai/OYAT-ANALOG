'use client';

import React, { useState, DragEvent } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  LinearProgress,
  Box,
  Alert,
} from '@mui/material';
import { useFiles } from '@/hooks/useFiles'; // ✅ Импортируем настоящий хук

export interface FileUploadProps {
  open: boolean;               // Нужно для управления открытием диалога
  onClose: () => void;         // Что делать при закрытии
  onUploadSuccess: () => void; // Что делать после успешной загрузки файла
  currentFolderId: string | null; // Идентификатор текущей папки
}

const FileUpload: React.FC<FileUploadProps> = ({
  open,
  onClose,
  onUploadSuccess,
  currentFolderId,
}) => {
  // ✅ Используем настоящий useFiles хук
  const { uploadFile } = useFiles(currentFolderId);
  
  // Состояния для управления UI
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Обработчик выбора файла через input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // Обработчики для перетаскивания (Drag & Drop)
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  // ✅ Исправленный обработчик загрузки
  const handleUpload = async () => {
    if (!file) {
      setError('Пожалуйста, выберите файл.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // ✅ Используем настоящий uploadFile из хука
      // Поскольку настоящий хук не поддерживает колбэк прогресса,
      // показываем неопределенный прогресс
      setUploadProgress(50); // Показываем промежуточный прогресс
      
      await uploadFile(file);
      
      setUploadProgress(100);
      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  // Обработчик закрытия диалогового окна
  const handleClose = () => {
    setFile(null);
    setError('');
    setIsUploading(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={!isUploading ? handleClose : undefined}>
      <DialogTitle>Загрузить файл</DialogTitle>
      <DialogContent>
        {/* Область для перетаскивания файлов */}
        <Box
          sx={{
            p: 4,
            border: '2px dashed #ccc',
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Typography variant="body1" color="text.secondary">
            Перетащите файл сюда или
          </Typography>
          <Button variant="contained" component="label" sx={{ mt: 2 }} disabled={isUploading}>
            Выберите файл
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </Box>
        
        {file && (
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
            Выбран файл: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </Typography>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {isUploading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Загрузка файла...
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Отмена
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading} 
          variant="contained"
        >
          {isUploading ? 'Загружаем...' : 'Загрузить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUpload;