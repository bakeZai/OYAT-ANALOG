import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { FileService } from "../services/fileService";

const fileService = new FileService();

export class FileController {
  /**
   * Загрузка файла
   */
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { folderId } = req.body;
      const file = await fileService.uploadFile(
        req.file,
        req.user!.id,
        folderId
      );

      res.status(201).json(file);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
