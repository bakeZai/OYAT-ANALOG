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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileController = void 0;
const fileService_1 = require("../services/fileService");
const fileService = new fileService_1.FileService();
class FileController {
    /**
     * Загрузка файла
     */
    uploadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No file provided' });
                }
                const { folderId } = req.body;
                const file = yield fileService.uploadFile(req.file, req.user.id, folderId);
                res.status(201).json(file);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     * Получение списка файлов
     */
    getFiles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { folderId } = req.query;
                const files = yield fileService.getUserFiles(req.user.id, folderId);
                res.json(files);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     * Удаление файла (мягкое удаление)
     */
    deleteFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fileId } = req.params;
                yield fileService.deleteFile(fileId, req.user.id);
                res.status(200).json({ message: 'File deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     * Переименование файла
     */
    renameFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fileId } = req.params;
                const { newName } = req.body;
                const updatedFile = yield fileService.renameFile(fileId, newName, req.user.id);
                res.json(updatedFile);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     * Получение URL для скачивания файла
     */
    getFileDownloadUrl(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fileId } = req.params;
                const signedUrl = yield fileService.getFileDownloadUrl(fileId, req.user.id);
                res.json({ url: signedUrl });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    /**
     * Получение данных об использовании хранилища
     */
    getStorageUsage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const usage = yield fileService.getUserStorage(req.user.id);
                res.json(usage);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}
exports.FileController = FileController;
