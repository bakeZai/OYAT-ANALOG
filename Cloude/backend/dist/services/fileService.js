"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const supabase_1 = require("../config/supabase");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class FileService {
    /**
     * Загружает файл в Supabase Storage и сохраняет метаданные в БД.
     * @param file Объект файла, предоставленный Multer.
     * @param userId Идентификатор пользователя.
     * @param folderId Идентификатор папки (необязательно).
     */
    uploadFile(file, userId, folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileName = `${Date.now()}-${path_1.default.basename(file.originalname)}`;
            const filePath = `${userId}/${fileName}`;
            // Загрузка файла в Supabase Storage
            const { data: uploadData, error: uploadError } = yield supabase_1.supabase.storage
                .from('files')
                .upload(filePath, fs_1.default.readFileSync(file.path), {
                contentType: file.mimetype,
            });
            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }
            // Сохранение метаданных файла в базе данных
            const { data: fileData, error: dbError } = yield supabase_1.supabase
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
                // Очистка загруженного файла, если сохранение в БД не удалось
                yield supabase_1.supabase.storage.from('files').remove([filePath]);
                throw new Error(`Database error: ${dbError.message}`);
            }
            // Обновление использованного места в профиле пользователя
            yield this.updateUserStorageUsed(userId);
            return fileData;
        });
    }
    /**
     * Получает список файлов пользователя.
     * @param userId Идентификатор пользователя.
     * @param folderId Идентификатор папки.
     */
    getUserFiles(userId, folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
                .from('files')
                .select('*')
                .eq('user_id', userId)
                .eq('is_deleted', false)
                .eq('folder_id', folderId || null)
                .order('created_at', { ascending: false });
            if (error) {
                throw new Error(`Failed to fetch files: ${error.message}`);
            }
            return data;
        });
    }
    /**
     * Мягко удаляет файл.
     * @param fileId Идентификатор файла.
     * @param userId Идентификатор пользователя.
     */
    deleteFile(fileId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: file, error: fetchError } = yield supabase_1.supabase
                .from('files')
                .select('*')
                .eq('id', fileId)
                .eq('user_id', userId)
                .single();
            if (fetchError || !file) {
                throw new Error('File not found');
            }
            // Обновляем запись в БД (мягкое удаление)
            const { error: updateError } = yield supabase_1.supabase
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
            yield this.updateUserStorageUsed(userId);
            return { message: 'File deleted successfully' };
        });
    }
    /**
     * Переименовывает файл.
     * @param fileId Идентификатор файла.
     * @param newName Новое имя.
     * @param userId Идентификатор пользователя.
     */
    renameFile(fileId, newName, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    /**
     * Перемещает файл в другую папку.
     * @param fileId Идентификатор файла.
     * @param targetFolderId Идентификатор целевой папки.
     * @param userId Идентификатор пользователя.
     */
    moveFile(fileId, targetFolderId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data, error } = yield supabase_1.supabase
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
        });
    }
    /**
     * Генерирует URL для скачивания файла.
     * @param fileId Идентификатор файла.
     * @param userId Идентификатор пользователя.
     */
    getFileDownloadUrl(fileId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: file, error: fetchError } = yield supabase_1.supabase
                .from('files')
                .select('storage_path')
                .eq('id', fileId)
                .eq('user_id', userId)
                .eq('is_deleted', false)
                .single();
            if (fetchError || !file) {
                throw new Error('File not found');
            }
            const { data, error } = yield supabase_1.supabase.storage
                .from('files')
                .createSignedUrl(file.storage_path, 60); // URL действителен 60 секунд
            if (error) {
                throw new Error(`Failed to generate download URL: ${error.message}`);
            }
            return data.signedUrl;
        });
    }
    /**
     * Обновляет количество использованного места в профиле пользователя.
     * @param userId Идентификатор пользователя.
     */
    updateUserStorageUsed(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: files } = yield supabase_1.supabase
                .from('files')
                .select('size')
                .eq('user_id', userId)
                .eq('is_deleted', false);
            const totalSize = (files === null || files === void 0 ? void 0 : files.reduce((sum, file) => sum + file.size, 0)) || 0;
            yield supabase_1.supabase
                .from('profiles')
                .update({ storage_used: totalSize })
                .eq('id', userId);
        });
    }
    /**
     * Получает информацию об использовании хранилища и профиле пользователя.
     * @param userId Идентификатор пользователя.
     */
    getUserStorage(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: profile, error: profileError } = yield supabase_1.supabase
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
                total: totalStorage
            };
        });
    }
}
exports.FileService = FileService;
