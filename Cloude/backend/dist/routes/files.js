"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const fileController_1 = require("../controllers/fileController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const fileController = new fileController_1.FileController();
// Загрузка файла
router.post('/upload', auth_1.authenticateUser, upload.single('file'), (req, res) => {
    fileController.uploadFile(req, res);
});
// Получение файлов
router.get('/', auth_1.authenticateUser, (req, res) => {
    fileController.getFiles(req, res);
});
// Переименование файла
router.put('/:fileId/rename', auth_1.authenticateUser, (req, res) => {
    fileController.renameFile(req, res);
});
// Удаление файла
router.delete('/:fileId', auth_1.authenticateUser, (req, res) => {
    fileController.deleteFile(req, res);
});
// Получение URL для скачивания файла
router.get('/:fileId/download', auth_1.authenticateUser, (req, res) => {
    fileController.getFileDownloadUrl(req, res);
});
// Получение данных о хранилище
router.get('/storage', auth_1.authenticateUser, (req, res) => {
    fileController.getStorageUsage(req, res);
});
exports.default = router;
