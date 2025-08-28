// backend/src/routes/files.ts
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

// GET /api/files - получить список файлов и папок
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res) => {
  console.log('📋 Files list request from user:', req.user?.id);

  try {
    const { folderId } = req.query;
    const userId = req.user!.id;

    // Получаем файлы
    let filesQuery = supabaseAdmin
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
      .order('created_at', { ascending: false });

    if (folderId && folderId !== 'null') {
      filesQuery = filesQuery.eq('folder_id', folderId);
    } else {
      filesQuery = filesQuery.is('folder_id', null);
    }

    // Получаем папки
    let foldersQuery = supabaseAdmin
      .from('folders')
      .select(`
        id,
        name,
        created_at,
        parent_id
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
      
    if (folderId && folderId !== 'null') {
      foldersQuery = foldersQuery.eq('parent_id', folderId);
    } else {
      foldersQuery = foldersQuery.is('parent_id', null);
    }

    // ✅ Объединяем запросы для файлов и папок в один Promise.all
    const [filesResult, foldersResult] = await Promise.all([filesQuery, foldersQuery]);
    const { data: filesData, error: filesError } = filesResult;
    const { data: foldersData, error: foldersError } = foldersResult;

    if (filesError || foldersError) {
      console.error('💥 Database error:', filesError?.message || foldersError?.message);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }

    // ✅ Объединяем результаты в единый массив
    const items = [
      ...(foldersData || []).map(folder => ({ ...folder, type: 'folder' })),
      ...(filesData || []).map(file => ({
        ...file,
        type: 'file',
      }))
    ];

    console.log(`📊 Found ${items.length} items for user ${userId}`);
    res.json({ files: items });

  } catch (error) {
    console.error('💥 Error in GET /files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

    if (!file.buffer) {
      console.error('❌ File buffer is missing');
      return res.status(400).json({ error: 'File buffer is missing' });
    }

    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}-${file.originalname}`;

    console.log('💾 Uploading to storage:', fileName);

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

// DELETE /api/files/:id - удалить файл
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
  console.log('🗑️ Delete request for file:', req.params.id);

  try {
    const { id } = req.params;
    const userId = req.user!.id;

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
      console.log('💥 Database error:', error);
      return res.status(500).json({ error: 'Failed to rename file' });
    }

    console.log('✅ File renamed:', id, 'to', name);
    res.json({ success: true, file: data });

  } catch (error) {
    console.error('💥 Error in PUT /files/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Новый маршрут для генерации подписанного URL для предварительного просмотра
router.get('/:fileId/preview-url', authenticateUser, async (req: AuthenticatedRequest, res) => {
  console.log('🖼️ Preview URL request received');
  try {
    const { fileId } = req.params;
    const userId = req.user!.id;

    const { data: fileData, error: dbError } = await supabaseAdmin
      .from('files')
      .select('storage_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (dbError || !fileData) {
      console.error('❌ File not found or user unauthorized:', dbError);
      return res.status(404).json({ error: 'File not found or access denied.' });
    }

    const storagePath = fileData.storage_path;

    const { data, error: storageError } = await supabaseAdmin
      .storage
      .from('files')
      .createSignedUrl(storagePath, 600); // Срок действия 600 секунд (10 минут)

    if (storageError) {
      console.error('💥 Error generating signed URL:', storageError);
      return res.status(500).json({ error: 'Failed to generate preview URL.' });
    }

    console.log('✅ Signed URL generated successfully:', data.signedUrl);
    return res.json({ url: data.signedUrl });

  } catch (error) {
    console.error('💥 Unexpected error in preview-url route:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
