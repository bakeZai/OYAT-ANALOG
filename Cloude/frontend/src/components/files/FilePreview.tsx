// frontend/src/components/files/FilePreview/FilePreview.tsx

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Close as CloseIcon,  InsertDriveFile as FileIcon, Description as TxtIcon, Image as ImageIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { File } from '@/types/files';

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
  file: File | null;
}

const FilePreview: React.FC<FilePreviewProps> = ({ open, onClose, file }) => {
  if (!file) return null;

  const renderContent = () => {
    const mimeType = file.mime_type;
    if (mimeType.startsWith('image/')) {
      // Здесь вам нужно будет получить URL для предпросмотра изображения
      // Для простоты, пока просто используем заглушку
      return <img src="#" alt={file.name} style={{ maxWidth: '100%', maxHeight: '80vh' }} />;
    }
    if (mimeType === 'application/pdf') {
      // PDF-файл - можно отобразить ссылку для скачивания
      return (
        <Box sx={{ textAlign: 'center' }}>
          <PdfIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          <Typography variant="h6">Предпросмотр PDF-файла недоступен.</Typography>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <Button variant="contained" sx={{ mt: 2 }}>
              Скачать
            </Button>
          </a>
        </Box>
      );
    }
    if (mimeType.startsWith('text/')) {
      // Для текстовых файлов можно реализовать загрузку содержимого
      return (
        <Box sx={{ p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
          <Typography variant="body1">
            Предпросмотр текстового файла (нужно реализовать загрузку содержимого).
          </Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ textAlign: 'center' }}>
        <FileIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
        <Typography variant="h6">Предпросмотр недоступен.</Typography>
        <Typography variant="body2">
          Этот тип файла не может быть предварительно просмотрен.
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {file.name}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FilePreview;
