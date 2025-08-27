  // backend/src/routes/files.ts - С УЛУЧШЕННЫМ ЛОГИРОВАНИЕМ

  import express from 'express';
  import multer from 'multer';
  import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
  import { supabaseAdmin } from '../config/supabase';

  const router = express.Router();

  // Настройка multer для обработки файлов
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  });

  // POST /api/files/upload - загрузить файл
  router.post('/upload', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    console.log('📁 Upload request received');
    console.log('User:', req.user?.id);
    console.log('File received:', req.file ? 'Yes' : 'No');
    
    try {
      const file = req.file;
      const { folderId } = req.body;
      const userId = req.user!.id;

      if (!file) {
        console.error('❌ No file provided');
        return res.status(400).json({ error: 'No file provided' });
      }

      console.log('📄 File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer?.length || 0
      });

      // Проверяем, что buffer существует
      if (!file.buffer) {
        console.error('❌ File buffer is missing');
        return res.status(400).json({ error: 'File buffer is missing' });
      }

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}-${file.originalname}`;
      
      console.log('💾 Uploading to storage:', fileName);

      // Загружаем в Supabase Storage
      const { data: storageData, error: storageError } = await supabaseAdmin.storage
        .from('files')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error('💥 Storage error:', storageError);
        return res.status(500).json({ 
          error: 'Failed to upload file to storage',
          details: storageError.message 
        });
      }

      console.log('✅ Storage upload successful:', storageData?.path);

      // Сохраняем метаданные в базу данных
      console.log('💽 Saving metadata to database...');
      const { data: dbData, error: dbError } = await supabaseAdmin
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
        console.error('💥 Database error:', dbError);
        // Удаляем файл из storage если не удалось сохранить в БД
        await supabaseAdmin.storage.from('files').remove([fileName]);
        return res.status(500).json({ 
          error: 'Failed to save file metadata',
          details: dbError.message 
        });
      }

      console.log('✅ Database save successful:', dbData.id);
      console.log('🎉 File upload complete:', file.originalname);

      res.json({ 
        success: true, 
        file: {
          ...dbData,
          type: 'file',
          url: supabaseAdmin.storage.from('files').getPublicUrl(fileName).data.publicUrl
        }
      });

    } catch (error) {
      console.error('💥 Unexpected error in upload:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/files - получить список файлов
  router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
    console.log('📋 Files list request from user:', req.user?.id);
    
    try {
      const { folderId } = req.query;
      const userId = req.user!.id;

      // Получаем файлы из базы данных
      let query = supabaseAdmin
  .from('files')
  .select(`
    id,
    name,
    original_name,
    size,
    mime_type,
    storage_path,
    created_at,
    folder_id,
    is_deleted
  `)
  .eq('user_id', userId)
  .eq('is_deleted', false);

if (folderId) {
  query = query.eq('folder_id', folderId);
} else {
  query = query.is('folder_id', null);
}

const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('💥 Database error:', error);
        return res.status(500).json({ error: 'Failed to fetch files' });
      }

      // Добавляем публичные URL для файлов
      const filesWithUrls = (data || []).map(file => ({
        ...file,
        type: 'file',
        url: supabaseAdmin.storage
          .from('files')
          .getPublicUrl(file.storage_path).data.publicUrl,
      }));

      console.log(`📊 Found ${filesWithUrls.length} files for user ${userId}`);
      res.json({ files: filesWithUrls });

    } catch (error) {
      console.error('💥 Error in GET /files:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/files/:id - удалить файл
  router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    console.log('🗑️ Delete request for file:', req.params.id);
    
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Помечаем файл как удаленный
      const { error } = await supabaseAdmin
        .from('files')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('💥 Database error:', error);
        return res.status(500).json({ error: 'Failed to delete file' });
      }

      console.log('✅ File marked as deleted:', id);
      res.json({ success: true });

    } catch (error) {
      console.error('💥 Error in DELETE /files/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/files/:id - переименовать файл
  router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    console.log('✏️ Rename request for file:', req.params.id);
    
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user!.id;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('files')
        .update({ name: name.trim() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('💥 Database error:', error);
        return res.status(500).json({ error: 'Failed to rename file' });
      }

      console.log('✅ File renamed:', id, 'to', name);
      res.json({ success: true, file: data });

    } catch (error) {
      console.error('💥 Error in PUT /files/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  export default router;