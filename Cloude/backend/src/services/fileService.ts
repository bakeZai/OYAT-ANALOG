// backend/src/services/fileService.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ

import { supabase, supabaseAdmin } from '../config/supabase';
import path from 'path';

export class FileService {
  /**
   * Загружает файл в Supabase Storage и сохраняет метаданные в БД.
   * @param file Объект файла, предоставленный Multer.
   * @param userId Идентификатор пользователя.
   * @param folderId Идентификатор папки (необязательно).
   */
  async uploadFile(file: Express.Multer.File, userId: string, folderId?: string) {
    const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`Uploading file: ${file.originalname} for user ${userId}, folder ${folderId || 'root'}`);
    console.log(`File buffer size: ${file.buffer?.length || 0} bytes`);

    try {
      // ✅ ИСПРАВЛЕНИЕ: используем file.buffer вместо fs.readFileSync(file.path)
      if (!file.buffer) {
        throw new Error('File buffer is missing. Make sure multer memoryStorage is configured correctly.');
      }

      // Загрузка в Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('files')
        .upload(filePath, file.buffer, { // ✅ Используем file.buffer
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error(`Upload failed for ${filePath}: ${uploadError.message}`);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      console.log(`File uploaded to Storage: ${filePath}`);

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
        console.error(`DB insert failed for ${filePath}: ${dbError.message}`);
        // Удаляем файл из storage если не удалось сохранить в БД
        await supabaseAdmin.storage.from('files').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }
      console.log(`File metadata saved: ${fileData.id}`);

      // Обновление storage_used
      await this.updateUserStorageUsed(userId);
      console.log(`User storage updated for ${userId}`);

      return fileData;
    } catch (error: any) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
    // ❌ УБИРАЕМ finally блок с fs.unlink - файла на диске нет!
  }

  /**
   * Обновляет количество использованного места в профиле пользователя.
   */
  private async updateUserStorageUsed(userId: string) {
    console.log(`Updating storage usage for user ${userId}`);
    const { data: files, error } = await supabase
      .from('files')
      .select('size')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) {
      console.error(`Failed to fetch files for storage update: ${error.message}`);
      throw error;
    }

    const totalSize = files?.reduce((sum, file) => sum + file.size, 0) || 0;
    console.log(`Calculated total storage: ${totalSize} bytes for user ${userId}`);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ storage_used: totalSize })
      .eq('id', userId);

    if (updateError) {
      console.error(`Failed to update storage_used: ${updateError.message}`);
      throw updateError;
    }
  }

  // Остальные методы остаются без изменений...
  async getUserFilesAndFolders(userId: string, folderId?: string) {
    console.log(`Fetching files and folders for user ${userId}, folder ${folderId || 'root'}`);
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
        console.error(`Supabase error: ${filesError?.message || foldersError?.message} | User: ${userId}`);
        throw new Error(`Failed to fetch: ${filesError?.message || foldersError?.message}`);
      }

      console.log(`Fetched ${files?.length || 0} files and ${folders?.length || 0} folders for user ${userId}`);
      return [...(folders || []), ...(files || [])];
    } catch (err: any) {
      console.error(`Unexpected error in getUserFilesAndFolders: ${err.message}`);
      throw err;
    }
  }

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

    await this.updateUserStorageUsed(userId);
    return { message: 'File deleted successfully' };
  }

  async renameFile(fileId: string, newName: string, userId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ original_name: newName })
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
      .createSignedUrl(file.storage_path, 60);

    if (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }

    return data.signedUrl;
  }

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

    const totalStorage = 1000 * 1024 * 1024; // 1 GB в байтах

    return {
      used: profile.storage_used,
      total: totalStorage,
    };
  }

  private async getUserProfile(userId: string) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
  
    if (fetchError && fetchError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: null,
          avatar_url: null,
          storage_used: 0,
          storage_limit: 1000 * 1024 * 1024,
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