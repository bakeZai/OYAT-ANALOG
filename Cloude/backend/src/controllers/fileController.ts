// backend/src/controllers/fileController.ts

import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabase, supabaseAdmin } from "../config/supabase";

// ✅ Добавим заглушку для fileService, чтобы код работал
// В реальном проекте вы бы импортировали его из отдельного файла
const fileService = {
  getUserFilesAndFolders: async (userId: string, folderId?: string) => {
    // Вставьте сюда логику из fileRoutes.ts GET-запроса
    // Например:
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return { files: data };
  },
  deleteFile: async (fileId: string, userId: string) => {
    // Логика удаления
  },
  renameFile: async (fileId: string, newName: string, userId: string) => {
    // Логика переименования
  },
  getFileDownloadUrl: async (fileId: string, userId: string) => {
    // Логика получения URL
  },
  getUserStorage: async (userId: string) => {
    // Логика получения данных о хранилище
  }
};


export class FileController {
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { folderId } = req.body;
      const userId = req.user!.id;
      const file = req.file;

      console.log('Uploading file:', file.originalname, 'Size:', file.size);
      console.log('Buffer available:', !!file.buffer);

      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}-${file.originalname}`;

      const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

      if (storageError) {
        console.error('Storage error:', storageError);
        res.status(500).json({ error: 'Failed to upload file to storage' });
        return; // ✅ Возвращаем, чтобы прервать выполнение
      }

      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert({
          name: file.originalname,
          original_name: file.originalname,
          size: file.size,
          mime_type: file.mimetype,
          storage_path: fileName,
          folder_id: folderId || null,
          user_id: userId
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        await supabaseAdmin.storage.from('files').remove([fileName]);
        res.status(500).json({ error: 'Failed to save file metadata' });
        return; // ✅ Возвращаем, чтобы прервать выполнение
      }

      console.log(`File uploaded successfully: ${file.originalname}`);
      res.json({
        success: true,
        file: {
          ...dbData,
          type: 'file'
        }
      });

    } catch (error) {
      console.error('Error in POST /upload:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Получение списка файлов
   */
  async getFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { folderId } = req.query;
      const files = await fileService.getUserFilesAndFolders(
        req.user!.id,
        folderId as string | undefined
      );

      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Удаление файла (мягкое удаление)
   */
  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      await fileService.deleteFile(fileId, req.user!.id);

      res.status(200).json({ message: "File deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Переименование файла
   */
  async renameFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      const { newName } = req.body;

      if (!newName) {
        res.status(400).json({ error: "New name is required" });
        return;
      }

      const updatedFile = await fileService.renameFile(
        fileId,
        newName,
        req.user!.id
      );

      res.json(updatedFile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Получение URL для скачивания файла
   */
  async getFileDownloadUrl(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { fileId } = req.params;
      const signedUrl = await fileService.getFileDownloadUrl(
        fileId,
        req.user!.id
      );

      res.json({ url: signedUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Получение данных об использовании хранилища
   */
  async getStorageUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const usage = await fileService.getUserStorage(req.user!.id);
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
