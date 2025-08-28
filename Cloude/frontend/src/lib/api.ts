// frontend/src/lib/api.ts

import { File, Folder } from '@/types/files';

// Используем переменную окружения для определения базового URL API.
// Локально будет использоваться 'http://localhost:5000/api'.
// На Vercel будет использоваться значение, указанное в настройках проекта.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Кэш для предотвращения дублирования запросов.
const requestCache = new Map<string, Promise<any>>();

/**
 * Получение списка файлов и папок для текущей папки.
 */
export const fetchUserFiles = async (currentFolderId: string | null, token: string): Promise<(File | Folder)[]> => {
  // Создаем уникальный ключ для кэширования, чтобы избежать дублирования запросов.
  const cacheKey = `files-${currentFolderId || 'root'}-${token.substring(0, 10)}`;

  // Если такой запрос уже выполняется, возвращаем существующий Promise.
  if (requestCache.has(cacheKey)) {
    console.log(`Using cached request for: ${cacheKey}`);
    return requestCache.get(cacheKey)!;
  }

  const params = new URLSearchParams();
  if (currentFolderId) {
    params.append('folderId', currentFolderId);
  }

  // Создаем и выполняем асинхронный запрос.
  const requestPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/files?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.error(`Error fetching files. Status: ${response.status}`);
        const errorData = await response.json();
        throw new Error(errorData.message || `API error with status ${response.status}`);
      }

      const { files } = await response.json();
      console.log("Received files:", files);
      return files || [];
    } finally {
      // Удаляем промис из кэша, чтобы позволить новые запросы.
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 1000);
    }
  })();

  // Сохраняем промис в кэш перед его возвратом.
  requestCache.set(cacheKey, requestPromise);
  
  return requestPromise;
};

/**
 * Загрузка файла на сервер.
 */
export const uploadFileToApi = async (file: globalThis.File, currentFolderId: string | null, token: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (currentFolderId) {
    formData.append('folderId', currentFolderId);
  }

  console.log('Sending request to:', `${API_URL}/files/upload`);

  try {
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('Server error response:', errorData);
      } catch (parseError) {
        const errorText = await response.text();
        console.error('Server error (text):', errorText);
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.error || errorData.message || 'Error uploading file');
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    
    // Очищаем кэш после успешной загрузки, чтобы обновить список файлов.
    requestCache.clear();
    
    return result;

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

/**
 * Удаление файла с сервера.
 */
export const deleteFileFromApi = async (id: string, token: string) => {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error deleting file');
  }

  return response.json();
};

/**
 * Переименование файла на сервере.
 */
export const renameFileInApi = async (id: string, newName: string, token: string) => {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error renaming file');
  }

  return response.json();
};

/**
 * Создание новой папки.
 */
export const createFolderInApi = async (folderName: string, parentFolderId: string | null, token: string) => {
  const response = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: folderName, parentId: parentFolderId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error creating folder');
  }

  return response.json();
};
