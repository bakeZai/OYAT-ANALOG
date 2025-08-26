// frontend/src/lib/api.ts

import { File, Folder } from '@/types/files';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Загрузка файла на сервер.
 * @param file Файл, который нужно загрузить.
 * @param currentFolderId ID текущей папки.
 * @param token The user's authentication token. ⬅️ ДОБАВЛЕНО
 */
export const uploadFileToApi = async (file: globalThis.File, currentFolderId: string | null, token: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (currentFolderId) {
    formData.append('folderId', currentFolderId);
  }

  const response = await fetch(`${API_URL}/files/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}` // ⬅️ ДОБАВЛЕНО
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка загрузки файла');
  }

  return response.json();
};

/**
 * Получение списка файлов и папок для текущей папки.
 * @param currentFolderId ID текущей папки.
 * @param token The user's authentication token.
 */
export const fetchUserFiles = async (currentFolderId: string | null, token: string): Promise<(File | Folder)[]> => {
  const params = new URLSearchParams();
  if (currentFolderId) {
    params.append('folderId', currentFolderId);
  }

  const response = await fetch(`${API_URL}/files?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⬅️ УЖЕ ИСПРАВЛЕНО
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


/**
 * Удаление файла или папки.
 * @param id ID файла или папки.
 * @param token The user's authentication token. ⬅️ ДОБАВЛЕНО
 */
export const deleteFileFromApi = async (id: string, token: string) => {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⬅️ ДОБАВЛЕНО
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка удаления');
  }

  return response.json();
};

/**
 * Переименование файла или папки.
 * @param id ID файла или папки.
 * @param newName Новое имя.
 * @param token The user's authentication token. ⬅️ ДОБАВЛЕНО
 */
export const renameFileInApi = async (id: string, newName: string, token: string) => {
  const response = await fetch(`${API_URL}/files/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⬅️ ДОБАВЛЕНО
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка переименования');
  }

  return response.json();
};

/**
 * Создание новой папки.
 * @param folderName Имя новой папки.
 * @param parentFolderId ID родительской папки.
 * @param token The user's authentication token. ⬅️ ДОБАВЛЕНО
 */
export const createFolderInApi = async (folderName: string, parentFolderId: string | null, token: string) => {
  const response = await fetch(`${API_URL}/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⬅️ ДОБАВЛЕНО
    },
    body: JSON.stringify({ name: folderName, parentId: parentFolderId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка создания папки');
  }

  return response.json();
};