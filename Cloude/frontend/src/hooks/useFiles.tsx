// frontend/src/hooks/useFiles.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ДУБЛИРОВАНИЯ

import { useState, useEffect, useCallback, useRef } from 'react';
import { File, Folder } from '@/types/files';
import { fetchUserFiles, uploadFileToApi, deleteFileFromApi, renameFileInApi, createFolderInApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

/**
 * Custom hook for managing files and folders.
 * @param currentFolderId ID of the current folder whose contents need to be displayed.
 */
export const useFiles = (currentFolderId: string | null = null) => {
  const [files, setFiles] = useState<(File | Folder)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { session, user } = useAuth();
  const token = session?.access_token;
  
  // ✅ Отслеживаем уже выполненные запросы
  const lastFetchRef = useRef<string>('');
  const fetchingRef = useRef(false);

  // ✅ Загружаем файлы только при реальном изменении зависимостей
  useEffect(() => {
    if (!user || !token) {
      setFiles([]);
      setLoading(false);
      return;
    }

    // Создаем уникальный ключ для текущего запроса
    const currentKey = `${user.id}-${currentFolderId || 'root'}-${token.substring(0, 10)}`;
    
    // Если этот запрос уже выполнялся, пропускаем
    if (lastFetchRef.current === currentKey || fetchingRef.current) {
      console.log(`🚫 Skipping duplicate request for: ${currentKey}`);
      return;
    }

    const fetchFiles = async () => {
      fetchingRef.current = true;
      lastFetchRef.current = currentKey;
      
      setLoading(true);
      setError(null);

      try {
        console.log(`📂 Fetching files for folder: ${currentFolderId || 'root'}`);
        const data = await fetchUserFiles(currentFolderId, token);
        setFiles(data);
        console.log(`✅ Files loaded: ${data.length} items`);
      } catch (err: any) {
        console.error('❌ Fetch files error:', err);
        setError(err.message);
        setFiles([]);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    // Добавляем небольшую задержку для batch запросов
    const timeoutId = setTimeout(fetchFiles, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentFolderId, token, user?.id]); // ✅ Конкретные зависимости

  // ✅ Мемоизированная функция обновления списка (НЕ вызывает fetchFiles напрямую)
  const refreshFiles = useCallback(async () => {
    if (!user || !token || fetchingRef.current) return;
    
    console.log('🔄 Manual refresh requested...');
    // Сбрасываем кэш для принудительного обновления
    lastFetchRef.current = '';
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchUserFiles(currentFolderId, token);
      setFiles(data);
      console.log('✅ Manual refresh completed:', data.length, 'items');
    } catch (err: any) {
      console.error('❌ Manual refresh error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [currentFolderId, user?.id, token]);

  /**
   * Uploads a new file.
   */
  const uploadFile = useCallback(async (file: globalThis.File) => {
    if (!token) throw new Error('Authentication token is missing.');
    
    try {
      console.log('📤 Uploading file:', file.name);
      await uploadFileToApi(file, currentFolderId, token);
      await refreshFiles();
      console.log('✅ File uploaded and list refreshed');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentFolderId, token, refreshFiles]);

  /**
   * Deletes a file.
   */
  const deleteFile = useCallback(async (fileId: string) => {
    if (!token) throw new Error('Authentication token is missing.');
    
    try {
      console.log('🗑️ Deleting file:', fileId);
      await deleteFileFromApi(fileId, token);
      await refreshFiles();
      console.log('✅ File deleted and list refreshed');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [token, refreshFiles]);

  /**
   * Renames a file.
   */
  const renameFile = useCallback(async (fileId: string, newName: string) => {
    if (!token) throw new Error('Authentication token is missing.');
    
    try {
      console.log('✏️ Renaming file:', fileId, 'to', newName);
      await renameFileInApi(fileId, newName, token);
      await refreshFiles();
      console.log('✅ File renamed and list refreshed');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [token, refreshFiles]);

  /**
   * Creates a new folder.
   */
  const createFolder = useCallback(async (folderName: string) => {
    if (!token) throw new Error('Authentication token is missing.');
    
    try {
      console.log('📁 Creating folder:', folderName);
      await createFolderInApi(folderName, currentFolderId, token);
      await refreshFiles();
      console.log('✅ Folder created and list refreshed');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentFolderId, token, refreshFiles]);

  return {
    files,
    loading,
    error,
    refreshFiles,
    uploadFile,
    deleteFile,
    renameFile,
    createFolder
  };
};