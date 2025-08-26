// frontend/src/hooks/useFiles.tsx

import { useState, useEffect } from 'react';
import { File, Folder } from '@/types/files';
import { fetchUserFiles, uploadFileToApi, deleteFileFromApi, renameFileInApi, createFolderInApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth'; // ⬅️ IMPORT THE AUTH HOOK

/**
 * Custom hook for managing files and folders.
 * @param currentFolderId ID of the current folder whose contents need to be displayed.
 */
export const useFiles = (currentFolderId: string | null = null) => {
  const [files, setFiles] = useState<(File | Folder)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ➡️ GET THE USER'S SESSION & TOKEN
  const { session } = useAuth();
  const token = session?.access_token;

  // Load files when the current folder or user session changes
  useEffect(() => {
    const getFiles = async () => {
      // ➡️ Check if a token exists before fetching
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchUserFiles(currentFolderId, token); // ⬅️ PASS THE TOKEN
        setFiles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    getFiles();
  }, [currentFolderId, token]); // ⬅️ ADD TOKEN TO THE DEPENDENCY ARRAY

  /**
   * Forces a refresh of the file list.
   */
  const refreshFiles = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserFiles(currentFolderId, token); // ⬅️ PASS THE TOKEN
      setFiles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Uploads a new file.
   * @param file The file object.
   */
  const uploadFile = async (file: globalThis.File) => {
    if (!token) throw new Error('Authentication token is missing.');
    try {
      await uploadFileToApi(file, currentFolderId, token); // ⬅️ PASS THE TOKEN
      await refreshFiles(); // Refresh after successful upload
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Deletes a file.
   * @param fileId The ID of the file to delete.
   */
  const deleteFile = async (fileId: string) => {
    if (!token) throw new Error('Authentication token is missing.');
    try {
      await deleteFileFromApi(fileId, token); // ⬅️ PASS THE TOKEN
      await refreshFiles();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Renames a file.
   * @param fileId The ID of the file to rename.
   * @param newName The new name.
   */
  const renameFile = async (fileId: string, newName: string) => {
    if (!token) throw new Error('Authentication token is missing.');
    try {
      await renameFileInApi(fileId, newName, token); // ⬅️ PASS THE TOKEN
      await refreshFiles();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Creates a new folder.
   * @param folderName The name of the new folder.
   */
  const createFolder = async (folderName: string) => {
    if (!token) throw new Error('Authentication token is missing.');
    try {
      await createFolderInApi(folderName, currentFolderId, token); // ⬅️ PASS THE TOKEN
      await refreshFiles();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

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