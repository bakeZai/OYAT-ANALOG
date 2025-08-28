// app/dashboard/page.tsx - ЦЕНТРАЛИЗОВАННОЕ УПРАВЛЕНИЕ ЗАПРОСАМИ

'use client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFiles } from '@/hooks/useFiles';
import Layout from '@/components/layout/Layout';
import FileGrid from '@/components/files/FileGrid';
import FileUpload from '@/components/files/FileUpload';
import FolderManager from '@/components/files/FolderManager';
import Loading from '@/components/common/Loading';
import { Box, Button, Typography, Breadcrumbs, Link } from '@mui/material';
import { CloudUpload, CreateNewFolder } from '@mui/icons-material';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  
  // ✅ Состояние для текущей папки и навигации
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'Главная' }
  ]);

  // ✅ ЕДИНСТВЕННЫЙ useFiles hook для всего dashboard
  const { 
    files, 
    loading: filesLoading, 
    error, 
    refreshFiles 
  } = useFiles(currentFolderId);

  // ✅ Состояние для модальных окон
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);

  // ✅ Навигация по папкам
  const handleFolderClick = useCallback((folder: any) => {
    console.log('📁 Navigating to folder:', folder.name);
    setCurrentFolderId(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  }, []);

  // ✅ Навигация по breadcrumbs
  const handleBreadcrumbClick = useCallback((targetId: string | null, index: number) => {
    console.log('🧭 Navigating to breadcrumb:', targetId);
    setCurrentFolderId(targetId);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  }, []);

  // ✅ Обработчики для модальных окон
  const handleUploadSuccess = useCallback(() => {
    console.log('✅ Upload successful, refreshing files...');
    refreshFiles();
  }, [refreshFiles]);

  const handleFolderCreated = useCallback(() => {
    console.log('✅ Folder created, refreshing files...');
    refreshFiles();
  }, [refreshFiles]);

  // Проверки загрузки и авторизации
  if (authLoading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Typography variant="h5">Необходима авторизация</Typography>
      </Layout>
    );
  }

  return (
    <Layout files={files}> {/* ✅ Передаем files в Layout для storage stats */}
      <Box>
        {/* Хлебные крошки */}
        <Breadcrumbs sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={`${crumb.id}-${index}`}
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
              onClick={() => {
                if (index < breadcrumbs.length - 1) {
                  handleBreadcrumbClick(crumb.id, index);
                }
              }}
              sx={{ cursor: index < breadcrumbs.length - 1 ? 'pointer' : 'default' }}
            >
              {crumb.name}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Кнопки действий */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
            disabled={filesLoading}
          >
            Загрузить файл
          </Button>
          <Button
            variant="outlined"
            startIcon={<CreateNewFolder />}
            onClick={() => setFolderDialogOpen(true)}
            disabled={filesLoading}
          >
            Создать папку
          </Button>
        </Box>

        {/* Отображение ошибок */}
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Ошибка: {error}
          </Typography>
        )}

        {/* Список файлов */}
        {filesLoading ? (
          <Loading />
        ) : (
          <FileGrid
            files={files}
            onFolderClick={handleFolderClick}
            onRefresh={refreshFiles}
          />
        )}

        {/* Модальные окна */}
        <FileUpload
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          currentFolderId={currentFolderId}
        />

        <FolderManager
          open={folderDialogOpen}
          onClose={() => setFolderDialogOpen(false)}
          onFolderCreated={handleFolderCreated}
          onCreateFolder={async (name: string) => {
            // Эта функция будет реализована в FolderManager через useFiles
            console.log('Creating folder:', name);
          }}
        />
      </Box>
    </Layout>
  );
}