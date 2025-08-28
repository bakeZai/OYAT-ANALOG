  // frontend/src/components/files/FileGrid/FileGrid.tsx

  'use client';

  import React, { useState, MouseEvent } from 'react';
  import {
    Grid,
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
  } from '@mui/material';
  import {
    Folder as FolderIcon,
    InsertDriveFile as FileIcon,
    MoreVert as MoreVertIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    Description as TxtIcon,
  } from '@mui/icons-material';
  import { File, Folder } from '@/types/files';
  import { useFiles } from '@/hooks/useFiles';

  export interface FileGridProps {
    files: (File | Folder)[];
    onFolderClick: (folder: Folder) => void;
    onRefresh: () => void;
    onFileClick?: (file: File) => void;
    onFileDelete?: (id: string) => Promise<void>;
    onFileRename?: (id: string, name: string) => Promise<void>;
    // ✅ Добавляем пропс для URL-адресов превью, чтобы компонент был "глупым"
    }



  const FileGrid: React.FC<FileGridProps> = ({ files, onFolderClick, onRefresh, onFileClick }) => {
    const { deleteFile, renameFile } = useFiles();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedItem, setSelectedItem] = useState<File | Folder | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Функция для определения иконки файла по MIME-типу
    const getFileIcon = (mimeType: string) => {
      if (mimeType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 48 }} />;
      if (mimeType === 'application/pdf') return <PdfIcon sx={{ fontSize: 48 }} />;
      if (mimeType.startsWith('text/')) return <TxtIcon sx={{ fontSize: 48 }} />;
      return <FileIcon sx={{ fontSize: 48 }} />;
    };

    const handleMenuClick = (event: MouseEvent<HTMLElement>, item: File | Folder) => {
      setAnchorEl(event.currentTarget);
      setSelectedItem(item);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
      setSelectedItem(null);
    };

    const handleRenameClick = () => {
      if (selectedItem) {
        setNewName(selectedItem.name);
        setRenameDialogOpen(true);
      }
      handleMenuClose();
    };

    const handleRename = async () => {
      if (selectedItem && newName.trim() !== '') {
        try {
          await renameFile(selectedItem.id, newName);
          onRefresh();
          setRenameDialogOpen(false);
        } catch (err) {
          console.error('Ошибка переименования:', err);
        }
      }
    };

    const handleDeleteClick = () => {
      setDeleteDialogOpen(true);
      handleMenuClose();
    };

    const handleDelete = async () => {
      if (selectedItem) {
        try {
          await deleteFile(selectedItem.id);
          onRefresh();
          setDeleteDialogOpen(false);
        } catch (err) {
          console.error('Ошибка удаления:', err);
        }
      }
    };

    // ✅ Добавленная функция для проверки типа
    const isFile = (item: File | Folder): item is File => 'mime_type' in item;

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
                xs={12}
                sm={6}
                md={4}
                lg={3}
                onClick={() => {
                  if (isFile(item)) {
                    // Если это файл, вызываем onFileClick, если он предоставлен
                    onFileClick?.(item);
                  } else {
                    // Если это папка, вызываем onFolderClick
                    onFolderClick(item as Folder);
                  }
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
                    '&:hover': {
                      boxShadow: 3,
                    },
                    position: 'relative',
                    minHeight: 180,
                  }}
                >
                  <IconButton
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(e, item);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* ✅ Обновленная логика отображения иконки/превью */}
                    {'parent_folder_id' in item ? (
  <FolderIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
) : (
  isFile(item) && item.mime_type.startsWith('image/') ? (
    item.url ? (
      <img
        src={item.url}
        alt={item.name}
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
      />
    ) : (
      <CircularProgress size={24} />
    )
  ) : (
    <>{isFile(item) && getFileIcon(item.mime_type)}</>
  )
)}

                  </Box>
                  <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                    {item.name}
                  </Typography>
                  {'size' in item && (
                    <Typography variant="caption" color="text.secondary">
                      {(item.size / 1024).toFixed(2)} KB
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))
          )}
        </Grid>
        
        {/* Меню для действий */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleRenameClick}>Переименовать</MenuItem>
          <MenuItem onClick={handleDeleteClick}>Удалить</MenuItem>
        </Menu>

        {/* Диалог переименования */}
        <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
          <DialogTitle>Переименовать</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Новое имя"
              type="text"
              fullWidth
              variant="standard"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleRename}>Переименовать</Button>
          </DialogActions>
        </Dialog>
        
        {/* Диалог удаления */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>
              Вы уверены, что хотите удалить этот элемент?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleDelete} color="error">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  export default FileGrid;
