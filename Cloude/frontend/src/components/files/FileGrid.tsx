'use client';

import React, { useState } from 'react';
import { Grid, Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { Folder as FolderIcon, InsertDriveFile as FileIcon, MoreVert as MoreVertIcon, Image as ImageIcon, PictureAsPdf as PdfIcon, Description as TxtIcon } from '@mui/icons-material';
import { File, Folder } from '@/types/files';
import FilePreview from './FilePreview';

interface FileGridProps {
  files: (File | Folder)[];
  onFolderClick: (folder: Folder) => void;
  onRefresh: () => void;
}

const FileGrid: React.FC<FileGridProps> = ({ files, onFolderClick, onRefresh }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<File | Folder | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: File | Folder) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleFileClick = (file: File) => {
    setSelectedItem(file);
    setPreviewOpen(true);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 48 }} />;
    if (mimeType === 'application/pdf') return <PdfIcon sx={{ fontSize: 48 }} />;
    if (mimeType.startsWith('text/')) return <TxtIcon sx={{ fontSize: 48 }} />;
    return <FileIcon sx={{ fontSize: 48 }} />;
  };

  return (
    <Box sx={{ flexGrow: 1, mt: 4 }}>
      <Grid container spacing={4}>
        {files.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" align="center" color="text.secondary">
              В этой папке пока нет файлов или папок.
            </Typography>
          </Grid>
        ) : (
          files.map((item) => (
            <Grid
              item
              key={item.id}
              xs={12} sm={6} md={4} lg={3}
              onClick={() => {
                if (item.type === 'file') handleFileClick(item as File);
                else onFolderClick(item as Folder);
              }}
              sx={{ cursor: 'pointer' }}
            >
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:hover': { boxShadow: 3 },
                  position: 'relative',
                  minHeight: 180,
                }}
              >
                <IconButton
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={(e) => handleMenuClick(e, item)}
                >
                  <MoreVertIcon />
                </IconButton>

                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.type === 'folder' ? (
                    <FolderIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                  ) : (
                    getFileIcon((item as File).mime_type)
                  )}
                </Box>

                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  {item.name}
                </Typography>

                {item.type === 'file' && (
                  <Typography variant="caption" color="text.secondary">
                    {((item as File).size / 1024).toFixed(2)} KB
                  </Typography>
                )}
              </Box>
            </Grid>
          ))
        )}
      </Grid>

      {/* Меню (можно потом добавить действия Переименовать / Удалить) */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>Переименовать</MenuItem>
        <MenuItem onClick={handleMenuClose}>Удалить</MenuItem>
      </Menu>

      {/* Превью файла */}
      {selectedItem?.type === 'file' && (
        <FilePreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          file={selectedItem as File}
        />
      )}
    </Box>
  );
};

export default FileGrid;
