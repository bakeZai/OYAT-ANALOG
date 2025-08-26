"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const files_1 = __importDefault(require("./routes/files"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Маршрут для проверки работоспособности
app.get('/', (req, res) => {
    res.send('Cloud Storage Backend is running!');
});
// Основные маршруты API
app.use('/api/files', files_1.default);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
