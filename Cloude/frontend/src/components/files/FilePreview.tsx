// frontend/src/components/files/FilePreview.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Description as TxtIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  VideoFile as VideoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { File } from '@/types/files';
import { supabase } from '@/lib/supabase';

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
  loading?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ open, onClose, file, loading = false }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState<boolean>(true);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  
  // Состояния для зума и панорамирования изображения
  const [imageScale, setImageScale] = useState(1);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Состояние для уведомления Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ✅ Новое состояние для полноэкранного режима
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Получаем временный URL для приватного файла
  useEffect(() => {
    if (!file || !file.storage_path) {
      setFileUrl(null);
      setIsUrlLoading(false);
      return;
    }

    setIsUrlLoading(true);
    supabase
      .storage
      .from('files') // Имя вашего бакета
      .createSignedUrl(file.storage_path, 60) // Ссылка действительна 60 секунд
      .then(({ data, error }) => {
        if (error || !data?.signedUrl) {
          console.error('Ошибка при получении signed URL:', error);
          setFileUrl(null);
        } else {
          setFileUrl(data.signedUrl);
        }
        setIsUrlLoading(false);
      });
  }, [file]);

  // Загрузка текста (для text/*)
  useEffect(() => {
    if (file && file.mime_type.startsWith('text/') && fileUrl) {
      setTextContent(null);
      setTextError(null);
      fetch(fileUrl)
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить текстовый файл');
          return res.text();
        })
        .then(text => setTextContent(text))
        .catch(err => setTextError(err.message));
    }
  }, [file, fileUrl]);

  // Функции для управления зумом
  const handleZoom = (factor: number) => {
    setImageScale(prevScale => Math.max(1, prevScale * factor));
  };

  const handleResetZoom = () => {
    setImageScale(1);
    setImageTransform({ x: 0, y: 0 });
  };

  // Функции для панорамирования (перетаскивания)
  const handlePanStart = (e: React.MouseEvent) => {
    if (imageScale > 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setImageTransform({
        x: imageTransform.x + dx,
        y: imageTransform.y + dy,
      });
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  // Копирование URL в буфер обмена
  const handleCopyLink = () => {
    if (!fileUrl) {
      setSnackbarMessage('Ссылка недоступна.');
      setSnackbarOpen(true);
      return;
    }
    
    // Используем navigator.clipboard API, с запасным вариантом для старых браузеров
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fileUrl)
        .then(() => {
          setSnackbarMessage('Ссылка скопирована!');
          setSnackbarOpen(true);
        })
        .catch(() => {
          setSnackbarMessage('Ошибка копирования.');
          setSnackbarOpen(true);
        });
    } else {
      // Запасной вариант
      const textarea = document.createElement('textarea');
      textarea.value = fileUrl;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setSnackbarMessage('Ссылка скопирована!');
        setSnackbarOpen(true);
      } catch (err) {
        setSnackbarMessage('Ошибка копирования.');
        setSnackbarOpen(true);
      }
      document.body.removeChild(textarea);
    }
  };

  if (!file) return null;

  const renderContent = () => {
    if (loading || isUrlLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!fileUrl) {
      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6">Не удалось получить URL для файла.</Typography>
          <Typography variant="body2" color="error">
            Проверьте storage_path и бакет.
          </Typography>
        </Box>
      );
    }

    const mimeType = file.mime_type;

    // ✅ Единый центрированный контейнер для всего контента
    const contentContainerStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      maxHeight: '80vh',
      overflow: 'hidden', // Скрываем скролл, если контент увеличен
    };

    // Изображения
    if (mimeType.startsWith('image/')) {
      const imageStyle = {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain' as 'contain', // Исправлено для TypeScript
        cursor: imageScale > 1 ? 'grab' : 'auto',
        transform: `scale(${imageScale}) translate(${imageTransform.x}px, ${imageTransform.y}px)`,
        transition: 'transform 0.1s ease',
      };
      
      return (
        <Box sx={contentContainerStyle}>
          <img
            src={fileUrl}
            alt={file.name}
            style={imageStyle}
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd} // Останавливаем панорамирование при уходе мыши
          />
        </Box>
      );
    }

    // Видео
    if (mimeType.startsWith('video/')) {
      return (
        <Box sx={{...contentContainerStyle, overflow: 'visible' }}>
          <video controls style={{ maxWidth: '100%', maxHeight: '80vh' }}>
            <source src={fileUrl} type={mimeType} />
            Ваш браузер не поддерживает видео.
          </video>
        </Box>
      );
    }

    // PDF
    if (mimeType === 'application/pdf') {
      return (
        <Box sx={{...contentContainerStyle, overflow: 'visible', p: 0 }}>
          <iframe
            src={fileUrl}
            title={file.name}
            style={{ width: '100%', height: '80vh', border: 'none' }}
          />
        </Box>
      );
    }

    // Текстовые файлы
    if (mimeType.startsWith('text/')) {
      if (textError) {
        return (
          <Box sx={{ textAlign: 'center' }}>
            <TxtIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
            <Typography variant="h6">Ошибка загрузки текстового файла</Typography>
            <Typography variant="body2" color="error">{textError}</Typography>
          </Box>
        );
      }
      if (textContent === null) {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        );
      }
      return (
        <Box sx={{ p: 2, backgroundColor: '#f0f0f0', borderRadius: 1, maxHeight: '80vh', overflow: 'auto' }}>
          <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
            {textContent}
          </Typography>
        </Box>
      );
    }

    // Остальные файлы
    return (
      <Box sx={{ textAlign: 'center' }}>
        <FileIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
        <Typography variant="h6">Предпросмотр недоступен</Typography>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="contained" sx={{ mt: 2 }}>Скачать</Button>
        </a>
      </Box>
    );
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        // ✅ Увеличенный размер
        maxWidth={isFullScreen ? false : "xl"}
        // ✅ Включаем полноэкранный режим
        fullScreen={isFullScreen}
      >
        <DialogTitle>
          {file.name}
          <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
            {/* Кнопки зума для изображений */}
            {file?.mime_type.startsWith('image/') && (
              <>
                <IconButton onClick={() => handleZoom(1.2)} aria-label="zoom in">
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={() => handleZoom(0.8)} aria-label="zoom out">
                  <ZoomOutIcon />
                </IconButton>
                <IconButton onClick={handleResetZoom} aria-label="reset zoom">
                  <FullscreenExitIcon />
                </IconButton>
              </>
            )}
            {/* ✅ Новая кнопка для полноэкранного режима */}
            <IconButton onClick={() => setIsFullScreen(!isFullScreen)} aria-label="toggle full screen">
              {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            {/* Кнопка "Копировать ссылку" */}
            <IconButton onClick={handleCopyLink} aria-label="copy link">
              <ContentCopyIcon />
            </IconButton>
            <IconButton aria-label="close" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderContent()}
        </DialogContent>
      </Dialog>
      {/* Уведомление о копировании */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default FilePreview;
