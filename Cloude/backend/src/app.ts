// Эта строка должна быть первой
import 'dotenv/config'; 

// Затем остальные импорты
import express from 'express';
import cors from 'cors';
import fileRoutes from './routes/files';
import { requestLogger } from './middleware/logger';

const app = express();

// Middleware (в правильном порядке)
app.use(requestLogger); // Логирование запросов
app.use(cors()); // CORS должен быть до парсинга JSON
app.use(express.json()); // Парсинг JSON (только один раз!)

// Основной маршрут для проверки работоспособности сервера
app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

// Routes
app.use('/api/files', fileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});