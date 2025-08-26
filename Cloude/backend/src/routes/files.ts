import express from 'express';
import multer from 'multer';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = express.Router();

// Настройка multer для обработки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// GET /api/files - получить список файлов
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { folderId } = req.query;
    const userId = req.user!.id;

    // Получаем файлы из базы данных
    const { data, error } = await supabase
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
      .eq('is_deleted', false)
      .eq('folder_id', folderId || null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch files' });
    }

    // Добавляем публичные URL для файлов
    const filesWithUrls = (data || []).map(file => ({
      ...file,
      type: 'file', // Добавляем тип для совместимости с frontend
      url: supabase.storage
        .from('files')
        .getPublicUrl(file.storage_path).data.publicUrl,
    }));

    console.log(`Found ${filesWithUrls.length} files for user ${userId}`);
    res.json({ files: filesWithUrls });

  } catch (error) {
    console.error('Error in GET /files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/files/upload - загрузить файл
router.post('/upload', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const file = req.file;
    const { folderId } = req.body;
    const userId = req.user!.id;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-${file.originalname}`;

    // Загружаем в Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    // Сохраняем метаданные в базу данных
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
      // Удаляем файл из storage если не удалось сохранить в БД
      await supabase.storage.from('files').remove([fileName]);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }

    console.log(`File uploaded successfully: ${file.originalname}`);
    res.json({ 
      success: true, 
      file: {
        ...dbData,
        type: 'file',
        url: supabase.storage.from('files').getPublicUrl(fileName).data.publicUrl
      }
    });

  } catch (error) {
    console.error('Error in POST /upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/files/:id - удалить файл
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Помечаем файл как удаленный
    const { error } = await supabase
      .from('files')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /files/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/files/:id - переименовать файл
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user!.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data, error } = await supabase
      .from('files')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to rename file' });
    }

    res.json({ success: true, file: data });

  } catch (error) {
    console.error('Error in PUT /files/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;