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




// Типы для файлов и папок, чтобы компонент был автономным
// Types for files and folders to make the component standalone
interface File {
  id: string;
  name: string;
  size: number;
  mime_type: string;
}

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string;
}




// Заглушка для хука useFiles.
// Это позволит компоненту работать без ошибок, даже если у вас нет реальной реализации.
// Placeholder for the useFiles hook.
// This will allow the component to work without errors even if you don't have a real implementation.
const useFiles = (currentFolderId: string | null) => {
  const uploadFile = async (file: globalThis.File, onProgress?: (progress: number) => void) => {
    console.log('Загрузка файла:', file.name);
    // Имитация загрузки с прогрессом
    // Simulate upload with progress
    const totalTime = 1500;
    const interval = 100;
    let loaded = 0;
    const fileSize = file.size;

    return new Promise((resolve) => {
      const timer = setInterval(() => {
        loaded += (fileSize * interval) / totalTime;
        const progress = Math.min((loaded / fileSize) * 100, 100);
        if (onProgress) {
          onProgress(progress);
        }
        if (progress >= 100) {
          clearInterval(timer);
          resolve({ name: file.name, size: file.size, mime_type: file.type });
        }
      }, interval);
    });
  };

  return { uploadFile };
};

// Определяем пропсы для компонента
// Defining props for the component



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
  // Используем заглушку useFiles для доступа к функции загрузки
  // We use the useFiles placeholder to access the upload function
  const { uploadFile } = useFiles(currentFolderId);
  
  // Состояния для управления UI
  // States to manage the UI
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Обработчик выбора файла через input
  // Handler for file selection via input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // Обработчики для перетаскивания (Drag & Drop)
  // Handlers for drag and drop
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

  // Основной обработчик загрузки
  // Main upload handler
  const handleUpload = async () => {
    if (!file) {
      setError('Пожалуйста, выберите файл.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Вызываем функцию загрузки из хука, передавая колбэк для прогресса
      // We call the upload function from the hook, passing a callback for progress
      await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  // Обработчик закрытия диалогового окна
  // Handler for closing the dialog box
  const handleClose = () => {
    setFile(null);
    setError('');
    setIsUploading(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Загрузить файл</DialogTitle>
      <DialogContent>
        {/* Область для перетаскивания файлов */}
        {/* Area for dragging and dropping files */}
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
          <Button variant="contained" component="label" sx={{ mt: 2 }}>
            Выберите файл
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
        </Box>
        {file && (
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
            Выбран файл: {file.name}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {isUploading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="text.secondary" align="center">
              {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>Отмена</Button>
        <Button onClick={handleUpload} disabled={!file || isUploading} variant="contained">
          Загрузить
        </Button>
      </DialogActions>
    </Dialog>
    
  );
};

export default FileUpload;
