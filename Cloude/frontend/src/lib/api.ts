// frontend/src/lib/api.ts - С УЛУЧШЕННЫМ ЛОГИРОВАНИЕМ

import { File, Folder } from '@/types/files';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Загрузка файла на сервер.
 */
export const uploadFileToApi = async (file: globalThis.File, currentFolderId: string | null, token: string) => {
  console.log('🚀 Starting file upload:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    currentFolderId,
    hasToken: !!token
  });

  const formData = new FormData();
  formData.append('file', file);
  if (currentFolderId) {
    formData.append('folderId', currentFolderId);
  }

  console.log('📡 Sending request to:', `${API_URL}/files/upload`);

  try {
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    console.log('📨 Response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ Server error response:', errorData);
      } catch (parseError) {
        // Если не удается распарсить JSON, получаем текст
        const errorText = await response.text();
        console.error('❌ Server error (text):', errorText);
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.error || errorData.message || 'Ошибка загрузки файла');
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return result;

  } catch (error) {
    console.error('💥 Upload failed:', error);
    throw error;
  }
};

// Остальные функции без изменений...
export const fetchUserFiles = async (currentFolderId: string | null, token: string): Promise<(File | Folder)[]> => {
  const params = new URLSearchParams();
  if (currentFolderId) {
    params.append('folderId', currentFolderId);
  }

  const response = await fetch(`${API_URL}/files?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error(`Ошибка при получении файлов. Статус: ${response.status}`);
    const errorData = await response.json();
    if (response.status === 401) {
      throw new Error(`401: Доступ запрещен. Необходима авторизация.`);
    }
    if (response.status === 404) {
      throw new Error(`202: Файлы не найдены в этой папке.`);
    } else if (response.status >= 500) {
      throw new Error(`101: Ошибка сервера. Повторите попытку.`);
    }
    throw new Error(errorData.message || 'Ошибка получения файлов');
  }

  const { files } = await response.json();
  console.log("Полученные файлы:", files);

  return files || [];
};

export const deleteFileFromApi = async (id: string, token: string) => {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка удаления');
  }

  return response.json();
};

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
    throw new Error(errorData.message || 'Ошибка переименования');
  }

  return response.json();
};

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
    throw new Error(errorData.message || 'Ошибка создания папки');
  }

  return response.json();
};