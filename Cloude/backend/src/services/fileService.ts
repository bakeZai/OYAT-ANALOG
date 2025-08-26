// backend/src/services/fileService.ts
import { supabase, supabaseAdmin } from '../config/supabase';
import path from 'path';
import fs from 'fs';
import logger from 'winston';

export class FileService {
  /**
   * Загружает файл в Supabase Storage и сохраняет метаданные в БД.
   * @param file Объект файла, предоставленный Multer.
   * @param userId Идентификатор пользователя.
   * @param folderId Идентификатор папки (необязательно).
   * 
   * 
   */


  
  async uploadFile(file: Express.Multer.File, userId: string, folderId?: string) {
    const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
    const filePath = `${userId}/${fileName}`;
    logger.info(`Uploading file: ${file.originalname} for user ${userId}, folder ${folderId || 'root'}`);

    try {
      // Загрузка в Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(filePath, fs.readFileSync(file.path), {
          contentType: file.mimetype,
        });

      if (uploadError) {
        logger.error(`Upload failed for ${filePath}: ${uploadError.message}`);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      logger.info(`File uploaded to Storage: ${filePath}`);

      // Сохранение метаданных
      const { data: fileData, error: dbError } = await supabaseAdmin
        .from('files')
        .insert([
          {
            name: fileName,
            original_name: file.originalname,
            size: file.size,
            mime_type: file.mimetype,
            storage_path: filePath,
            folder_id: folderId || null,
            user_id: userId,
          },
        ])
        .select()
        .single();

      if (dbError) {
        logger.error(`DB insert failed for ${filePath}: ${dbError.message}`);
        await supabaseAdmin.storage.from('files').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }
      logger.info(`File metadata saved: ${fileData.id}`);

      // Обновление storage_used
      await this.updateUserStorageUsed(userId);
      logger.info(`User storage updated for ${userId}`);

      return fileData;
    } finally {
      // Удаление временного файла
      fs.unlink(file.path, (err) => {
        if (err) logger.error(`Failed to delete temp file ${file.path}: ${err.message}`);
      });
    }
  }

  /**
   * Обновляет количество использованного места в профиле пользователя.
   */
  private async updateUserStorageUsed(userId: string) {
    logger.info(`Updating storage usage for user ${userId}`);
    const { data: files, error } = await supabase
      .from('files')
      .select('size')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) {
      logger.error(`Failed to fetch files for storage update: ${error.message}`);
      throw error;
    }

    const totalSize = files?.reduce((sum, file) => sum + file.size, 0) || 0;
    logger.info(`Calculated total storage: ${totalSize} bytes for user ${userId}`);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ storage_used: totalSize })
      .eq('id', userId);

    if (updateError) {
      logger.error(`Failed to update storage_used: ${updateError.message}`);
      throw updateError;
    }
  }

  /**
   * Получает файлы и папки пользователя.
   */
  async getUserFilesAndFolders(userId: string, folderId?: string) {
    logger.info(`Fetching files and folders for user ${userId}, folder ${folderId || 'root'}`);
    try {
      const filesQuery = supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (folderId) {
        filesQuery.eq('folder_id', folderId);
      } else {
        filesQuery.is('folder_id', null);
      }

      const foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .eq('parent_id', folderId || null);

      const [filesResult, foldersResult] = await Promise.all([filesQuery, foldersQuery]);
      const { data: files, error: filesError } = filesResult;
      const { data: folders, error: foldersError } = foldersResult;

      if (filesError || foldersError) {
        logger.error(`Supabase error: ${filesError?.message || foldersError?.message} | User: ${userId}`);
        throw new Error(`Failed to fetch: ${filesError?.message || foldersError?.message}`);
      }

      logger.info(`Fetched ${files.length} files and ${folders.length} folders for user ${userId}`);
      return [...folders, ...files];
    } catch (err: any) {
      logger.error(`Unexpected error in getUserFilesAndFolders: ${err.message}`);
      throw err;
    }
  }

  // Остальные методы (deleteFile, renameFile, moveFile, getFileDownloadUrl, getUserStorage, getUserProfile)
  // аналогично дополняются logger.info и logger.error для каждой операции


  /**
   * Мягко удаляет файл.
   * @param fileId Идентификатор файла.
   * @param userId Идентификатор пользователя.
   */
  async deleteFile(fileId: string, userId: string) {
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !file) {
      throw new Error('File not found');
    }

    // Обновляем запись в БД (мягкое удаление)
    const { error: updateError } = await supabaseAdmin
      .from('files')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to delete file: ${updateError.message}`);
    }

    // Обновляем использованное место
    await this.updateUserStorageUsed(userId);

    return { message: 'File deleted successfully' };
  }

  /**
   * Переименовывает файл.
   * @param fileId Идентификатор файла.
   * @param newName Новое имя.
   * @param userId Идентификатор пользователя.
   */
  async renameFile(fileId: string, newName: string, userId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ original_name: newName }) // Используем original_name для отображения
      .eq('id', fileId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to rename file: ${error.message}`);
    }

    return data;
  }

  /**
   * Перемещает файл в другую папку.
   * @param fileId Идентификатор файла.
   * @param targetFolderId Идентификатор целевой папки.
   * @param userId Идентификатор пользователя.
   */
  async moveFile(fileId: string, targetFolderId: string | null, userId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ folder_id: targetFolderId })
      .eq('id', fileId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }

    return data;
  }

  /**
   * Генерирует URL для скачивания файла.
   * @param fileId Идентификатор файла.
   * @param userId Идентификатор пользователя.
   */
  async getFileDownloadUrl(fileId: string, userId: string) {
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !file) {
      throw new Error('File not found');
    }

    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(file.storage_path, 60); // URL действителен 60 секунд

    if (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Получает информацию об использовании хранилища и профиле пользователя.
   * @param userId Идентификатор пользователя.
   */
  async getUserStorage(userId: string) {
    await this.getUserProfile(userId);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('storage_used')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // В данном проекте общая емкость хранилища фиксирована на уровне 1 ГБ
    const totalStorage = 1000 * 1024 * 1024; // 1 GB в байтах

    return {
      used: profile.storage_used,
      total: totalStorage,
    };
  }

  /**
   * Находит или создает профиль пользователя.
   * @param userId Идентификатор пользователя.
   */
  private async getUserProfile(userId: string) {
    // Проверяем, существует ли профиль
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
  
    if (fetchError && fetchError.code === 'PGRST116') { // запись не найдена
      // создаем новый профиль
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: null,
          avatar_url: null,
          storage_used: 0,
          storage_limit: 1000 * 1024 * 1024, // 1GB по умолчанию
        }]);
  
      if (insertError) {
        throw new Error(`Failed to create user profile: ${insertError.message}`);
      }
  
      return { message: 'User profile created' };
    }
  
    if (fetchError) {
      throw new Error(`Failed to find user profile: ${fetchError.message}`);
    }
  
    return { message: 'User profile already exists' };
  }
}
