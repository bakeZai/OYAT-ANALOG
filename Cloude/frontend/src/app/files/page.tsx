// frontend/src/app/files/page.tsx

'use client';

import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Fab } from '@mui/material';
import { Add as AddIcon, CreateNewFolderOutlined as CreateFolderIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useFiles } from '@/hooks/useFiles';
import Layout from '@/components/layout/Layout';
import FileGrid from '@/components/files/FileGrid';
import FileUpload from '@/components/files/FileUpload';
import FolderManager from '@/components/files/FolderManager';
import { File, Folder } from '@/types/files';
import Link from 'next/link';

const FilesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { files, loading: filesLoading, error, refreshFiles } = useFiles(currentFolderId);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h5">Пожалуйста, войдите в систему.</Typography>
        <Link href="/login">Войти</Link>
      </Box>
    );
  }

  // Эта функция больше не нужна, так как FileUpload сам закрывает окно
  // и useFiles сам обновляет список файлов.
  // const handleUploadSuccess = () => {
  //   setIsUploadOpen(false);
  //   refreshFiles();
  // };

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
  };

  const handleFolderCreated = () => {
    setIsFolderManagerOpen(false);
    refreshFiles();
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            Мои файлыsss
          </Typography>
          <Box>
            <Fab
              color="secondary"
              aria-label="create folder"
              sx={{ mr: 2 }}
              onClick={() => setIsFolderManagerOpen(true)}
            >
              <CreateFolderIcon />
            </Fab>
            <Fab
              color="primary"
              aria-label="add file"
              onClick={() => setIsUploadOpen(true)}
            >
              <AddIcon />
            </Fab>
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        
        {filesLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        ) : (
          <FileGrid
            files={files}
            onFolderClick={handleFolderClick}
            onRefresh={refreshFiles}
          />
        )}
      </Box>
      <FileUpload
   open={isUploadOpen}
     onClose={() => setIsUploadOpen(false)}
   onUploadSuccess={refreshFiles} // ✅ вызываем refreshFiles после успешной загрузки
  currentFolderId={currentFolderId}
/>

<FolderManager
  open={isFolderManagerOpen}
  onClose={() => setIsFolderManagerOpen(false)}
  onFolderCreated={handleFolderCreated}
  onCreateFolder={async (folderName: string) => {
    console.log("Создаю папку:", folderName);
    setIsFolderManagerOpen(false); // ✅ используем правильное состояние
    await refreshFiles(); // ✅ используем refreshFiles
  }}
/>
    </Layout>
  );
};

export default FilesPage;